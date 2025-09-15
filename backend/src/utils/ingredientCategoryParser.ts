import { IngredientCategory } from '../types/recipe'

export class IngredientCategoryParser {
  /**
   * Parse ingredients text with *Category Name syntax into categorized structure
   */
  static parseIngredients(ingredientsInput: string[] | string): IngredientCategory[] {
    // Handle string array input (existing format)
    if (Array.isArray(ingredientsInput)) {
      return this.parseFromStringArray(ingredientsInput)
    }

    // Handle string input (from textarea)
    const lines = ingredientsInput.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    return this.parseFromStringArray(lines)
  }

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
        const categoryName = line.substring(1).trim() // Remove * and trim
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
   * Check if a line is a category header (starts with *)
   */
  private static isCategoryHeader(line: string): boolean {
    return line.startsWith('*') && line.length > 1
  }

  /**
   * Convert categorized ingredients back to string array for backward compatibility
   */
  static flattenToStringArray(categories: IngredientCategory[]): string[] {
    const result: string[] = []

    for (const category of categories) {
      if (category.category) {
        result.push(`*${category.category}`)
      }
      result.push(...category.items)
    }

    return result
  }

  /**
   * Convert categorized ingredients to textarea format
   */
  static toTextareaFormat(categories: IngredientCategory[]): string {
    const lines: string[] = []

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i]

      // Add category header if it has a name
      if (category.category) {
        if (i > 0) lines.push('') // Add blank line before category (except first)
        lines.push(`*${category.category}`)
      }

      // Add ingredients
      lines.push(...category.items)
    }

    return lines.join('\n')
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

  /**
   * Check if ingredients use categorized format
   */
  static isCategorized(ingredients: string[] | IngredientCategory[]): ingredients is IngredientCategory[] {
    return Array.isArray(ingredients) &&
           ingredients.length > 0 &&
           typeof ingredients[0] === 'object' &&
           'items' in ingredients[0]
  }
}