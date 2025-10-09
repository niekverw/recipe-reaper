import pluralize from 'pluralize'
import { INGREDIENT_CATEGORIES } from './categories'
import ingredientMappingsData from './data/ingredients.json'
import type {
  IngredientCategory,
  CategorizedIngredient,
  IngredientMapping,
  NormalizedMapping,
  VariantInfo,
  MatchType,
  PatternMatch
} from './types'

class IngredientCategorizer {
  private ingredientMappings: IngredientMapping[] = ingredientMappingsData
  private normalizedMappings: NormalizedMapping[] = []
  // Basic term patterns for quick matching
  private basicPatterns = [
    { keywords: ['can', 'canned', 'tinned','cans'], category: 'CANNED_JARRED', confidence: 0.8 },
    { keywords: ['frozen', 'freeze'], category: 'FROZEN', confidence: 0.9 },
    { keywords: ['ground', 'dried','powder'], category: 'PANTRY', confidence: 0.7 },
    { keywords: ['fresh'], category: 'PRODUCE', confidence: 0.6 },
    { keywords: ['jar', 'jarred'], category: 'CANNED_JARRED', confidence: 0.8 }
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
        const variants: VariantInfo[] = []

        const addVariant = (value: string) => {
          const trimmed = value.trim().toLowerCase()
          if (!trimmed || variantSet.has(trimmed)) {
            return
          }

          const tokens = trimmed.split(/\s+/).filter(Boolean)
          const charCount = trimmed.replace(/\s+/g, '').length
          const useRegex = tokens.length === 1 && charCount <= 4
          const boundaryRegex = useRegex ? new RegExp(`\\b${this.escapeRegExp(trimmed)}\\b`) : undefined

          variantSet.add(trimmed)
          variants.push({
            value: trimmed,
            tokens,
            wordCount: tokens.length,
            charCount,
            useRegex,
            boundaryRegex
          })
        }

        normalizedKeywords.forEach(keyword => {
          const base = keyword.toLowerCase()
          addVariant(base)
          addVariant(pluralize.singular(base))
          addVariant(pluralize.plural(base))
        })

        const excludeRegexes = (mapping.excludeKeywords ?? [])
          .map(keyword => keyword.trim().toLowerCase())
          .filter(keyword => keyword.length > 0)
          .map(keyword => this.createWordBoundaryRegex(keyword))
        const categorySortOrder = INGREDIENT_CATEGORIES[mapping.category]?.sortOrder ?? INGREDIENT_CATEGORIES.OTHER.sortOrder

        return {
          ...mapping,
          normalizedKeywords,
          variantSet,
          variants,
          excludeRegexes,
          categorySortOrder
        }
      })
    }
    const words = lowerText.split(/\s+/).filter(Boolean)
    const patternMatches = this.getPatternMatches(lowerText, words)
    const patternBoosts = new Map<string, number>()
    for (const match of patternMatches) {
      const existing = patternBoosts.get(match.category) ?? 0
      if (match.boost > existing) {
        patternBoosts.set(match.category, match.boost)
      }
    }

    let bestMatch: {
      mapping: NormalizedMapping
      variant: VariantInfo
      matchType: MatchType
      score: number
    } | null = null

    let skippedFreshMatch: {
      mapping: NormalizedMapping
      variant: VariantInfo
      matchType: MatchType
      score: number
    } | null = null

    for (const mapping of this.normalizedMappings) {
      if (this.matchesExcludeKeyword(mapping, lowerText)) {
        continue
      }

      // Check if this fresh ingredient should be skipped due to preservation keywords
      const shouldSkip = this.shouldSkipFreshIngredient(mapping, patternMatches)

      for (const variant of mapping.variants) {
        const match = this.getVariantMatch(lowerText, variant)
        if (!match) {
          continue
        }

        let score = this.calculateScore({
          matchType: match.matchType,
          wordCount: variant.wordCount,
          charCount: variant.charCount,
          matchIndex: match.index,
          categorySortOrder: mapping.categorySortOrder
        })
        const boost = patternBoosts.get(mapping.category)
        if (boost) {
          score += boost
        }

        const currentMatch = { mapping, variant, matchType: match.matchType, score }

        // If this should be skipped, track it separately for potential use
        if (shouldSkip) {
          if (!skippedFreshMatch || score > skippedFreshMatch.score) {
            skippedFreshMatch = currentMatch
          }
        } else {
          // Normal matching - use for bestMatch
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = currentMatch
          }
        }
      }
    }

    if (bestMatch) {
      const category = INGREDIENT_CATEGORIES[bestMatch.mapping.category] ?? INGREDIENT_CATEGORIES.OTHER
      return {
        originalText,
        displayName: bestMatch.mapping.displayName,
        category,
        confidence: this.getConfidence(bestMatch.matchType)
      }
    }

    // If we skipped a fresh ingredient due to preservation keywords, use its display name
    // but categorize it according to the pattern (canned/frozen/dried)
    if (skippedFreshMatch && patternMatches.length > 0) {
      const strongestPattern = patternMatches.reduce((currentBest: PatternMatch, candidate: PatternMatch) =>
        candidate.boost > currentBest.boost ? candidate : currentBest
      )
      return {
        originalText,
        displayName: skippedFreshMatch.mapping.displayName,  // Use the fresh ingredient's name
        category: INGREDIENT_CATEGORIES[strongestPattern.category],  // But use pattern's category
        confidence: strongestPattern.confidence
      }
    }

    if (patternMatches.length > 0) {
      const strongestPattern = patternMatches.reduce((currentBest: PatternMatch, candidate: PatternMatch) =>
        candidate.boost > currentBest.boost ? candidate : currentBest
      )
      const displayName = this.buildPatternDisplayName(originalText, strongestPattern.keywords)
      return {
        originalText,
        displayName: this.capitalizeWords(displayName),
        category: INGREDIENT_CATEGORIES[strongestPattern.category],
        confidence: strongestPattern.confidence
      }
    }

    // Fallback to OTHER category
    return {
      originalText,
      displayName: this.capitalizeWords(originalText),
      category: INGREDIENT_CATEGORIES.OTHER,
      confidence: 0.1
    }
  }

  private getPatternMatches(lowerText: string, words: string[]): PatternMatch[] {
    const matches: PatternMatch[] = []

    for (const pattern of this.basicPatterns) {
      const matchedKeywords = pattern.keywords
        .map(keyword => keyword.trim().toLowerCase())
        .filter(keyword => keyword.length > 0 && this.containsPatternKeyword(lowerText, words, keyword))

      if (matchedKeywords.length > 0) {
        matches.push({
          category: pattern.category,
          confidence: pattern.confidence,
          keywords: matchedKeywords,
          boost: Math.round(pattern.confidence * 3000)
        })
      }
    }

    return matches
  }

  private containsPatternKeyword(lowerText: string, words: string[], keyword: string): boolean {
    if (!keyword.includes(' ')) {
      return words.includes(keyword)
    }

    return this.findWholeWordIndex(lowerText, keyword) !== -1
  }

  private getVariantMatch(lowerText: string, variant: VariantInfo): { matchType: MatchType, index: number } | null {
    if (variant.value === lowerText) {
      return { matchType: 'EXACT', index: 0 }
    }

    const wholeWordIndex = this.findWholeWordIndex(lowerText, variant.value, variant)
    if (wholeWordIndex !== -1) {
      return { matchType: 'WHOLE_WORD', index: wholeWordIndex }
    }

    const partialIndex = lowerText.indexOf(variant.value)
    if (partialIndex !== -1) {
      return { matchType: 'PARTIAL', index: partialIndex }
    }

    return null
  }

  private findWholeWordIndex(text: string, value: string, variant?: VariantInfo): number {
    const regex = variant?.boundaryRegex ?? new RegExp(`\\b${this.escapeRegExp(value)}\\b`)
    const match = regex.exec(text)
    return match ? match.index : -1
  }

  private calculateScore(params: { matchType: MatchType, wordCount: number, charCount: number, matchIndex: number, categorySortOrder: number }): number {
    const { matchType, wordCount, charCount, matchIndex, categorySortOrder } = params
    const matchTypeScore: Record<MatchType, number> = {
      EXACT: 10000,
      WHOLE_WORD: 1000,
      PARTIAL: 100
    }

    const baseScore = matchTypeScore[matchType]
    const wordScore = wordCount * 100
    const charScore = charCount
    const indexPenalty = matchIndex * 0.1
    const categoryScore = 10000 - categorySortOrder

    return baseScore + wordScore + charScore + categoryScore - indexPenalty
  }

  private getConfidence(matchType: MatchType): number {
    switch (matchType) {
      case 'EXACT':
        return 1.0
      case 'WHOLE_WORD':
        return 0.85
      default:
        return 0.6
    }
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private buildPatternDisplayName(originalText: string, keywords: string[]): string {
    let result = originalText

    for (const keyword of keywords) {
      const escaped = this.escapeRegExp(keyword)
      const regex = new RegExp(`\\b${escaped}\\b`, 'ig')
      result = result.replace(regex, ' ')
    }

    result = result.replace(/\s+/g, ' ').trim()
    return result.length > 0 ? result : originalText
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

  private shouldSkipFreshIngredient(mapping: NormalizedMapping, patternMatches: PatternMatch[]): boolean {
    // Only applies to fresh categories (PRODUCE and MEAT_SEAFOOD)
    if (mapping.category !== 'PRODUCE' && mapping.category !== 'MEAT_SEAFOOD') {
      return false
    }

    // Check if "fresh" pattern is present - if so, fresh takes precedence
    const hasFreshPattern = patternMatches.some(pm => pm.category === 'PRODUCE')
    if (hasFreshPattern) {
      return false  // Don't skip - "fresh" keyword takes precedence
    }

    // Check if any preservation patterns were detected (canned, frozen, dried)
    const preservationCategories = ['CANNED_JARRED', 'FROZEN', 'PANTRY']
    return patternMatches.some(pm => preservationCategories.includes(pm.category))
  }

  private createWordBoundaryRegex(term: string): RegExp {
    return new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'i')
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
