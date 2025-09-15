import { IngredientCategory } from '../services/api'

export class IngredientHelper {
  /**
   * Check if ingredients use categorized format
   */
  static isCategorized(ingredients: string[] | IngredientCategory[]): ingredients is IngredientCategory[] {
    return Array.isArray(ingredients) &&
           ingredients.length > 0 &&
           typeof ingredients[0] === 'object' &&
           'items' in ingredients[0]
  }

  /**
   * Convert categorized ingredients to textarea format for editing
   */
  static toTextareaFormat(ingredients: string[] | IngredientCategory[]): string {
    if (!this.isCategorized(ingredients)) {
      return (ingredients as string[]).join('\n')
    }

    const categories = ingredients as IngredientCategory[]
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
   * Parse ingredients from textarea format to string array (for API submission)
   */
  static parseFromTextarea(textareaValue: string): string[] {
    return textareaValue
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  /**
   * Get all ingredients as flat array (for backward compatibility)
   */
  static getAllIngredients(ingredients: string[] | IngredientCategory[]): string[] {
    if (!this.isCategorized(ingredients)) {
      return ingredients as string[]
    }

    const categories = ingredients as IngredientCategory[]
    return categories.flatMap(cat => cat.items)
  }

  /**
   * Get structured ingredient data for rendering
   */
  static getStructuredIngredients(ingredients: string[] | IngredientCategory[]): Array<{
    type: 'category' | 'ingredient'
    content: string
    categoryIndex?: number
    itemIndex?: number
    isIndented?: boolean
  }> {
    if (!this.isCategorized(ingredients)) {
      const flatIngredients = ingredients as string[]
      return flatIngredients.map((ingredient, index) => ({
        type: 'ingredient' as const,
        content: ingredient,
        itemIndex: index
      }))
    }

    const categories = ingredients as IngredientCategory[]
    const elements: Array<{
      type: 'category' | 'ingredient'
      content: string
      categoryIndex?: number
      itemIndex?: number
      isIndented?: boolean
    }> = []

    categories.forEach((category, categoryIndex) => {
      // Add category header if it has a name
      if (category.category) {
        elements.push({
          type: 'category' as const,
          content: category.category,
          categoryIndex
        })
      }

      // Add ingredients for this category
      category.items.forEach((ingredient, itemIndex) => {
        elements.push({
          type: 'ingredient' as const,
          content: ingredient,
          categoryIndex,
          itemIndex,
          isIndented: true
        })
      })
    })

    return elements
  }
}