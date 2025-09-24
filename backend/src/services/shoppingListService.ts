import { ingredientParser } from '../utils/ingredientParser'
import { ingredientCategorizer } from '../utils/ingredientCategorizer'

export interface ShoppingListItem {
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

export interface ParsedIngredient {
  quantity: number | null
  unitOfMeasure: string | null
  description: string | null
  originalText: string
}

export class ShoppingListService {
  /**
   * Determines if two shopping list items should be combined based on their similarity
   */
  static shouldCombineItems(item1: ShoppingListItem, item2: ShoppingListItem): boolean {
    // Must have same category
    if (item1.category !== item2.category) {
      return false
    }

    // Only combine items that have essentially the same ingredient text
    // (after normalizing quantities, units, etc.)
    const normalized1 = this.normalizeIngredientText(item1.ingredient)
    const normalized2 = this.normalizeIngredientText(item2.ingredient || '')

    return normalized1 === normalized2
  }

  /**
   * Normalizes ingredient text for comparison by removing quantities and units
   */
  private static normalizeIngredientText(ingredientText: string): string {
    return ingredientText
      .toLowerCase()
      .trim()
      // Remove leading quantities and units
      .replace(/^\d+(\.\d+)?\s*(cup|cups|tbsp|tsp|oz|lb|pound|gram|g|kg|ml|l|liter|clove|cloves|slice|slices|piece|pieces|can|cans|package|packages|bag|bags|bottle|bottles|jar|jars|teaspoon|teaspoons|tablespoon|tablespoons|ounce|ounces|pound|pounds|gram|grams|kilogram|kilograms|milliliter|milliliters|liter|liters)?\s*/i, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Attempts to combine quantities from two ingredients
   * Returns the combined ingredient text or null if combination fails
   */
  static combineQuantities(existingItem: ShoppingListItem, newIngredient: ParsedIngredient): string | null {
    try {
      // If existing item has no quantity, can't combine
      if (!existingItem.quantity) {
        return null
      }

      // If new ingredient has no quantity, can't combine
      if (!newIngredient.quantity) {
        return null
      }

      // Parse existing quantity
      const existingQuantity = parseFloat(existingItem.quantity)
      if (isNaN(existingQuantity)) {
        return null
      }

      // Combine quantities
      const combinedQuantity = existingQuantity + newIngredient.quantity

      // Reconstruct ingredient text
      const unit = newIngredient.unitOfMeasure || existingItem.unit || ''
      const description = newIngredient.description || existingItem.description || existingItem.displayName || ''

      return `${combinedQuantity} ${unit} ${description}`.trim()
    } catch (error) {
      console.warn('Failed to combine quantities:', error)
      return null
    }
  }

  /**
   * Processes ingredients for addition to shopping list, handling duplicates and combinations
   */
  static async processIngredientsForAddition(
    ingredients: string[],
    existingItems: ShoppingListItem[],
    scale: number = 1
  ): Promise<{
    itemsToAdd: Array<Omit<ShoppingListItem, 'id' | 'createdAt' | 'updatedAt'>>
    itemsToUpdate: Array<{ item: ShoppingListItem; newIngredient: string; newQuantity: string }>
    skippedCount: number
  }> {
    const itemsToAdd: Array<Omit<ShoppingListItem, 'id' | 'createdAt' | 'updatedAt'>> = []
    const itemsToUpdate: Array<{ item: ShoppingListItem; newIngredient: string; newQuantity: string }> = []
    let skippedCount = 0

    // Group existing items by normalized ingredient text for quick lookup
    const existingByNormalizedText = new Map<string, ShoppingListItem>()
    for (const item of existingItems) {
      const normalized = this.normalizeIngredientText(item.ingredient)
      existingByNormalizedText.set(normalized, item)
    }

    for (const ingredient of ingredients) {
      if (!ingredient || typeof ingredient !== 'string') continue

      // Scale the ingredient if needed
      const scaledIngredient = scale !== 1 ?
        ingredientParser.scaleIngredients([ingredient], scale)[0] :
        ingredient

      // Parse the ingredient
      const parsed = ingredientParser.parseIngredients([scaledIngredient])
      const parsedIngredient = parsed.length > 0 ? parsed[0] : null

      // Categorize the ingredient
      const categorized = ingredientCategorizer.categorizeIngredient(scaledIngredient)

      // Check if we already have this exact ingredient
      const normalizedNew = this.normalizeIngredientText(scaledIngredient)
      const existingItem = existingByNormalizedText.get(normalizedNew)

      if (existingItem && parsedIngredient) {
        // Try to combine quantities
        const combinedIngredient = this.combineQuantities(existingItem, parsedIngredient)

        if (combinedIngredient && parsedIngredient.quantity) {
          // Update existing item
          itemsToUpdate.push({
            item: existingItem,
            newIngredient: combinedIngredient,
            newQuantity: (parseFloat(existingItem.quantity || '0') + parsedIngredient.quantity).toString()
          })
          continue
        } else {
          // Can't combine quantities, but it's the same ingredient - skip
          skippedCount++
          continue
        }
      }

      // Add as new item
      const newItem: Omit<ShoppingListItem, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: '', // Will be set by controller
        householdId: undefined, // Will be set by controller
        ingredient: scaledIngredient,
        description: parsedIngredient?.description || undefined,
        quantity: parsedIngredient?.quantity?.toString() || undefined,
        unit: parsedIngredient?.unitOfMeasure || undefined,
        category: categorized.category.id,
        displayName: categorized.displayName,
        recipeId: undefined, // Will be set by controller
        recipeName: undefined, // Will be set by controller
        isCompleted: false
      }

      itemsToAdd.push(newItem)
    }

    return { itemsToAdd, itemsToUpdate, skippedCount }
  }

  /**
   * Validates shopping list input data
   */
  static validateAddToShoppingListRequest(data: any): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!data || typeof data !== 'object') {
      errors.push('Request body must be an object')
      return { isValid: false, errors }
    }

    if (!Array.isArray(data.ingredients)) {
      errors.push('ingredients must be an array')
    } else if (data.ingredients.length === 0) {
      errors.push('ingredients array cannot be empty')
    } else if (data.ingredients.length > 100) {
      errors.push('ingredients array cannot contain more than 100 items')
    } else {
      for (let i = 0; i < data.ingredients.length; i++) {
        const ingredient = data.ingredients[i]
        if (typeof ingredient !== 'string') {
          errors.push(`ingredients[${i}] must be a string`)
        } else if (ingredient.trim().length === 0) {
          errors.push(`ingredients[${i}] cannot be empty`)
        } else if (ingredient.length > 500) {
          errors.push(`ingredients[${i}] cannot be longer than 500 characters`)
        }
      }
    }

    if (data.recipeId !== undefined && (typeof data.recipeId !== 'string' || data.recipeId.length > 100)) {
      errors.push('recipeId must be a string with maximum length 100')
    }

    if (data.recipeName !== undefined && (typeof data.recipeName !== 'string' || data.recipeName.length > 200)) {
      errors.push('recipeName must be a string with maximum length 200')
    }

    if (data.scale !== undefined && (typeof data.scale !== 'number' || data.scale < 0.1 || data.scale > 10)) {
      errors.push('scale must be a number between 0.1 and 10')
    }

    return { isValid: errors.length === 0, errors }
  }
}