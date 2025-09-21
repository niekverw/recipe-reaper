import { v4 as uuidv4 } from 'uuid'
import { PostgreSQLDatabase } from './database-pg'
import { Recipe, CreateRecipeRequest, UpdateRecipeRequest, RecipeFilters, IngredientCategory } from '../types/recipe'
import { ingredientParser } from '../utils/ingredientParser'
import { IngredientCategoryParser } from '../utils/ingredientCategoryParser'
import { TagHelper } from '../utils/tagHelper'

// Database row interface (snake_case)
interface RecipeRow {
  id: string
  name: string
  description: string
  prep_time_minutes: number
  cook_time_minutes: number | null
  total_time_minutes: number | null
  servings: number
  ingredients: string
  instructions: string
  image: string | null
  image_sizes: string | null
  source_url: string | null
  is_public: boolean
  ai_enhanced_notes: string | null
  tags: string | null
  user_id: string | null
  household_id: string | null
  created_at: string
  updated_at: string
}

function rowToRecipe(row: RecipeRow): Recipe {
  const parsedIngredients = JSON.parse(row.ingredients)
  const parsedTags = row.tags ? JSON.parse(row.tags) : []
  const parsedImageSizes = row.image_sizes ? JSON.parse(row.image_sizes) : undefined

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes || undefined,
    totalTimeMinutes: row.total_time_minutes || undefined,
    servings: row.servings,
    ingredients: parsedIngredients,
    instructions: JSON.parse(row.instructions),
    image: row.image || undefined,
    imageSizes: parsedImageSizes,
    sourceUrl: row.source_url || undefined,
    isPublic: row.is_public === true,
    aiEnhancedNotes: row.ai_enhanced_notes || undefined,
    tags: parsedTags,
    userId: row.user_id || undefined,
    householdId: row.household_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export const recipeModel = {
  async findAll(filters: RecipeFilters = {}): Promise<Recipe[]> {
    const db = PostgreSQLDatabase.getInstance()
    let sql = 'SELECT * FROM recipes WHERE 1=1'
    const params: any[] = []

    // Simplified 2-level privacy: private (personal + household) vs public
    if (filters.scope === 'my' && filters.userId) {
      // User's accessible recipes: private recipes (personal + household)
      if (filters.householdId) {
        // User has household: show personal recipes + household recipes
        sql += ` AND ((user_id = $${params.length + 1} AND household_id IS NULL) OR household_id = $${params.length + 2})`
        params.push(filters.userId, filters.householdId)
      } else {
        // User has no household: show only personal recipes
        sql += ` AND (user_id = $${params.length + 1} AND household_id IS NULL)`
        params.push(filters.userId)
      }
    } else if (filters.scope === 'public') {
      // Only public recipes
      sql += ' AND is_public = true'
    } else if (filters.scope === 'all' && filters.userId) {
      // Everything user can see: private recipes + public recipes
      if (filters.householdId) {
        sql += ` AND ((user_id = $${params.length + 1} AND household_id IS NULL) OR household_id = $${params.length + 2} OR is_public = true)`
        params.push(filters.userId, filters.householdId)
      } else {
        sql += ` AND ((user_id = $${params.length + 1} AND household_id IS NULL) OR is_public = true)`
        params.push(filters.userId)
      }
    } else if (!filters.userId) {
      // Unauthenticated users can only see public recipes
      sql += ' AND is_public = true'
    }

    // Add search filter
    if (filters.search) {
      sql += ` AND (name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 2})`
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm)
    }

    // Add explicit public filter (overrides scope if set)
    if (filters.isPublic !== undefined) {
      sql += ` AND is_public = $${params.length + 1}`
      params.push(filters.isPublic)
    }

    // Add tag filter
    if (filters.tags && filters.tags.length > 0) {
      // Use JSON_EXTRACT to check if any of the provided tags exist in the recipe's tags array
      const tagConditions = filters.tags.map((_, index) => `JSON_EXTRACT(tags, "$") LIKE $${params.length + index + 1}`).join(' OR ')
      sql += ` AND (${tagConditions})`
      filters.tags.forEach(tag => {
        params.push(`%"${tag}"%`)
      })
    }

    // Add sorting
    switch (filters.sortBy) {
      case 'name':
        sql += ' ORDER BY name ASC'
        break
      case 'time':
        sql += ' ORDER BY COALESCE(total_time_minutes, prep_time_minutes) ASC'
        break
      case 'servings':
        sql += ' ORDER BY servings ASC'
        break
      case 'recent':
        sql += ' ORDER BY created_at DESC'
        break
      default:
        sql += ' ORDER BY created_at DESC'
    }

    // Add pagination
    if (filters.limit) {
      sql += ` LIMIT $${params.length + 1}`
      params.push(filters.limit)
    }
    if (filters.offset) {
      sql += ` OFFSET $${params.length + 1}`
      params.push(filters.offset)
    }

    const rows = await db.all<RecipeRow>(sql, params)
    return rows.map(rowToRecipe)
  },

  async findById(id: string): Promise<Recipe | null> {
    const db = PostgreSQLDatabase.getInstance()
    const row = await db.get<RecipeRow>('SELECT * FROM recipes WHERE id = $1', [id])
    return row ? rowToRecipe(row) : null
  },

  async checkPublicNameExists(name: string, excludeId?: string): Promise<boolean> {
    const db = PostgreSQLDatabase.getInstance()
    let sql = 'SELECT COUNT(*) as count FROM recipes WHERE name = $1 AND is_public = true'
    const params: any[] = [name.trim()]

    if (excludeId) {
      sql += ' AND id != $2'
      params.push(excludeId)
    }

    const result = await db.get<{ count: number }>(sql, params)
    return (result?.count || 0) > 0
  },

  async create(data: CreateRecipeRequest): Promise<Recipe> {
    const db = PostgreSQLDatabase.getInstance()
    const id = uuidv4()
    const now = new Date().toISOString()

    // Process ingredients - convert to categorized format
    const processedIngredients = IngredientCategoryParser.parseIngredientsFromMixed(data.ingredients)

    // Get flat ingredient list for validation and auto-inference
    const flatIngredients = IngredientCategoryParser.getAllIngredients(processedIngredients)

    // Validate ingredients using parser
    const { valid: validIngredients, invalid: invalidIngredients } = ingredientParser.validateIngredients(flatIngredients)

    if (invalidIngredients.length > 0) {
      console.warn('Some ingredients could not be parsed:', invalidIngredients)
    }

    // Normalize tags before storing
    const normalizedTags = data.tags ? TagHelper.normalizeTags(data.tags) : []

    // Auto-infer values if not provided
    const prepTimeMinutes = data.prepTimeMinutes || this.inferPrepTime(data.instructions, flatIngredients)
    const servings = data.servings || this.inferServings(flatIngredients)

    // Simplified 2-level privacy logic
    let isPublic = data.isPublic !== false // Default to true unless explicitly false
    let householdId = null

    if (!isPublic && data.userId) {
      // Private recipe: use household if user has one, otherwise personal
      householdId = data.householdId || null
    }

    // Auto-switch to private if name exists publicly (only for public recipes)
    if (isPublic && await this.checkPublicNameExists(data.name)) {
      isPublic = false
      householdId = data.householdId || null
    }

    const sql = `
      INSERT INTO recipes (
        id, name, description, prep_time_minutes, cook_time_minutes, total_time_minutes, servings,
        ingredients, instructions, image, image_sizes, source_url, is_public, user_id, household_id, copied_from, tags, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `

    const params = [
      id,
      data.name.trim(),
      data.description.trim(),
      prepTimeMinutes,
      data.cookTimeMinutes || null,
      data.totalTimeMinutes || null,
      servings,
      JSON.stringify(processedIngredients),
      JSON.stringify(data.instructions),
      data.image || null,
      data.imageSizes ? JSON.stringify(data.imageSizes) : null,
      data.sourceUrl || null,
      isPublic,
      data.userId || null,
      householdId,
      data.copiedFrom || null,
      JSON.stringify(normalizedTags),
      now,
      now
    ]

    await db.run(sql, params)
    return this.findById(id) as Promise<Recipe>
  },

  async update(id: string, data: UpdateRecipeRequest): Promise<Recipe> {
    const db = PostgreSQLDatabase.getInstance()
    const now = new Date().toISOString()

    const updates: string[] = []
    const params: any[] = []

    if (data.name !== undefined) {
      updates.push(`name = $${params.length + 1}`)
      params.push(data.name.trim())
    }
    if (data.description !== undefined) {
      updates.push(`description = $${params.length + 1}`)
      params.push(data.description.trim())
    }
    if (data.prepTimeMinutes !== undefined) {
      updates.push(`prep_time_minutes = $${params.length + 1}`)
      params.push(data.prepTimeMinutes)
    }
    if (data.cookTimeMinutes !== undefined) {
      updates.push(`cook_time_minutes = $${params.length + 1}`)
      params.push(data.cookTimeMinutes)
    }
    if (data.totalTimeMinutes !== undefined) {
      updates.push(`total_time_minutes = $${params.length + 1}`)
      params.push(data.totalTimeMinutes)
    }
    if (data.servings !== undefined) {
      updates.push(`servings = $${params.length + 1}`)
      params.push(data.servings)
    }
    if (data.ingredients !== undefined) {
      // Process ingredients - convert to categorized format
      const processedIngredients = IngredientCategoryParser.parseIngredientsFromMixed(data.ingredients)

      updates.push(`ingredients = $${params.length + 1}`)
      params.push(JSON.stringify(processedIngredients))
    }
    if (data.instructions !== undefined) {
      updates.push(`instructions = $${params.length + 1}`)
      params.push(JSON.stringify(data.instructions))
    }
    if ('image' in data) {
      updates.push(`image = $${params.length + 1}`)
      params.push(data.image === '' || data.image === undefined ? null : data.image)
    }
    if ('imageSizes' in data) {
      updates.push(`image_sizes = $${params.length + 1}`)
      params.push(data.imageSizes ? JSON.stringify(data.imageSizes) : null)
    }
    if (data.sourceUrl !== undefined) {
      updates.push(`source_url = $${params.length + 1}`)
      params.push(data.sourceUrl || null)
    }
    if (data.isPublic !== undefined) {
      updates.push(`is_public = $${params.length + 1}`)
      params.push(data.isPublic)
    }
    if (data.tags !== undefined) {
      updates.push(`tags = $${params.length + 1}`)
      const normalizedTags = TagHelper.normalizeTags(data.tags || [])
      params.push(JSON.stringify(normalizedTags))
    }

    updates.push(`updated_at = $${params.length + 1}`)
    params.push(now)
    params.push(id)

    const sql = `UPDATE recipes SET ${updates.join(', ')} WHERE id = $${params.length}`
    await db.run(sql, params)

    return this.findById(id) as Promise<Recipe>
  },

  async delete(id: string): Promise<void> {
    const db = PostgreSQLDatabase.getInstance()
    await db.run('DELETE FROM recipes WHERE id = $1', [id])
  },

  async updateAiEnhancedNotes(id: string, enhancedNotes: string): Promise<Recipe> {
    const db = PostgreSQLDatabase.getInstance()
    const now = new Date().toISOString()

    await db.run(
      'UPDATE recipes SET ai_enhanced_notes = $1, updated_at = $2 WHERE id = $3',
      [enhancedNotes, now, id]
    )

    return this.findById(id) as Promise<Recipe>
  },

  async getAllTags(): Promise<string[]> {
    const db = PostgreSQLDatabase.getInstance()
    const rows = await db.all<{ tags: string }>('SELECT DISTINCT tags FROM recipes WHERE tags IS NOT NULL AND tags != $1', ['[]'])

    const allTags = new Set<string>()

    rows.forEach((row: { tags: string }) => {
      if (row.tags) {
        try {
          const parsedTags = JSON.parse(row.tags)
          if (Array.isArray(parsedTags)) {
            parsedTags.forEach(tag => {
              if (typeof tag === 'string' && tag.trim()) {
                // Normalize the tag to ensure consistent capitalization
                const normalizedTag = TagHelper.normalizeTag(tag)
                if (normalizedTag) {
                  allTags.add(normalizedTag)
                }
              }
            })
          }
        } catch (e) {
          console.warn('Failed to parse tags from row:', row.tags)
        }
      }
    })

    return Array.from(allTags).sort()
  },

  // Helper methods for auto-inference using ingredient parser
  inferPrepTime(instructions: string[], ingredients: string[]): number {
    // Use ingredient parser for more sophisticated prep time estimation
    const ingredientPrepTime = ingredientParser.estimatePrepTimeFromIngredients(ingredients)

    // Also consider instruction complexity
    const instructionPrepTime = Math.max(instructions.length * 5, 10)

    // Take the higher of the two estimates
    return Math.max(ingredientPrepTime, instructionPrepTime)
  },

  inferServings(ingredients: string[]): number {
    // Use ingredient parser for better serving estimation
    return ingredientParser.estimateServingsFromIngredients(ingredients)
  },

  async copyRecipe(sourceId: string, userId: string, householdId?: string): Promise<Recipe> {
    const sourceRecipe = await this.findById(sourceId)
    if (!sourceRecipe) {
      throw new Error('Source recipe not found')
    }

    // Create copy data
    const copyData: CreateRecipeRequest = {
      name: sourceRecipe.name,
      description: sourceRecipe.description,
      prepTimeMinutes: sourceRecipe.prepTimeMinutes,
      cookTimeMinutes: sourceRecipe.cookTimeMinutes,
      totalTimeMinutes: sourceRecipe.totalTimeMinutes,
      servings: sourceRecipe.servings,
      ingredients: sourceRecipe.ingredients,
      instructions: sourceRecipe.instructions,
      image: sourceRecipe.image,
      sourceUrl: sourceRecipe.sourceUrl,
      tags: sourceRecipe.tags,
      isPublic: false, // Copies are always private initially
      userId: userId,
      householdId: householdId,
      copiedFrom: sourceId
    }

    return this.create(copyData)
  }
}