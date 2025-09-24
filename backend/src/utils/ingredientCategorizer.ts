import { ingredientParser } from './ingredientParser'
import pluralize from 'pluralize'
const ingredientMappingsData = require('../data/ingredients.json')

export interface IngredientCategory {
  id: string
  name: string
  emoji: string
  sortOrder: number
}

export interface CategorizedIngredient {
  originalText: string
  displayName: string
  category: IngredientCategory
  confidence: number // 0-1, how confident we are in the match
}

export const INGREDIENT_CATEGORIES: Record<string, IngredientCategory> = {
  PRODUCE: {
    id: 'PRODUCE',
    name: 'Produce',
    emoji: '🥬',
    sortOrder: 1
  },
  MEAT_SEAFOOD: {
    id: 'MEAT_SEAFOOD',
    name: 'Meat & Seafood',
    emoji: '🥩',
    sortOrder: 2
  },
  DAIRY_EGGS: {
    id: 'DAIRY_EGGS',
    name: 'Dairy & Eggs',
    emoji: '🥛',
    sortOrder: 3
  },
  PANTRY: {
    id: 'PANTRY',
    name: 'Pantry',
    emoji: '🥄',
    sortOrder: 4
  },
  CANNED_JARRED: {
    id: 'CANNED_JARRED',
    name: 'Canned & Jarred',
    emoji: '🥫',
    sortOrder: 5
  },
  FROZEN: {
    id: 'FROZEN',
    name: 'Frozen',
    emoji: '🧊',
    sortOrder: 6
  },
  BAKERY: {
    id: 'BAKERY',
    name: 'Bakery',
    emoji: '🍞',
    sortOrder: 7
  },
  GRAINS_PASTA: {
    id: 'GRAINS_PASTA',
    name: 'Grains & Pasta',
    emoji: '🍝',
    sortOrder: 8
  },
  SNACKS_BEVERAGES: {
    id: 'SNACKS_BEVERAGES',
    name: 'Snacks & Beverages',
    emoji: '🥤',
    sortOrder: 9
  },
  OTHER: {
    id: 'OTHER',
    name: 'Other',
    emoji: '📦',
    sortOrder: 10
  }
}

interface IngredientMapping {
  displayName: string
  category: string
  keywords: string[]
  exactMatches?: string[]
  excludeKeywords?: string[]
}

class IngredientCategorizer {
  private ingredientMappings: IngredientMapping[] = ingredientMappingsData
  // Basic term patterns for quick matching
  private basicPatterns = [
    { keywords: ['can ', 'canned ', 'tinned '], category: 'CANNED_JARRED', confidence: 0.8 },
    { keywords: ['frozen ', 'freeze '], category: 'FROZEN', confidence: 0.9 },
    { keywords: ['ground ', 'dried '], category: 'PANTRY', confidence: 0.7 },
    { keywords: ['fresh '], category: 'PRODUCE', confidence: 0.6 },
    { keywords: ['jar ', 'jarred '], category: 'CANNED_JARRED', confidence: 0.8 }
  ]

  /**
   * Categorize an ingredient and provide a display name
   */
  categorizeIngredient(ingredientText: string): CategorizedIngredient {
    const originalText = ingredientText.trim()
    const lowerText = originalText.toLowerCase()

    // Try exact ingredient mappings first
    const exactMatch = this.findExactMatch(lowerText)
    if (exactMatch) {
      return {
        originalText,
        displayName: exactMatch.displayName,
        category: INGREDIENT_CATEGORIES[exactMatch.category],
        confidence: 1.0
      }
    }

    // Try keyword-based matching
    const keywordMatch = this.findKeywordMatch(lowerText)
    if (keywordMatch) {
      return {
        originalText,
        displayName: keywordMatch.displayName,
        category: INGREDIENT_CATEGORIES[keywordMatch.category],
        confidence: 0.8
      }
    }

    // Try basic patterns (can, frozen, etc.)
    const patternMatch = this.findPatternMatch(lowerText)
    if (patternMatch) {
      // Extract the main ingredient name after removing pattern words
      let cleanedName = lowerText
      for (const keyword of patternMatch.keywords) {
        cleanedName = cleanedName.replace(keyword.trim(), ' ').trim()
      }
      // Remove extra spaces
      cleanedName = cleanedName.replace(/\s+/g, ' ')

      return {
        originalText,
        displayName: this.capitalizeWords(cleanedName),
        category: INGREDIENT_CATEGORIES[patternMatch.category],
        confidence: patternMatch.confidence
      }
    }

    // Use parsing to help categorize based on quantity/unit context
    const contextMatch = this.categorizeByContext(originalText)
    if (contextMatch) {
      return contextMatch
    }

    // Fallback to OTHER category
    return {
      originalText,
      displayName: this.capitalizeWords(originalText),
      category: INGREDIENT_CATEGORIES.OTHER,
      confidence: 0.1
    }
  }

  private findExactMatch(lowerText: string): IngredientMapping | null {
    return this.ingredientMappings.find(mapping => {
      if (mapping.exactMatches) {
        // Check exact matches and their plural/singular variants
        return mapping.exactMatches.some(exact => {
          const exactLower = exact.toLowerCase()
          return lowerText === exactLower ||
                 lowerText === pluralize.singular(exactLower) ||
                 lowerText === pluralize.plural(exactLower)
        })
      }
      return false
    }) || null
  }

  private findKeywordMatch(lowerText: string): IngredientMapping | null {
    for (const mapping of this.ingredientMappings) {
      // Check if any exclude keywords are present
      if (mapping.excludeKeywords &&
          mapping.excludeKeywords.some(exclude => lowerText.includes(exclude.toLowerCase()))) {
        continue
      }

      // Check if any keywords match (including plural/singular variants)
      if (mapping.keywords.some(keyword => {
        const keywordLower = keyword.toLowerCase()
        return lowerText.includes(keywordLower) ||
               lowerText.includes(pluralize.singular(keywordLower)) ||
               lowerText.includes(pluralize.plural(keywordLower))
      })) {
        return mapping
      }
    }
    return null
  }

  private findPatternMatch(lowerText: string): { keywords: string[], category: string, confidence: number } | null {
    for (const pattern of this.basicPatterns) {
      if (pattern.keywords.some(keyword => lowerText.includes(keyword))) {
        return pattern
      }
    }
    return null
  }

  private categorizeByContext(originalText: string): CategorizedIngredient | null {
    try {
      const parsed = ingredientParser.parseIngredient(originalText)
      if (parsed.length === 0) return null

      const ingredient = parsed[0]
      const description = ingredient.description.toLowerCase()
      const unit = ingredient.unitOfMeasure?.toLowerCase() || ''

      // Use unit context to help categorization
      if (unit.includes('bunch') || unit.includes('head')) {
        return {
          originalText,
          displayName: this.capitalizeWords(ingredient.description),
          category: INGREDIENT_CATEGORIES.PRODUCE,
          confidence: 0.7
        }
      }

    } catch (error) {
      // Parsing failed, continue to fallback
    }

    return null
  }

  private capitalizeWords(text: string): string {
    return text.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Get all categories sorted by sort order
   */
  getAllCategories(): IngredientCategory[] {
    return Object.values(INGREDIENT_CATEGORIES).sort((a, b) => a.sortOrder - b.sortOrder)
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): IngredientCategory | null {
    return INGREDIENT_CATEGORIES[id] || null
  }
}

// Export singleton instance
export const ingredientCategorizer = new IngredientCategorizer()