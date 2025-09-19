import { v4 as uuidv4 } from 'uuid'
import { Database } from './database'
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
  source_url: string | null
  is_public: number
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
    sourceUrl: row.source_url || undefined,
    isPublic: row.is_public === 1,
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
    const db = Database.getInstance()
    let sql = 'SELECT * FROM recipes WHERE 1=1'
    const params: any[] = []

    // Add search filter
    if (filters.search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)'
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm)
    }

    // Add public filter
    if (filters.isPublic !== undefined) {
      sql += ' AND is_public = ?'
      params.push(filters.isPublic ? 1 : 0)
    }

    // Add tag filter
    if (filters.tags && filters.tags.length > 0) {
      // Use JSON_EXTRACT to check if any of the provided tags exist in the recipe's tags array
      const tagConditions = filters.tags.map(() => 'JSON_EXTRACT(tags, "$") LIKE ?').join(' OR ')
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
      sql += ' LIMIT ?'
      params.push(filters.limit)
    }
    if (filters.offset) {
      sql += ' OFFSET ?'
      params.push(filters.offset)
    }

    const rows = await db.all<RecipeRow>(sql, params)
    return rows.map(rowToRecipe)
  },

  async findById(id: string): Promise<Recipe | null> {
    const db = Database.getInstance()
    const row = await db.get<RecipeRow>('SELECT * FROM recipes WHERE id = ?', [id])
    return row ? rowToRecipe(row) : null
  },

  async create(data: CreateRecipeRequest): Promise<Recipe> {
    const db = Database.getInstance()
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

    const sql = `
      INSERT INTO recipes (
        id, name, description, prep_time_minutes, cook_time_minutes, total_time_minutes, servings,
        ingredients, instructions, image, source_url, is_public, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.sourceUrl || null,
      data.isPublic !== false ? 1 : 0,
      JSON.stringify(normalizedTags),
      now,
      now
    ]

    await db.run(sql, params)
    return this.findById(id) as Promise<Recipe>
  },

  async update(id: string, data: UpdateRecipeRequest): Promise<Recipe> {
    const db = Database.getInstance()
    const now = new Date().toISOString()

    const updates: string[] = []
    const params: any[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      params.push(data.name.trim())
    }
    if (data.description !== undefined) {
      updates.push('description = ?')
      params.push(data.description.trim())
    }
    if (data.prepTimeMinutes !== undefined) {
      updates.push('prep_time_minutes = ?')
      params.push(data.prepTimeMinutes)
    }
    if (data.cookTimeMinutes !== undefined) {
      updates.push('cook_time_minutes = ?')
      params.push(data.cookTimeMinutes)
    }
    if (data.totalTimeMinutes !== undefined) {
      updates.push('total_time_minutes = ?')
      params.push(data.totalTimeMinutes)
    }
    if (data.servings !== undefined) {
      updates.push('servings = ?')
      params.push(data.servings)
    }
    if (data.ingredients !== undefined) {
      // Process ingredients - convert to categorized format
      const processedIngredients = IngredientCategoryParser.parseIngredientsFromMixed(data.ingredients)

      updates.push('ingredients = ?')
      params.push(JSON.stringify(processedIngredients))
    }
    if (data.instructions !== undefined) {
      updates.push('instructions = ?')
      params.push(JSON.stringify(data.instructions))
    }
    if ('image' in data) {
      updates.push('image = ?')
      params.push(data.image === '' || data.image === undefined ? null : data.image)
    }
    if (data.sourceUrl !== undefined) {
      updates.push('source_url = ?')
      params.push(data.sourceUrl || null)
    }
    if (data.isPublic !== undefined) {
      updates.push('is_public = ?')
      params.push(data.isPublic ? 1 : 0)
    }
    if (data.tags !== undefined) {
      updates.push('tags = ?')
      const normalizedTags = TagHelper.normalizeTags(data.tags || [])
      params.push(JSON.stringify(normalizedTags))
    }

    updates.push('updated_at = ?')
    params.push(now)
    params.push(id)

    const sql = `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`
    await db.run(sql, params)

    return this.findById(id) as Promise<Recipe>
  },

  async delete(id: string): Promise<void> {
    const db = Database.getInstance()
    await db.run('DELETE FROM recipes WHERE id = ?', [id])
  },

  async updateAiEnhancedNotes(id: string, enhancedNotes: string): Promise<Recipe> {
    const db = Database.getInstance()
    const now = new Date().toISOString()

    await db.run(
      'UPDATE recipes SET ai_enhanced_notes = ?, updated_at = ? WHERE id = ?',
      [enhancedNotes, now, id]
    )

    return this.findById(id) as Promise<Recipe>
  },

  async getAllTags(): Promise<string[]> {
    const db = Database.getInstance()
    const rows = await db.all<{ tags: string }>('SELECT DISTINCT tags FROM recipes WHERE tags IS NOT NULL AND tags != "[]"')

    const allTags = new Set<string>()

    rows.forEach(row => {
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
  }
}