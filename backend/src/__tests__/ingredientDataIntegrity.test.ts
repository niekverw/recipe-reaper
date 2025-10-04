import { describe, expect, it } from '@jest/globals'
import ingredientMappings from '../data/ingredients.json'
import { ingredientCategorizer } from '../utils/ingredientCategorizer'
import pluralize from 'pluralize'

type Mapping = typeof ingredientMappings[number]

type VariantInfo = {
  variant: string
  owner: Mapping
}

const normalizeKeywords = (keywords: string[] = []): string[] => {
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

const buildVariants = (mapping: Mapping): VariantInfo[] => {
  const variantSet = new Set<string>()

  normalizeKeywords(mapping.keywords).forEach(keyword => {
    const base = keyword.toLowerCase()
    variantSet.add(base)
    variantSet.add(pluralize.singular(base))
    variantSet.add(pluralize.plural(base))
  })

  return Array.from(variantSet)
    .map(variant => variant.trim())
    .filter(Boolean)
    .map(variant => ({ variant, owner: mapping }))
}

describe('ingredientMappings data integrity', () => {
  it('has unique display names', () => {
    const seen = new Map<string, string>()
    const duplicates: Array<{ name: string, firstCategory: string, secondCategory: string }> = []

    ingredientMappings.forEach(mapping => {
      const key = mapping.displayName.toLowerCase()
      const existing = seen.get(key)
      if (existing) {
        duplicates.push({ name: mapping.displayName, firstCategory: existing, secondCategory: mapping.category })
      } else {
        seen.set(key, mapping.category)
      }
    })

    expect(duplicates).toHaveLength(0)
  })

  it('ensures each normalized keyword variant maps to a single ingredient', () => {
    const ownerByVariant = new Map<string, Mapping>()
    const conflicts: Array<{ variant: string, first: string, second: string }> = []

    ingredientMappings.forEach(mapping => {
      buildVariants(mapping).forEach(({ variant }) => {
        const existing = ownerByVariant.get(variant)
        if (existing && existing.displayName !== mapping.displayName) {
          conflicts.push({ variant, first: existing.displayName, second: mapping.displayName })
        } else if (!existing) {
          ownerByVariant.set(variant, mapping)
        }
      })
    })

    expect(conflicts).toHaveLength(0)
  })

  it('categorizes every keyword variant back to its owning ingredient', () => {
    const mismatches: Array<{ variant: string, expected: string, received: string }> = []

    ingredientMappings.forEach(mapping => {
      buildVariants(mapping).forEach(({ variant }) => {
        const result = ingredientCategorizer.categorizeIngredient(variant)
        if (result.displayName !== mapping.displayName) {
          mismatches.push({ variant, expected: mapping.displayName, received: result.displayName })
        }
      })
    })

    expect(mismatches).toHaveLength(0)
  })
})
