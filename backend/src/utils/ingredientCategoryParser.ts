import { IngredientCategory } from '../types/recipe'

export class IngredientCategoryParser {
  /**
   * Parse ingredients from mixed input (for API requests)
   */
  static parseIngredientsFromMixed(ingredients: string[] | IngredientCategory[]): IngredientCategory[] {
    // Check if already in categorized format
    if (Array.isArray(ingredients) && ingredients.length > 0 && typeof ingredients[0] === 'object' && 'items' in ingredients[0]) {
      return ingredients as IngredientCategory[]
    }

    // Convert from string array
    return this.parseFromStringArray(ingredients as string[])
  }

  /**
   * Parse string array into categorized ingredients
   */
  private static parseFromStringArray(lines: string[]): IngredientCategory[] {
    const categories: IngredientCategory[] = []
    let currentCategory: IngredientCategory | null = null

    for (const line of lines) {
      if (this.isCategoryHeader(line)) {
        // Start new category
        const categoryName = this.extractHeaderName(line)
        currentCategory = {
          category: categoryName,
          items: []
        }
        categories.push(currentCategory)
      } else {
        // Add ingredient to current category or create uncategorized group
        if (!currentCategory) {
          // Create uncategorized group for items before any category header
          currentCategory = {
            category: undefined,
            items: []
          }
          categories.push(currentCategory)
        }
        currentCategory.items.push(line)
      }
    }

    // Remove empty categories
    return categories.filter(cat => cat.items.length > 0)
  }

  /**
   * Check if a line is a category header (starts with * or is *header*)
   */
  private static isCategoryHeader(line: string): boolean {
    return (line.startsWith('*') && line.length > 1) || (line.startsWith('*') && line.endsWith('*') && line.length > 2)
  }

  /**
   * Extract header name from different header formats
   */
  private static extractHeaderName(line: string): string {
    if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
      // Format: *header name*
      return line.substring(1, line.length - 1).trim()
    } else if (line.startsWith('*')) {
      // Format: *header name
      return line.substring(1).trim()
    }
    return line.trim()
  }

  /**
   * Get all ingredients as flat array for parsing/analysis (backward compatibility)
   */
  static getAllIngredients(ingredients: string[] | IngredientCategory[]): string[] {
    if (Array.isArray(ingredients) && ingredients.length > 0 && typeof ingredients[0] === 'string') {
      return ingredients as string[]
    }

    const categories = ingredients as IngredientCategory[]
    return categories.flatMap(cat => cat.items)
  }
}