import {
  parseServings,
  normalizeArray,
  buildRecipeTextFromScrape,
  parseImageUrl
} from '../utils/recipeHelpers'

describe('recipeHelpers', () => {
  describe('parseServings', () => {
    it('should extract number from servings string', () => {
      expect(parseServings('4 servings')).toBe(4)
      expect(parseServings('Serves 6')).toBe(6)
      expect(parseServings('12')).toBe(12)
    })

    it('should return undefined for invalid input', () => {
      expect(parseServings(undefined)).toBeUndefined()
      expect(parseServings('')).toBeUndefined()
      expect(parseServings('no numbers')).toBeUndefined()
    })
  })

  describe('normalizeArray', () => {
    it('should convert string to array', () => {
      const result = normalizeArray('line1\nline2\nline3')
      expect(result).toEqual(['line1', 'line2', 'line3'])
    })

    it('should filter empty strings from array', () => {
      const result = normalizeArray(['item1', '', 'item2', '  ', 'item3'])
      expect(result).toEqual(['item1', 'item2', 'item3'])
    })

    it('should handle array input', () => {
      const result = normalizeArray(['a', 'b', 'c'])
      expect(result).toEqual(['a', 'b', 'c'])
    })

    it('should return empty array for null/undefined', () => {
      expect(normalizeArray(null)).toEqual([])
      expect(normalizeArray(undefined)).toEqual([])
    })

    it('should convert non-string values to strings', () => {
      const result = normalizeArray([1, 2, 3])
      expect(result).toEqual(['1', '2', '3'])
    })
  })

  describe('buildRecipeTextFromScrape', () => {
    it('should build formatted recipe text', () => {
      const data = {
        name: 'Test Recipe',
        description: 'A test recipe',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        yields: '4 servings'
      }
      const ingredients = ['1 cup flour', '2 eggs']
      const instructions = ['Mix ingredients', 'Bake']

      const result = buildRecipeTextFromScrape(data, ingredients, instructions)

      expect(result).toContain('Recipe Name: Test Recipe')
      expect(result).toContain('Description: A test recipe')
      expect(result).toContain('Ingredients:')
      expect(result).toContain('- 1 cup flour')
      expect(result).toContain('Instructions:')
      expect(result).toContain('1. Mix ingredients')
      expect(result).toContain('Prep Time: 10 minutes')
    })

    it('should handle minimal data', () => {
      const result = buildRecipeTextFromScrape({}, [], [])
      expect(result).toBe('')
    })
  })

  describe('parseImageUrl', () => {
    it('should return string URLs as-is', () => {
      const url = 'https://example.com/image.jpg'
      expect(parseImageUrl(url)).toBe(url)
    })

    it('should extract url property from object', () => {
      const obj = { url: 'https://example.com/image.jpg' }
      expect(parseImageUrl(obj)).toBe('https://example.com/image.jpg')
    })

    it('should extract contentUrl property from object', () => {
      const obj = { contentUrl: 'https://example.com/image.jpg' }
      expect(parseImageUrl(obj)).toBe('https://example.com/image.jpg')
    })

    it('should extract @id property when it is a URL', () => {
      const obj = { '@id': 'https://example.com/image.jpg' }
      expect(parseImageUrl(obj)).toBe('https://example.com/image.jpg')
    })

    it('should return undefined for invalid input', () => {
      expect(parseImageUrl(undefined)).toBeUndefined()
      expect(parseImageUrl(null)).toBeUndefined()
      expect(parseImageUrl({})).toBeUndefined()
      expect(parseImageUrl({ '@id': 'not-a-url' })).toBeUndefined()
    })
  })
})
