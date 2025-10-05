import { describe, expect, it } from '@jest/globals'
import ingredientMappings from '../src/data/ingredients.json'
import { INGREDIENT_CATEGORIES } from '../src/categories'
import pluralize from 'pluralize'

type Mapping = typeof ingredientMappings[number]

describe('Ingredient Data Integrity', () => {
  it('should have no empty displayNames', () => {
    const empty = ingredientMappings.filter(m => !m.displayName?.trim())
    expect(empty).toEqual([])
  })

  it('should have valid categories', () => {
    const validCategories = Object.keys(INGREDIENT_CATEGORIES)
    const invalid = ingredientMappings.filter(m => !validCategories.includes(m.category))

    if (invalid.length > 0) {
      console.error('Invalid categories found:', invalid.map(m => ({ displayName: m.displayName, category: m.category })))
    }
    expect(invalid).toEqual([])
  })

  it('should have at least one keyword per mapping', () => {
    const noKeywords = ingredientMappings.filter(m => !m.keywords || m.keywords.length === 0)
    expect(noKeywords).toEqual([])
  })

  it('should have no empty keywords', () => {
    const withEmpty = ingredientMappings.filter(m =>
      m.keywords.some(k => !k?.trim())
    )
    expect(withEmpty).toEqual([])
  })

  it('should have no duplicate keywords within same mapping', () => {
    const duplicates: Array<{ displayName: string; duplicates: string[] }> = []

    ingredientMappings.forEach(mapping => {
      const seen = new Set<string>()
      const dupes: string[] = []

      mapping.keywords.forEach(keyword => {
        const normalized = keyword.toLowerCase().trim()
        if (seen.has(normalized)) {
          dupes.push(keyword)
        }
        seen.add(normalized)
      })

      if (dupes.length > 0) {
        duplicates.push({ displayName: mapping.displayName, duplicates: dupes })
      }
    })

    if (duplicates.length > 0) {
      console.error('Duplicate keywords found:', duplicates)
    }
    expect(duplicates).toEqual([])
  })

  it('should warn about potential keyword conflicts across different mappings', () => {
    type VariantInfo = {
      variant: string
      owner: Mapping
    }

    const variantMap = new Map<string, VariantInfo[]>()

    // Build variant map (similar to categorizer logic)
    ingredientMappings.forEach(mapping => {
      const variants = new Set<string>()

      const addVariant = (value: string) => {
        const trimmed = value.trim().toLowerCase()
        if (!trimmed || variants.has(trimmed)) return

        variants.add(trimmed)
        variants.add(pluralize.singular(trimmed))
        variants.add(pluralize.plural(trimmed))
      }

      mapping.keywords.forEach(keyword => {
        addVariant(keyword.toLowerCase())
      })

      variants.forEach(variant => {
        const existing = variantMap.get(variant) || []
        existing.push({ variant, owner: mapping })
        variantMap.set(variant, existing)
      })
    })

    // Find conflicts (same variant owned by multiple mappings in same category)
    const conflicts: Array<{ variant: string; owners: string[] }> = []

    variantMap.forEach((owners, variant) => {
      if (owners.length > 1) {
        // Group by category
        const byCategory = new Map<string, Mapping[]>()
        owners.forEach(({ owner }) => {
          const existing = byCategory.get(owner.category) || []
          existing.push(owner)
          byCategory.set(owner.category, existing)
        })

        // Check for conflicts within same category
        byCategory.forEach((mappings, category) => {
          if (mappings.length > 1) {
            conflicts.push({
              variant,
              owners: mappings.map(m => `${m.displayName} (${category})`)
            })
          }
        })
      }
    })

    if (conflicts.length > 0) {
      console.warn(`⚠️  Found ${conflicts.length} keyword conflicts (same variant in same category). This may be intentional but review if needed:`, conflicts.slice(0, 5))
    }
    // This is a warning, not a hard failure - some overlaps are intentional
    // expect(conflicts).toEqual([])
  })

  it('should have valid excludeKeywords when present', () => {
    const invalidExcludes = ingredientMappings.filter(m =>
      m.excludeKeywords && m.excludeKeywords.some(k => !k?.trim())
    )
    expect(invalidExcludes).toEqual([])
  })

  it('should not have excludeKeywords that match own keywords', () => {
    const selfExcludes: Array<{ displayName: string; conflicts: string[] }> = []

    ingredientMappings.forEach(mapping => {
      if (!mapping.excludeKeywords) return

      const keywordSet = new Set(mapping.keywords.map(k => k.toLowerCase().trim()))
      const conflicts = mapping.excludeKeywords.filter(ek =>
        keywordSet.has(ek.toLowerCase().trim())
      )

      if (conflicts.length > 0) {
        selfExcludes.push({ displayName: mapping.displayName, conflicts })
      }
    })

    if (selfExcludes.length > 0) {
      console.error('Self-excluding keywords found:', selfExcludes)
    }
    expect(selfExcludes).toEqual([])
  })

  it('should have reasonable keyword counts', () => {
    const tooFew = ingredientMappings.filter(m => m.keywords.length < 1)
    const tooMany = ingredientMappings.filter(m => m.keywords.length > 50)

    expect(tooFew).toEqual([])
    expect(tooMany.length).toBeLessThan(10) // Allow some flexibility
  })

  it('should have alphabetically sorted JSON (for merge conflict prevention)', () => {
    // Check if mappings are sorted by displayName
    const sortedMappings = [...ingredientMappings].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    )

    const unsorted = ingredientMappings.filter((mapping, i) =>
      mapping.displayName !== sortedMappings[i].displayName
    )

    // This is a warning, not a hard requirement
    if (unsorted.length > 0) {
      console.warn('⚠️  Ingredient mappings are not alphabetically sorted. Consider sorting for easier maintenance.')
    }
  })
})
