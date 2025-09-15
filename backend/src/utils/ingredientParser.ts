import { parseIngredient, Ingredient } from 'parse-ingredient'

export interface NormalizedIngredient {
  quantity: number | null
  quantity2: number | null
  unitOfMeasure: string | null
  unitOfMeasureID: string | null
  description: string
  isGroupHeader: boolean
  originalText: string
}

export interface IngredientParsingOptions {
  normalizeUOM?: boolean
  ignoreUOMs?: string[]
  allowLeadingOf?: boolean
}

/**
 * Parse and normalize ingredient strings using the parse-ingredient library
 */
export class IngredientParser {
  private defaultOptions: IngredientParsingOptions = {
    normalizeUOM: true, // Normalize units to their long form (e.g., "ml" -> "milliliter")
    ignoreUOMs: ['small', 'medium', 'large', 'tiny', 'huge', 'extra-large'], // Size descriptors
    allowLeadingOf: false
  }

  /**
   * Parse a single ingredient string
   */
  parseIngredient(ingredientText: string, options?: IngredientParsingOptions): NormalizedIngredient[] {
    const opts = { ...this.defaultOptions, ...options }

    const parsed = parseIngredient(ingredientText.trim(), opts)

    return parsed.map(ingredient => ({
      quantity: ingredient.quantity,
      quantity2: ingredient.quantity2,
      unitOfMeasure: ingredient.unitOfMeasure,
      unitOfMeasureID: ingredient.unitOfMeasureID,
      description: ingredient.description,
      isGroupHeader: ingredient.isGroupHeader,
      originalText: ingredientText.trim()
    }))
  }

  /**
   * Parse multiple ingredient strings (e.g., from an array)
   */
  parseIngredients(ingredients: string[], options?: IngredientParsingOptions): NormalizedIngredient[] {
    return ingredients.flatMap(ingredient =>
      this.parseIngredient(ingredient, options)
    )
  }

  /**
   * Parse ingredients from multiline string (split by newlines)
   */
  parseIngredientsFromText(ingredientText: string, options?: IngredientParsingOptions): NormalizedIngredient[] {
    const lines = ingredientText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    return this.parseIngredients(lines, options)
  }

  /**
   * Extract quantity information for serving size inference
   */
  estimateServingsFromIngredients(ingredients: string[]): number {
    const parsed = this.parseIngredients(ingredients)

    // Calculate total volume/weight-based quantities
    let totalQuantity = 0
    let quantityCount = 0

    for (const ingredient of parsed) {
      if (ingredient.quantity && !ingredient.isGroupHeader) {
        // Weight/volume units that indicate larger batches
        const volumeUnits = ['cup', 'quart', 'liter', 'milliliter', 'gallon', 'pint']
        const weightUnits = ['pound', 'kilogram', 'gram', 'ounce']

        const unitId = ingredient.unitOfMeasureID?.toLowerCase() || ''
        const isVolumeOrWeight = volumeUnits.some(unit => unitId.includes(unit)) ||
                                weightUnits.some(unit => unitId.includes(unit))

        if (isVolumeOrWeight) {
          const effectiveQuantity = ingredient.quantity2 || ingredient.quantity
          totalQuantity += effectiveQuantity
          quantityCount++
        }
      }
    }

    // Heuristic: More total quantity = more servings
    if (quantityCount === 0) return 4 // Default fallback

    const avgQuantity = totalQuantity / quantityCount

    // Very rough estimation based on typical recipe patterns
    if (avgQuantity >= 8) return 12      // Large batch (e.g., 8+ cups flour)
    if (avgQuantity >= 4) return 8       // Medium-large batch
    if (avgQuantity >= 2) return 6       // Medium batch
    if (avgQuantity >= 1) return 4       // Standard batch
    return 2                             // Small batch
  }

  /**
   * Estimate prep time based on ingredient complexity
   */
  estimatePrepTimeFromIngredients(ingredients: string[]): number {
    const parsed = this.parseIngredients(ingredients)

    let complexity = 0

    for (const ingredient of parsed) {
      if (ingredient.isGroupHeader) {
        complexity += 5 // Group headers suggest more complex recipes
        continue
      }

      // Base complexity per ingredient
      complexity += 2

      // More complex if it has specific measurements
      if (ingredient.quantity && ingredient.unitOfMeasure) {
        complexity += 1
      }

      // Check for prep-intensive descriptions
      const prepWords = ['chopped', 'diced', 'minced', 'sliced', 'grated', 'peeled', 'trimmed', 'cleaned']
      const description = ingredient.description.toLowerCase()

      if (prepWords.some(word => description.includes(word))) {
        complexity += 3
      }

      // Ingredients that typically require prep time
      const prepIntensiveIngredients = ['onion', 'garlic', 'carrot', 'celery', 'pepper', 'herb']
      if (prepIntensiveIngredients.some(ing => description.includes(ing))) {
        complexity += 2
      }
    }

    // Convert complexity to minutes (minimum 10)
    return Math.max(Math.round(complexity * 1.5), 10)
  }

  /**
   * Validate and clean ingredient strings
   */
  validateIngredients(ingredients: string[]): { valid: string[], invalid: string[] } {
    const valid: string[] = []
    const invalid: string[] = []

    for (const ingredient of ingredients) {
      const trimmed = ingredient.trim()

      if (!trimmed) {
        invalid.push(ingredient)
        continue
      }

      try {
        const parsed = this.parseIngredient(trimmed)
        if (parsed.length > 0) {
          valid.push(trimmed)
        } else {
          invalid.push(ingredient)
        }
      } catch (error) {
        invalid.push(ingredient)
      }
    }

    return { valid, invalid }
  }

  /**
   * Scale ingredient quantities by a factor
   */
  scaleIngredients(ingredients: string[], scaleFactor: number): string[] {
    return ingredients.map(ingredient => {
      try {
        const parsed = this.parseIngredient(ingredient)

        if (parsed.length === 0 || parsed[0].isGroupHeader || !parsed[0].quantity) {
          return ingredient // Return unchanged if no quantity to scale
        }

        const ing = parsed[0]
        const scaledQuantity = ing.quantity! * scaleFactor
        const scaledQuantity2 = ing.quantity2 ? ing.quantity2 * scaleFactor : null

        // Format the scaled quantities
        let quantityStr = this.formatQuantity(scaledQuantity)
        if (scaledQuantity2) {
          quantityStr += `-${this.formatQuantity(scaledQuantity2)}`
        }

        // Reconstruct the ingredient string
        let result = quantityStr
        if (ing.unitOfMeasure) {
          result += ` ${ing.unitOfMeasure}`
        }
        result += ` ${ing.description}`

        return result
      } catch (error) {
        return ingredient // Return original if parsing fails
      }
    })
  }

  private formatQuantity(quantity: number): string {
    // Convert decimal to fraction for better readability
    if (quantity % 1 === 0) {
      return quantity.toString()
    }

    // Common fraction conversions
    const fractions: Record<string, string> = {
      '0.25': '1/4',
      '0.33': '1/3',
      '0.5': '1/2',
      '0.67': '2/3',
      '0.75': '3/4'
    }

    const decimal = (quantity % 1).toFixed(2)
    if (fractions[decimal]) {
      const whole = Math.floor(quantity)
      return whole > 0 ? `${whole} ${fractions[decimal]}` : fractions[decimal]
    }

    return quantity.toFixed(2).replace(/\.?0+$/, '')
  }
}

// Export a singleton instance
export const ingredientParser = new IngredientParser()