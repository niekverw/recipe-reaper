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

export interface IngredientMapping {
  displayName: string
  category: string
  keywords: string[]
  excludeKeywords?: string[]
}

export type NormalizedMapping = IngredientMapping & {
  normalizedKeywords: string[]
  variantSet: Set<string>
  variants: VariantInfo[]
  excludeRegexes: RegExp[]
  categorySortOrder: number
}

export type VariantInfo = {
  value: string
  tokens: string[]
  wordCount: number
  charCount: number
  useRegex: boolean
  boundaryRegex?: RegExp
}

export type MatchType = 'EXACT' | 'WHOLE_WORD' | 'PARTIAL'

export type PatternMatch = {
  category: string
  confidence: number
  keywords: string[]
  boost: number
}
