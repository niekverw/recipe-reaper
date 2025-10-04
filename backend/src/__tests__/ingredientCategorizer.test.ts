import { describe, expect, it } from '@jest/globals'
import { ingredientCategorizer, INGREDIENT_CATEGORIES } from '../utils/ingredientCategorizer'

describe('ingredientCategorizer', () => {
	it('returns a high confidence exact match when the ingredient matches a keyword exactly', () => {
		const result = ingredientCategorizer.categorizeIngredient('fresh tuna')

		expect(result.displayName).toBe('Tuna')
		expect(result.category).toEqual(INGREDIENT_CATEGORIES.MEAT_SEAFOOD)
		expect(result.confidence).toBeCloseTo(1)
	})

	it('uses keyword inclusion when no exact match is found', () => {
		const result = ingredientCategorizer.categorizeIngredient('2 cups chopped tomato')

		expect(result.displayName).toBe('Tomatoes')
		expect(result.category).toEqual(INGREDIENT_CATEGORIES.PRODUCE)
		expect(result.confidence).toBeCloseTo(0.85)
	})

	it('respects exclude keywords and falls back when excluded terms are present', () => {
		const result = ingredientCategorizer.categorizeIngredient('1 canned tuna')

		expect(result.displayName).toBe('Canned Tuna')
		expect(result.category).toEqual(INGREDIENT_CATEGORIES.CANNED_JARRED)
		expect(result.confidence).toBeCloseTo(0.85)
	})

	it('prefers the most specific multi-word match when multiple mappings apply', () => {
		const result = ingredientCategorizer.categorizeIngredient('crumbled goat cheese')

		expect(result.displayName).toBe('Goat Cheese')
		expect(result.category).toEqual(INGREDIENT_CATEGORIES.DAIRY_EGGS)
	})

	it('chooses longer descriptive match over generic alternatives', () => {
		const result = ingredientCategorizer.categorizeIngredient('almond milk beverage')

		expect(result.displayName).toBe('Almond Milk')
		expect(result.category).toEqual(INGREDIENT_CATEGORIES.DAIRY_EGGS)
	})

	it('still falls back to generic mapping when no specific keywords exist', () => {
		const result = ingredientCategorizer.categorizeIngredient('shredded cheese blend')

		expect(result.displayName).toBe('Cheese')
		expect(result.category).toEqual(INGREDIENT_CATEGORIES.DAIRY_EGGS)
	})

	it('categorizes complex onion description to onions in produce', () => {
		const result = ingredientCategorizer.categorizeIngredient('1 small red onion, thinly sliced (about ½ cup) and rinsed in a sieve under warm water for 2 minutes)')

		expect(result.displayName).toBe('Onions')
		expect(result.category).toEqual(INGREDIENT_CATEGORIES.PRODUCE)
		expect(result.confidence).toBeGreaterThan(0.5)
	})
})
