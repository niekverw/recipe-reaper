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
  excludeKeywords?: string[]
}

type NormalizedMapping = IngredientMapping & {
  normalizedKeywords: string[]
  variantSet: Set<string>
  keywordRegexes: RegExp[]
  excludeRegexes: RegExp[]
  categorySortOrder: number
}

type MatchCandidate = {
  mapping: NormalizedMapping
  score: number
  matchedLength: number
  matchIndex: number
}

class IngredientCategorizer {
  private ingredientMappings: IngredientMapping[] = ingredientMappingsData
  private normalizedMappings: NormalizedMapping[] = []
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

    if (this.normalizedMappings.length === 0) {
      this.normalizedMappings = this.ingredientMappings.map(mapping => {
        const normalizedKeywords = this.normalizeKeywords(mapping.keywords)
        const variantSet = new Set<string>()

        const addVariant = (value: string) => {
          const trimmed = value.trim().toLowerCase()
          if (trimmed) {
            variantSet.add(trimmed)
          }
        }

        normalizedKeywords.forEach(keyword => {
          const base = keyword.toLowerCase()
          addVariant(base)
          addVariant(pluralize.singular(base))
          addVariant(pluralize.plural(base))
        })

        const keywordRegexes = Array.from(variantSet).map(variant => this.createWordBoundaryRegex(variant))
        const excludeRegexes = (mapping.excludeKeywords ?? [])
          .map(keyword => keyword.trim())
          .filter(keyword => keyword.length > 0)
          .map(keyword => this.createWordBoundaryRegex(keyword.toLowerCase()))
        const categorySortOrder = INGREDIENT_CATEGORIES[mapping.category]?.sortOrder ?? Number.MAX_SAFE_INTEGER

        return {
          ...mapping,
          normalizedKeywords,
          variantSet,
          keywordRegexes,
          excludeRegexes,
          categorySortOrder
        }
      })
    }

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

  private findExactMatch(lowerText: string): NormalizedMapping | null {
    for (const mapping of this.normalizedMappings) {
      if (this.matchesExcludeKeyword(mapping, lowerText)) continue

      if (mapping.variantSet.has(lowerText)) {
        return mapping
      }
    }
    return null
  }

  private findKeywordMatch(lowerText: string): NormalizedMapping | null {
    let bestCandidate: MatchCandidate | null = null

    for (const mapping of this.normalizedMappings) {
      if (this.matchesExcludeKeyword(mapping, lowerText)) continue

      const mappingCandidate = this.getBestCandidateForMapping(mapping, lowerText)
      if (!mappingCandidate) continue

      if (!bestCandidate || this.isBetterCandidate(mappingCandidate, bestCandidate)) {
        bestCandidate = mappingCandidate
      }
    }

    return bestCandidate?.mapping ?? null
  }

  private getBestCandidateForMapping(mapping: NormalizedMapping, lowerText: string): MatchCandidate | null {
    let bestCandidate: MatchCandidate | null = null

    for (const regex of mapping.keywordRegexes) {
      const match = regex.exec(lowerText)
      if (!match || !match[0]) continue

      const matchedText = match[0].trim()
      if (!matchedText) continue

      const score = this.calculateMatchScore(matchedText, match.index)
      const candidate: MatchCandidate = {
        mapping,
        score,
        matchedLength: matchedText.length,
        matchIndex: match.index
      }

      if (!bestCandidate || this.isBetterCandidate(candidate, bestCandidate)) {
        bestCandidate = candidate
      }
    }

    return bestCandidate
  }

  private calculateMatchScore(matchedText: string, matchIndex: number): number {
    const wordCount = matchedText.split(/\s+/).filter(Boolean).length
    const charCount = matchedText.replace(/\s+/g, '').length
    const baseScore = wordCount * 1000 + charCount * 10
    return baseScore - matchIndex
  }

  private isBetterCandidate(candidate: MatchCandidate, currentBest: MatchCandidate): boolean {
    if (candidate.score !== currentBest.score) {
      return candidate.score > currentBest.score
    }

    if (candidate.matchIndex !== currentBest.matchIndex) {
      return candidate.matchIndex < currentBest.matchIndex
    }

    if (candidate.mapping.categorySortOrder !== currentBest.mapping.categorySortOrder) {
      return candidate.mapping.categorySortOrder < currentBest.mapping.categorySortOrder
    }

    if (candidate.matchedLength !== currentBest.matchedLength) {
      return candidate.matchedLength > currentBest.matchedLength
    }

    return candidate.mapping.displayName.length > currentBest.mapping.displayName.length
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

  private normalizeKeywords(keywords: string[] = []): string[] {
    const normalized: string[] = []
    keywords.forEach(keyword => {
      const trimmed = keyword.trim()
      if (!trimmed) return
      const exists = normalized.some(existing => existing.toLowerCase() === trimmed.toLowerCase())
      if (!exists) {
        normalized.push(trimmed)
      }
    })
    return normalized
  }

  private matchesExcludeKeyword(mapping: NormalizedMapping, lowerText: string): boolean {
    if (!mapping.excludeRegexes.length) return false
    return mapping.excludeRegexes.some(regex => regex.test(lowerText))
  }

  private createWordBoundaryRegex(term: string): RegExp {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`, 'i')
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