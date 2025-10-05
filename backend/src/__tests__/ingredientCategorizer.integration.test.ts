import { describe, expect, it } from '@jest/globals'
import { ingredientCategorizer, INGREDIENT_CATEGORIES } from '@ingredient-categorizer/core'

/**
 * Lightweight integration test to verify the ingredient categorizer package
 * works correctly when integrated into the backend.
 *
 * Comprehensive unit tests live in packages/ingredient-categorizer/tests/
 */
describe('Ingredient Categorizer Integration', () => {
  it('should categorize common produce items', () => {
    const result = ingredientCategorizer.categorizeIngredient('2 cups chopped tomato')

    expect(result.displayName).toBe('Tomatoes')
    expect(result.category.id).toBe('PRODUCE')
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('should categorize meat and seafood items', () => {
    const result = ingredientCategorizer.categorizeIngredient('chicken breast')

    expect(result.displayName).toBe('Chicken Breast')
    expect(result.category.id).toBe('MEAT_SEAFOOD')
  })

  it('should handle canned vs fresh items correctly', () => {
    const fresh = ingredientCategorizer.categorizeIngredient('fresh tuna')
    const canned = ingredientCategorizer.categorizeIngredient('canned tuna')

    expect(fresh.category.id).toBe('MEAT_SEAFOOD')
    expect(canned.category.id).toBe('CANNED_JARRED')
  })

  it('should fall back to OTHER category for unknown ingredients', () => {
    const result = ingredientCategorizer.categorizeIngredient('quantum particles')

    expect(result.category.id).toBe('OTHER')
    expect(result.confidence).toBeLessThan(0.2)
  })

  it('should provide all categories', () => {
    const categories = ingredientCategorizer.getAllCategories()

    expect(categories.length).toBe(10)
    expect(categories[0]).toHaveProperty('id')
    expect(categories[0]).toHaveProperty('name')
    expect(categories[0]).toHaveProperty('emoji')
    expect(categories[0]).toHaveProperty('sortOrder')
  })

  it('should export category constants', () => {
    expect(INGREDIENT_CATEGORIES.PRODUCE).toBeDefined()
    expect(INGREDIENT_CATEGORIES.PRODUCE.id).toBe('PRODUCE')
    expect(INGREDIENT_CATEGORIES.PRODUCE.emoji).toBe('🥬')
  })

  it('should handle complex ingredient descriptions', () => {
    const result = ingredientCategorizer.categorizeIngredient(
      '1 small red onion, thinly sliced (about ½ cup) and rinsed in a sieve under warm water for 2 minutes)'
    )

    expect(result.displayName).toBe('Onions')
    expect(result.category.id).toBe('PRODUCE')
  })
})
