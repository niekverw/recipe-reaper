import { describe, expect, it } from '@jest/globals'
import { ingredientCategorizer, INGREDIENT_CATEGORIES } from '../src'
import type { IngredientCategory } from '../src'

// Test case type for easy addition of new examples
type TestCase = {
	input: string
	expectedDisplayName: string
	expectedCategory: IngredientCategory
	minConfidence?: number
	exactConfidence?: number
	description?: string
}

// Exact match test cases (confidence = 1.0)
const exactMatchCases: TestCase[] = [
	{
		input: 'fresh tuna',
		expectedDisplayName: 'Tuna',
		expectedCategory: INGREDIENT_CATEGORIES.MEAT_SEAFOOD,
		exactConfidence: 1.0,
		description: 'exact keyword match'
	},
	{
		input: 'arborio',
		expectedDisplayName: 'Rice',
		expectedCategory: INGREDIENT_CATEGORIES.GRAINS_PASTA,
		exactConfidence: 1.0,
		description: 'arborio rice variety matches to rice'
	}
]

// Whole word match test cases (confidence = 0.85)
const wholeWordMatchCases: TestCase[] = [
	{
		input: '2 cups chopped tomato',
		expectedDisplayName: 'Tomatoes',
		expectedCategory: INGREDIENT_CATEGORIES.PRODUCE,
		exactConfidence: 0.85,
		description: 'whole word match with quantity and preparation'
	},
	{
		input: 'crumbled goat cheese',
		expectedDisplayName: 'Goat Cheese',
		expectedCategory: INGREDIENT_CATEGORIES.DAIRY_EGGS,
		minConfidence: 0.8,
		description: 'multi-word specificity over generic'
	},
	{
		input: 'almond milk beverage',
		expectedDisplayName: 'Almond Milk',
		expectedCategory: INGREDIENT_CATEGORIES.DAIRY_EGGS,
		minConfidence: 0.8,
		description: 'longer descriptive match preferred'
	},
	{
		input: 'shredded cheese blend',
		expectedDisplayName: 'Cheese',
		expectedCategory: INGREDIENT_CATEGORIES.DAIRY_EGGS,
		minConfidence: 0.8,
		description: 'fallback to generic when no specific match'
	}
]

// Exclude keyword behavior test cases
const excludeKeywordCases: TestCase[] = [
	{
		input: '1 canned tuna',
		expectedDisplayName: 'Canned Tuna',
		expectedCategory: INGREDIENT_CATEGORIES.CANNED_JARRED,
		exactConfidence: 0.85,
		description: 'exclude keyword triggers pattern fallback'
	}
]

// Complex real-world examples
const complexExampleCases: TestCase[] = [
	{
		input: '1 small red onion, thinly sliced (about ½ cup) and rinsed in a sieve under warm water for 2 minutes)',
		expectedDisplayName: 'Onions',
		expectedCategory: INGREDIENT_CATEGORIES.PRODUCE,
		minConfidence: 0.5,
		description: 'complex description with measurements and instructions'
	},
	{
		input: 'semolina pasta flour',
		expectedDisplayName: 'Flour',
		expectedCategory: INGREDIENT_CATEGORIES.GRAINS_PASTA,
		minConfidence: 0.6,
		description: 'multi-word ingredient with specific type'
	}
]

// Pattern heuristic test cases (frozen, canned, dried, etc.)
const patternHeuristicCases: TestCase[] = [
	{
		input: 'frozen mystery meal',
		expectedDisplayName: 'Mystery Meal',
		expectedCategory: INGREDIENT_CATEGORIES.FROZEN,
		exactConfidence: 0.9,
		description: 'frozen keyword triggers frozen category via pattern heuristic'
	},
	{
		input: 'jarred secret sauce',
		expectedDisplayName: 'Secret Sauce',
		expectedCategory: INGREDIENT_CATEGORIES.CANNED_JARRED,
		exactConfidence: 0.8,
		description: 'jarred keyword routes to canned/jarred category'
	}
]

// Preservation keyword handling (canned/frozen/dried fruits and produce)
const preservationKeywordCases: TestCase[] = [
	{
		input: 'canned mango',
		expectedDisplayName: 'Mango',
		expectedCategory: INGREDIENT_CATEGORIES.CANNED_JARRED,
		exactConfidence: 0.8,
		description: 'canned mango skips PRODUCE and falls back to CANNED_JARRED'
	},
	{
		input: 'canned sweetened mango pulp, preferably Alphonso (see Tips)',
		expectedDisplayName: 'Mango',
		expectedCategory: INGREDIENT_CATEGORIES.CANNED_JARRED,
		exactConfidence: 0.8,
		description: 'canned mango pulp with descriptors routes to CANNED_JARRED with Mango displayName'
	},
	{
		input: 'frozen mango',
		expectedDisplayName: 'Frozen Fruit',
		expectedCategory: INGREDIENT_CATEGORIES.FROZEN,
		minConfidence: 0.8,
		description: 'frozen mango matches specific frozen fruit entry'
	},
	{
		input: 'dried mango',
		expectedDisplayName: 'Mango',
		expectedCategory: INGREDIENT_CATEGORIES.PANTRY,
		exactConfidence: 0.7,
		description: 'dried mango skips PRODUCE and falls back to PANTRY'
	},
	{
		input: 'fresh mango',
		expectedDisplayName: 'Mango',
		expectedCategory: INGREDIENT_CATEGORIES.PRODUCE,
		minConfidence: 0.8,
		description: 'fresh mango correctly categorizes as PRODUCE'
	},
	{
		input: 'fresh or canned mango',
		expectedDisplayName: 'Mango',
		expectedCategory: INGREDIENT_CATEGORIES.PRODUCE,
		minConfidence: 0.8,
		description: 'fresh keyword takes precedence over canned'
	},
	{
		input: 'canned peaches',
		expectedDisplayName: 'Peaches',
		expectedCategory: INGREDIENT_CATEGORIES.CANNED_JARRED,
		exactConfidence: 0.8,
		description: 'canned peaches routes to CANNED_JARRED'
	},
	{
		input: 'frozen pineapple',
		expectedDisplayName: 'Frozen Fruit',
		expectedCategory: INGREDIENT_CATEGORIES.FROZEN,
		minConfidence: 0.8,
		description: 'frozen pineapple matches frozen fruit entry'
	}
]

// Edge cases and typos (for future fuzzy matching implementation)
const edgeCasesAndTypos: TestCase[] = [
	{
		input: 'quantum dust',
		expectedDisplayName: 'Quantum Dust',
		expectedCategory: INGREDIENT_CATEGORIES.OTHER,
		exactConfidence: 0.1,
		description: 'unknown ingredient falls back to OTHER category'
	}
]

describe('ingredientCategorizer', () => {
	describe('Exact Matches', () => {
		it.each(exactMatchCases)(
			'$description: "$input" → $expectedDisplayName',
			({ input, expectedDisplayName, expectedCategory, exactConfidence, minConfidence }) => {
				const result = ingredientCategorizer.categorizeIngredient(input)
				expect(result.displayName).toBe(expectedDisplayName)
				expect(result.category).toEqual(expectedCategory)

				if (exactConfidence !== undefined) {
					expect(result.confidence).toBeCloseTo(exactConfidence)
				} else if (minConfidence !== undefined) {
					expect(result.confidence).toBeGreaterThanOrEqual(minConfidence)
				}
			}
		)
	})

	describe('Whole Word Matches', () => {
		it.each(wholeWordMatchCases)(
			'$description: "$input" → $expectedDisplayName',
			({ input, expectedDisplayName, expectedCategory, exactConfidence, minConfidence }) => {
				const result = ingredientCategorizer.categorizeIngredient(input)
				expect(result.displayName).toBe(expectedDisplayName)
				expect(result.category).toEqual(expectedCategory)

				if (exactConfidence !== undefined) {
					expect(result.confidence).toBeCloseTo(exactConfidence)
				} else if (minConfidence !== undefined) {
					expect(result.confidence).toBeGreaterThanOrEqual(minConfidence)
				}
			}
		)
	})

	describe('Exclude Keyword Behavior', () => {
		it.each(excludeKeywordCases)(
			'$description: "$input" → $expectedDisplayName',
			({ input, expectedDisplayName, expectedCategory, exactConfidence, minConfidence }) => {
				const result = ingredientCategorizer.categorizeIngredient(input)
				expect(result.displayName).toBe(expectedDisplayName)
				expect(result.category).toEqual(expectedCategory)

				if (exactConfidence !== undefined) {
					expect(result.confidence).toBeCloseTo(exactConfidence)
				} else if (minConfidence !== undefined) {
					expect(result.confidence).toBeGreaterThanOrEqual(minConfidence)
				}
			}
		)
	})

	describe('Complex Real-World Examples', () => {
		it.each(complexExampleCases)(
			'$description: "$input" → $expectedDisplayName',
			({ input, expectedDisplayName, expectedCategory, exactConfidence, minConfidence }) => {
				const result = ingredientCategorizer.categorizeIngredient(input)
				expect(result.displayName).toBe(expectedDisplayName)
				expect(result.category).toEqual(expectedCategory)

				if (exactConfidence !== undefined) {
					expect(result.confidence).toBeCloseTo(exactConfidence)
				} else if (minConfidence !== undefined) {
					expect(result.confidence).toBeGreaterThanOrEqual(minConfidence)
				}
			}
		)
	})

	describe('Pattern Heuristics', () => {
		// Tests for frozen, canned, dried, ground, fresh patterns
		it.each(patternHeuristicCases)(
			'$description: "$input" → $expectedDisplayName',
			({ input, expectedDisplayName, expectedCategory, exactConfidence, minConfidence }) => {
				const result = ingredientCategorizer.categorizeIngredient(input)
				expect(result.displayName).toBe(expectedDisplayName)
				expect(result.category).toEqual(expectedCategory)

				if (exactConfidence !== undefined) {
					expect(result.confidence).toBeCloseTo(exactConfidence)
				} else if (minConfidence !== undefined) {
					expect(result.confidence).toBeGreaterThanOrEqual(minConfidence)
				}
			}
		)
	})

	describe('Preservation Keyword Handling', () => {
		// Tests for canned/frozen/dried overriding fresh ingredient categories
		it.each(preservationKeywordCases)(
			'$description: "$input" → $expectedDisplayName',
			({ input, expectedDisplayName, expectedCategory, exactConfidence, minConfidence }) => {
				const result = ingredientCategorizer.categorizeIngredient(input)
				expect(result.displayName).toBe(expectedDisplayName)
				expect(result.category).toEqual(expectedCategory)

				if (exactConfidence !== undefined) {
					expect(result.confidence).toBeCloseTo(exactConfidence)
				} else if (minConfidence !== undefined) {
					expect(result.confidence).toBeGreaterThanOrEqual(minConfidence)
				}
			}
		)
	})

	describe('Edge Cases and Typos', () => {
		// Future fuzzy matching tests
		it.each(edgeCasesAndTypos)(
			'$description: "$input" → $expectedDisplayName',
			({ input, expectedDisplayName, expectedCategory, exactConfidence, minConfidence }) => {
				const result = ingredientCategorizer.categorizeIngredient(input)
				expect(result.displayName).toBe(expectedDisplayName)
				expect(result.category).toEqual(expectedCategory)

				if (exactConfidence !== undefined) {
					expect(result.confidence).toBeCloseTo(exactConfidence)
				} else if (minConfidence !== undefined) {
					expect(result.confidence).toBeGreaterThanOrEqual(minConfidence)
				}
			}
		)
	})
})
