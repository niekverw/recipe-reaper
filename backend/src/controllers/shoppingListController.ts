import { Request, Response, NextFunction } from 'express'
import { PostgreSQLDatabase } from '../models/database-pg'
import { createError } from '../middleware/errorHandler'
import { ingredientParser } from '../utils/ingredientParser'
import { v4 as uuidv4 } from 'uuid'
import { User } from '../types/user'

interface ShoppingListItem {
  id: string
  userId: string
  householdId?: string
  ingredient: string
  description?: string
  quantity?: string
  unit?: string
  recipeId?: string
  recipeName?: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

interface AddToShoppingListRequest {
  ingredients: string[]
  recipeId?: string
  recipeName?: string
  scale?: number
}

export const shoppingListController = {
  async getShoppingList(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

      const db = PostgreSQLDatabase.getInstance()

      // Get shopping list items for user's household (if they have one) or just for the user
      const query = user.householdId
        ? `SELECT * FROM shopping_lists WHERE household_id = $1 ORDER BY created_at DESC`
        : `SELECT * FROM shopping_lists WHERE user_id = $1 AND household_id IS NULL ORDER BY created_at DESC`

      const params = user.householdId ? [user.householdId] : [user.id]
      const result = await db.all<ShoppingListItem>(query, params)

      res.json(result)
    } catch (error) {
      next(error)
    }
  },

  async addToShoppingList(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

      const { ingredients, recipeId, recipeName, scale = 1 }: AddToShoppingListRequest = req.body

      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw createError('ingredients must be a non-empty array', 400)
      }

      const db = PostgreSQLDatabase.getInstance()
      const addedItems: ShoppingListItem[] = []

      // First, get existing items to check for duplicates
      const existingQuery = user.householdId
        ? `SELECT ingredient FROM shopping_lists WHERE household_id = $1`
        : `SELECT ingredient FROM shopping_lists WHERE user_id = $1 AND household_id IS NULL`

      const existingParams = user.householdId ? [user.householdId] : [user.id]
      const existingItems = await db.all<{ ingredient: string }>(existingQuery, existingParams)
      const existingIngredients = new Set(existingItems.map(item => item.ingredient.toLowerCase().trim()))

      for (const ingredient of ingredients) {
        if (!ingredient || typeof ingredient !== 'string') continue

        // Scale the ingredient if needed
        const scaledIngredient = scale !== 1 ?
          ingredientParser.scaleIngredients([ingredient], scale)[0] :
          ingredient

        // Check if this ingredient already exists (case-insensitive)
        if (existingIngredients.has(scaledIngredient.toLowerCase().trim())) {
          continue // Skip duplicate ingredient
        }

        // Parse the ingredient to extract quantity and unit
        const parsed = ingredientParser.parseIngredients([scaledIngredient])
        const parsedIngredient = parsed.length > 0 ? parsed[0] : null

        const itemId = uuidv4()
        const now = new Date().toISOString()

        const item: Omit<ShoppingListItem, 'id'> = {
          userId: user.id,
          householdId: user.householdId,
          ingredient: scaledIngredient,
          description: parsedIngredient?.description || undefined,
          quantity: parsedIngredient?.quantity?.toString() || undefined,
          unit: parsedIngredient?.unitOfMeasure || undefined,
          recipeId: recipeId || undefined,
          recipeName: recipeName || undefined,
          isCompleted: false,
          createdAt: now,
          updatedAt: now
        }

        await db.run(
          `INSERT INTO shopping_lists (
            id, user_id, household_id, ingredient, description, quantity, unit,
            recipe_id, recipe_name, is_completed, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            itemId, item.userId, item.householdId, item.ingredient, item.description,
            item.quantity, item.unit, item.recipeId, item.recipeName,
            item.isCompleted, item.createdAt, item.updatedAt
          ]
        )

        addedItems.push({ id: itemId, ...item })
        // Add to existing set to prevent duplicates within the same request
        existingIngredients.add(scaledIngredient.toLowerCase().trim())
      }

      const totalRequested = ingredients.length
      const skippedCount = totalRequested - addedItems.length

      let message = `Added ${addedItems.length} item(s) to shopping list`
      if (skippedCount > 0) {
        message += ` (${skippedCount} item(s) already exist)`
      }

      res.status(201).json({
        message,
        items: addedItems,
        totalRequested,
        added: addedItems.length,
        skipped: skippedCount
      })
    } catch (error) {
      next(error)
    }
  },

  async updateShoppingListItem(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

      const { id } = req.params
      const { isCompleted } = req.body

      if (typeof isCompleted !== 'boolean') {
        throw createError('isCompleted must be a boolean', 400)
      }

      const db = PostgreSQLDatabase.getInstance()

      // Check if item exists and user has permission to modify it
      const checkQuery = user.householdId
        ? `SELECT * FROM shopping_lists WHERE id = $1 AND household_id = $2`
        : `SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2 AND household_id IS NULL`

      const checkParams = user.householdId ? [id, user.householdId] : [id, user.id]
      const existingItem = await db.get<ShoppingListItem>(checkQuery, checkParams)

      if (!existingItem) {
        throw createError('Shopping list item not found', 404)
      }

      // Update the item
      const now = new Date().toISOString()
      await db.run(
        `UPDATE shopping_lists SET is_completed = $1, updated_at = $2 WHERE id = $3`,
        [isCompleted, now, id]
      )

      // Return updated item
      const updatedItem = await db.get<ShoppingListItem>(
        `SELECT * FROM shopping_lists WHERE id = $1`,
        [id]
      )

      res.json(updatedItem)
    } catch (error) {
      next(error)
    }
  },

  async deleteShoppingListItem(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

      const { id } = req.params
      const db = PostgreSQLDatabase.getInstance()

      // Check if item exists and user has permission to delete it
      const checkQuery = user.householdId
        ? `SELECT * FROM shopping_lists WHERE id = $1 AND household_id = $2`
        : `SELECT * FROM shopping_lists WHERE id = $1 AND user_id = $2 AND household_id IS NULL`

      const checkParams = user.householdId ? [id, user.householdId] : [id, user.id]
      const existingItem = await db.get<ShoppingListItem>(checkQuery, checkParams)

      if (!existingItem) {
        throw createError('Shopping list item not found', 404)
      }

      // Delete the item
      await db.run(`DELETE FROM shopping_lists WHERE id = $1`, [id])

      res.json({ message: 'Shopping list item deleted' })
    } catch (error) {
      next(error)
    }
  },

  async clearCompleted(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

      const db = PostgreSQLDatabase.getInstance()

      // Delete completed items for user's household or just the user
      const deleteQuery = user.householdId
        ? `DELETE FROM shopping_lists WHERE household_id = $1 AND is_completed = true`
        : `DELETE FROM shopping_lists WHERE user_id = $1 AND household_id IS NULL AND is_completed = true`

      const deleteParams = user.householdId ? [user.householdId] : [user.id]
      const result = await db.query(deleteQuery, deleteParams)

      res.json({
        message: `Cleared ${result.rowCount} completed item(s) from shopping list`
      })
    } catch (error) {
      next(error)
    }
  }
}