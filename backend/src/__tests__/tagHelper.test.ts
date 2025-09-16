import { TagHelper } from '../utils/tagHelper'

describe('TagHelper', () => {
  describe('normalizeTag', () => {
    it('should capitalize the first letter of each word', () => {
      expect(TagHelper.normalizeTag('italian cuisine')).toBe('Italian Cuisine')
      expect(TagHelper.normalizeTag('VEGETARIAN')).toBe('Vegetarian')
      expect(TagHelper.normalizeTag('quick-meals')).toBe('Quick-meals')
      expect(TagHelper.normalizeTag('30 minute meals')).toBe('30 Minute Meals')
    })

    it('should handle single words', () => {
      expect(TagHelper.normalizeTag('dessert')).toBe('Dessert')
      expect(TagHelper.normalizeTag('BREAKFAST')).toBe('Breakfast')
    })

    it('should trim whitespace', () => {
      expect(TagHelper.normalizeTag('  spicy   ')).toBe('Spicy')
      expect(TagHelper.normalizeTag('  comfort food  ')).toBe('Comfort Food')
    })

    it('should handle empty or invalid input', () => {
      expect(TagHelper.normalizeTag('')).toBe('')
      expect(TagHelper.normalizeTag('   ')).toBe('')
      expect(TagHelper.normalizeTag(null as any)).toBe('')
      expect(TagHelper.normalizeTag(undefined as any)).toBe('')
    })
  })

  describe('normalizeTags', () => {
    it('should normalize multiple tags', () => {
      const input = ['italian cuisine', 'VEGETARIAN', 'quick meals']
      const expected = ['Italian Cuisine', 'Vegetarian', 'Quick Meals']
      expect(TagHelper.normalizeTags(input)).toEqual(expected)
    })

    it('should remove duplicates', () => {
      const input = ['italian', 'ITALIAN', 'Italian', 'vegetarian']
      const expected = ['Italian', 'Vegetarian']
      expect(TagHelper.normalizeTags(input)).toEqual(expected)
    })

    it('should filter out empty tags', () => {
      const input = ['italian', '', '  ', 'vegetarian']
      const expected = ['Italian', 'Vegetarian']
      expect(TagHelper.normalizeTags(input)).toEqual(expected)
    })

    it('should handle invalid input', () => {
      expect(TagHelper.normalizeTags(null as any)).toEqual([])
      expect(TagHelper.normalizeTags(undefined as any)).toEqual([])
      expect(TagHelper.normalizeTags([])).toEqual([])
    })
  })

  describe('isValidTag', () => {
    it('should validate normal tags', () => {
      expect(TagHelper.isValidTag('Italian')).toBe(true)
      expect(TagHelper.isValidTag('Quick Meals')).toBe(true)
      expect(TagHelper.isValidTag('30 Minute')).toBe(true)
    })

    it('should reject empty or whitespace tags', () => {
      expect(TagHelper.isValidTag('')).toBe(false)
      expect(TagHelper.isValidTag('   ')).toBe(false)
      expect(TagHelper.isValidTag(null as any)).toBe(false)
      expect(TagHelper.isValidTag(undefined as any)).toBe(false)
    })

    it('should reject tags that are too long', () => {
      const longTag = 'a'.repeat(51)
      expect(TagHelper.isValidTag(longTag)).toBe(false)
    })

    it('should reject tags with special characters', () => {
      expect(TagHelper.isValidTag('tag<script>')).toBe(false)
      expect(TagHelper.isValidTag('tag{}')).toBe(false)
      expect(TagHelper.isValidTag('tag[]')).toBe(false)
      expect(TagHelper.isValidTag('tag\\')).toBe(false)
    })
  })
})