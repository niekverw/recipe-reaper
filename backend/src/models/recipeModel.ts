import { v4 as uuidv4 } from 'uuid'
import { Database } from './database'
import { Recipe, CreateRecipeRequest, UpdateRecipeRequest, RecipeFilters, IngredientCategory } from '../types/recipe'
import { ingredientParser } from '../utils/ingredientParser'
import { IngredientCategoryParser } from '../utils/ingredientCategoryParser'

// Database row interface (snake_case)
interface RecipeRow {
  id: string
  name: string
  description: string
  prep_time_minutes: number
  servings: number
  ingredients: string
  instructions: string
  image: string | null
  is_public: number
  user_id: string | null
  household_id: string | null
  created_at: string
  updated_at: string
}

function rowToRecipe(row: RecipeRow): Recipe {
  const parsedIngredients = JSON.parse(row.ingredients)

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    prepTimeMinutes: row.prep_time_minutes,
    servings: row.servings,
    ingredients: parsedIngredients,
    instructions: JSON.parse(row.instructions),
    image: row.image || undefined,
    isPublic: row.is_public === 1,
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

    // Add sorting
    switch (filters.sortBy) {
      case 'name':
        sql += ' ORDER BY name ASC'
        break
      case 'time':
        sql += ' ORDER BY prep_time_minutes ASC'
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

    // Auto-infer values if not provided
    const prepTimeMinutes = data.prepTimeMinutes || this.inferPrepTime(data.instructions, flatIngredients)
    const servings = data.servings || this.inferServings(flatIngredients)

    const sql = `
      INSERT INTO recipes (
        id, name, description, prep_time_minutes, servings,
        ingredients, instructions, image, is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      id,
      data.name.trim(),
      data.description.trim(),
      prepTimeMinutes,
      servings,
      JSON.stringify(processedIngredients),
      JSON.stringify(data.instructions),
      data.image || null,
      data.isPublic !== false ? 1 : 0,
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
    if (data.image !== undefined) {
      updates.push('image = ?')
      params.push(data.image || null)
    }
    if (data.isPublic !== undefined) {
      updates.push('is_public = ?')
      params.push(data.isPublic ? 1 : 0)
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