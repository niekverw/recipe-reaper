import { Request, Response, NextFunction } from 'express'
import { PostgreSQLDatabase } from '../models/database-pg'
import { createError } from '../middleware/errorHandler'
import { ingredientParser } from '../utils/ingredientParser'
import { ingredientCategorizer } from '../utils/ingredientCategorizer'
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
  category?: string
  displayName?: string
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
      const result = await db.all(query, params)

      // Map database fields to camelCase for frontend
      const mappedResult = result.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        householdId: item.household_id,
        ingredient: item.ingredient,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        displayName: item.display_name,
        recipeId: item.recipe_id,
        recipeName: item.recipe_name,
        isCompleted: item.is_completed,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))

      res.json(mappedResult)
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

      // First, get existing items to check for duplicates and combinations
      const existingQuery = user.householdId
        ? `SELECT * FROM shopping_lists WHERE household_id = $1`
        : `SELECT * FROM shopping_lists WHERE user_id = $1 AND household_id IS NULL`

      const existingParams = user.householdId ? [user.householdId] : [user.id]
      const existingItems = await db.all(existingQuery, existingParams) as any[]

      // Group existing items by displayName and category for easier lookup
      const existingByDisplayName = new Map<string, any>()
      for (const item of existingItems) {
        const key = `${item.display_name}_${item.category}`.toLowerCase()
        existingByDisplayName.set(key, item)
      }

      const updatedItems: ShoppingListItem[] = []
      const addedItems: ShoppingListItem[] = []

      for (const ingredient of ingredients) {
        if (!ingredient || typeof ingredient !== 'string') continue

        // Scale the ingredient if needed
        const scaledIngredient = scale !== 1 ?
          ingredientParser.scaleIngredients([ingredient], scale)[0] :
          ingredient

        // Parse the ingredient to extract quantity and unit
        const parsed = ingredientParser.parseIngredients([scaledIngredient])
        const parsedIngredient = parsed.length > 0 ? parsed[0] : null

        // Categorize the ingredient
        const categorized = ingredientCategorizer.categorizeIngredient(scaledIngredient)

        // Check if we already have this ingredient (by displayName and category)
        const existingKey = `${categorized.displayName}_${categorized.category.id}`.toLowerCase()
        const existingItem = existingByDisplayName.get(existingKey)

        if (existingItem) {
          // Combine quantities if both have quantities
          if (parsedIngredient?.quantity && existingItem.quantity) {
            try {
              const existingQuantity = parseFloat(existingItem.quantity)
              const newQuantity = parsedIngredient.quantity
              const combinedQuantity = existingQuantity + newQuantity

              // Create combined ingredient text
              const combinedIngredient = `${combinedQuantity} ${parsedIngredient.unitOfMeasure || ''} ${parsedIngredient.description || categorized.displayName}`.trim()

              // Update the existing item
              const now = new Date().toISOString()
              await db.run(
                `UPDATE shopping_lists SET
                  ingredient = $1,
                  quantity = $2,
                  updated_at = $3
                 WHERE id = $4`,
                [combinedIngredient, combinedQuantity.toString(), now, existingItem.id]
              )

              // Get updated item
              const updatedItemResult = await db.get(`SELECT * FROM shopping_lists WHERE id = $1`, [existingItem.id])
              const updatedItem = {
                id: (updatedItemResult as any).id,
                userId: (updatedItemResult as any).user_id,
                householdId: (updatedItemResult as any).household_id,
                ingredient: (updatedItemResult as any).ingredient,
                description: (updatedItemResult as any).description,
                quantity: (updatedItemResult as any).quantity,
                unit: (updatedItemResult as any).unit,
                category: (updatedItemResult as any).category,
                displayName: (updatedItemResult as any).display_name,
                recipeId: (updatedItemResult as any).recipe_id,
                recipeName: (updatedItemResult as any).recipe_name,
                isCompleted: (updatedItemResult as any).is_completed,
                createdAt: (updatedItemResult as any).created_at,
                updatedAt: (updatedItemResult as any).updated_at
              }

              updatedItems.push(updatedItem)
              continue
            } catch (error) {
              // If combining fails, add as new item
              console.warn('Failed to combine quantities, adding as new item:', error)
            }
          } else {
            // If no quantities to combine, skip duplicate
            continue
          }
        }

        // Add as new item
        const itemId = uuidv4()
        const now = new Date().toISOString()

        const item: Omit<ShoppingListItem, 'id'> = {
          userId: user.id,
          householdId: user.householdId,
          ingredient: scaledIngredient,
          description: parsedIngredient?.description || undefined,
          quantity: parsedIngredient?.quantity?.toString() || undefined,
          unit: parsedIngredient?.unitOfMeasure || undefined,
          category: categorized.category.id,
          displayName: categorized.displayName,
          recipeId: recipeId || undefined,
          recipeName: recipeName || undefined,
          isCompleted: false,
          createdAt: now,
          updatedAt: now
        }

        await db.run(
          `INSERT INTO shopping_lists (
            id, user_id, household_id, ingredient, description, quantity, unit,
            category, display_name, recipe_id, recipe_name, is_completed, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            itemId, item.userId, item.householdId, item.ingredient, item.description,
            item.quantity, item.unit, item.category, item.displayName, item.recipeId, item.recipeName,
            item.isCompleted, item.createdAt, item.updatedAt
          ]
        )

        // Map the item to camelCase for frontend consistency
        const mappedItem = {
          id: itemId,
          userId: item.userId,
          householdId: item.householdId,
          ingredient: item.ingredient,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          displayName: item.displayName,
          recipeId: item.recipeId,
          recipeName: item.recipeName,
          isCompleted: item.isCompleted,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }

        addedItems.push(mappedItem)
        // Update the lookup map with the new item
        existingByDisplayName.set(existingKey, { ...mappedItem, display_name: mappedItem.displayName, category: mappedItem.category })
      }

      const totalRequested = ingredients.length
      const addedCount = addedItems.length
      const updatedCount = updatedItems.length
      const skippedCount = totalRequested - addedCount - updatedCount

      let message = `Added ${addedCount} item(s) to shopping list`
      if (updatedCount > 0) {
        message += `, updated ${updatedCount} item(s)`
      }
      if (skippedCount > 0) {
        message += `, skipped ${skippedCount} duplicate(s)`
      }

      res.status(201).json({
        message,
        items: [...addedItems, ...updatedItems],
        totalRequested,
        added: addedCount,
        updated: updatedCount,
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
      const updatedItem = await db.get(
        `SELECT * FROM shopping_lists WHERE id = $1`,
        [id]
      )

      // Map database fields to camelCase for frontend
      const mappedItem = {
        id: (updatedItem as any).id,
        userId: (updatedItem as any).user_id,
        householdId: (updatedItem as any).household_id,
        ingredient: (updatedItem as any).ingredient,
        description: (updatedItem as any).description,
        quantity: (updatedItem as any).quantity,
        unit: (updatedItem as any).unit,
        category: (updatedItem as any).category,
        displayName: (updatedItem as any).display_name,
        recipeId: (updatedItem as any).recipe_id,
        recipeName: (updatedItem as any).recipe_name,
        isCompleted: (updatedItem as any).is_completed,
        createdAt: (updatedItem as any).created_at,
        updatedAt: (updatedItem as any).updated_at
      }

      res.json(mappedItem)
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