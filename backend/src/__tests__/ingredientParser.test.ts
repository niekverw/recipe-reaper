import { IngredientParser } from '../utils/ingredientParser'

describe('Ingredient Parser Tests', () => {
  let parser: IngredientParser

  beforeEach(() => {
    parser = new IngredientParser()
  })

  describe('Basic Parsing', () => {
    it('should parse simple ingredients', () => {
      const result = parser.parseIngredient('2 cups flour')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        quantity: 2,
        quantity2: null,
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false,
        originalText: '2 cups flour'
      })
    })

    it('should parse fractional quantities', () => {
      const result = parser.parseIngredient('1 1/2 cups sugar')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        quantity: 1.5,
        unitOfMeasure: 'cup',
        description: 'sugar'
      })
    })

    it('should parse range quantities', () => {
      const result = parser.parseIngredient('1-2 tablespoons olive oil')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        quantity: 1,
        quantity2: 2,
        unitOfMeasure: 'tablespoon',
        description: 'olive oil'
      })
    })

    it('should parse ingredients without units', () => {
      const result = parser.parseIngredient('2 large eggs')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        quantity: 2,
        unitOfMeasure: null,
        description: 'large eggs'
      })
    })

    it('should parse ingredients with complex descriptions', () => {
      const result = parser.parseIngredient('1 medium onion, finely chopped')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        quantity: 1,
        unitOfMeasure: null,
        description: 'medium onion, finely chopped'
      })
    })

    it('should detect group headers', () => {
      const result = parser.parseIngredient('For the sauce:')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        isGroupHeader: true,
        description: 'For the sauce:',
        quantity: null
      })
    })
  })

  describe('Multiple Ingredients', () => {
    it('should parse array of ingredients', () => {
      const ingredients = [
        '2 cups flour',
        '1 tsp salt',
        '3 large eggs',
        'For topping:'
      ]

      const result = parser.parseIngredients(ingredients)
      expect(result).toHaveLength(4)
      expect(result[0].description).toBe('flour')
      expect(result[1].description).toBe('salt')
      expect(result[2].description).toBe('large eggs')
      expect(result[3].isGroupHeader).toBe(true)
    })

    it('should parse multiline text', () => {
      const text = `2 cups flour
1 tsp baking powder
1/2 cup butter
3 eggs

For icing:
1 cup powdered sugar`

      const result = parser.parseIngredientsFromText(text)
      expect(result.length).toBeGreaterThan(4)

      const flourResult = result.find(r => r.description === 'flour')
      expect(flourResult).toMatchObject({
        quantity: 2,
        unitOfMeasure: 'cup'
      })
    })
  })

  describe('Serving Size Estimation', () => {
    it('should estimate servings for small batch', () => {
      const ingredients = ['1/2 cup flour', '1 egg']
      const servings = parser.estimateServingsFromIngredients(ingredients)
      expect(servings).toBeLessThanOrEqual(4)
    })

    it('should estimate servings for large batch', () => {
      const ingredients = [
        '4 cups flour',
        '2 cups sugar',
        '1 cup butter',
        '6 eggs'
      ]
      const servings = parser.estimateServingsFromIngredients(ingredients)
      expect(servings).toBeGreaterThanOrEqual(6)
    })

    it('should estimate servings for ingredients without units', () => {
      const ingredients = ['12 cookies', '6 apples']
      const servings = parser.estimateServingsFromIngredients(ingredients)
      expect(servings).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Prep Time Estimation', () => {
    it('should estimate prep time for simple ingredients', () => {
      const ingredients = ['2 cups flour', '1 cup sugar']
      const prepTime = parser.estimatePrepTimeFromIngredients(ingredients)
      expect(prepTime).toBeGreaterThanOrEqual(10) // Minimum time
    })

    it('should estimate higher prep time for complex ingredients', () => {
      const simpleIngredients = ['2 cups flour', '1 cup sugar']
      const complexIngredients = [
        '2 large onions, finely chopped',
        '4 cloves garlic, minced',
        '3 carrots, diced',
        'For marinade:'
      ]

      const simpleTime = parser.estimatePrepTimeFromIngredients(simpleIngredients)
      const complexTime = parser.estimatePrepTimeFromIngredients(complexIngredients)

      expect(complexTime).toBeGreaterThan(simpleTime)
    })
  })

  describe('Ingredient Validation', () => {
    it('should validate good ingredients', () => {
      const ingredients = [
        '2 cups flour',
        '1 tsp salt',
        '3 eggs'
      ]

      const { valid, invalid } = parser.validateIngredients(ingredients)
      expect(valid).toHaveLength(3)
      expect(invalid).toHaveLength(0)
    })

    it('should identify invalid ingredients', () => {
      const ingredients = [
        '2 cups flour',
        '',
        '   ',
        'just some text without numbers or structure that might confuse the parser'
      ]

      const { valid, invalid } = parser.validateIngredients(ingredients)
      expect(valid.length).toBeGreaterThan(0)
      expect(invalid.length).toBeGreaterThan(0)
    })
  })

  describe('Ingredient Scaling', () => {
    it('should scale ingredients by 2x', () => {
      const ingredients = [
        '1 cup flour',
        '1/2 cup sugar',
        '2 eggs'
      ]

      const scaled = parser.scaleIngredients(ingredients, 2)
      expect(scaled).toHaveLength(3)

      // Check if quantities are scaled
      const flourResult = parser.parseIngredient(scaled[0])
      expect(flourResult[0].quantity).toBe(2)

      const sugarResult = parser.parseIngredient(scaled[1])
      expect(sugarResult[0].quantity).toBe(1)
    })

    it('should scale fractional ingredients', () => {
      const ingredients = ['1 1/2 cups flour']
      const scaled = parser.scaleIngredients(ingredients, 0.5)

      const result = parser.parseIngredient(scaled[0])
      expect(result[0].quantity).toBe(0.75)
    })

    it('should handle range ingredients when scaling', () => {
      const ingredients = ['1-2 tablespoons oil']
      const scaled = parser.scaleIngredients(ingredients, 2)

      const result = parser.parseIngredient(scaled[0])
      expect(result[0].quantity).toBe(2)
      expect(result[0].quantity2).toBe(4)
    })

    it('should not scale group headers', () => {
      const ingredients = ['For topping:', '1 cup sugar']
      const scaled = parser.scaleIngredients(ingredients, 2)

      expect(scaled[0]).toBe('For topping:') // Unchanged

      const sugarResult = parser.parseIngredient(scaled[1])
      expect(sugarResult[0].quantity).toBe(2) // Scaled
    })

    it('should not scale size measurements with inch symbols', () => {
      const ingredients = [
        '5 medium zucchini sliced into 1/4" discs',
        '2 cups flour, rolled 1/8" thick',
        '3 carrots cut into 1/2 inch pieces'
      ]
      const scaled = parser.scaleIngredients(ingredients, 2)

      // Quantities should be scaled, but size measurements should remain unchanged
      expect(scaled[0]).toContain('1/4"') // Size measurement unchanged
      expect(scaled[0]).toContain('10') // Quantity scaled from 5 to 10

      expect(scaled[1]).toContain('1/8"') // Size measurement unchanged
      expect(scaled[1]).toContain('4') // Quantity scaled from 2 to 4

      expect(scaled[2]).toContain('1/2 inch') // Size measurement unchanged
      expect(scaled[2]).toContain('6') // Quantity scaled from 3 to 6
    })

    it('should not scale size measurements with various units', () => {
      const ingredients = [
        '1 beef tenderloin, cut 2 inches thick',
        '4 bell peppers, sliced 3mm thin',
        '2 onions, diced 5cm pieces',
        '1 cucumber, cut into 1/4-inch rounds'
      ]
      const scaled = parser.scaleIngredients(ingredients, 3)

      expect(scaled[0]).toContain('2 inches') // Size unchanged
      expect(scaled[0]).toContain('3') // Quantity scaled from 1 to 3

      expect(scaled[1]).toContain('3mm') // Size unchanged
      expect(scaled[1]).toContain('12') // Quantity scaled from 4 to 12

      expect(scaled[2]).toContain('5cm') // Size unchanged
      expect(scaled[2]).toContain('6') // Quantity scaled from 2 to 6

      expect(scaled[3]).toContain('1/4-inch') // Size unchanged
      expect(scaled[3]).toContain('3') // Quantity scaled from 1 to 3
    })

    it('should scale quantities but preserve mixed size and quantity measurements', () => {
      const ingredients = [
        '3 medium potatoes, cut into 1/2 inch cubes',
        '2 1/2 cups flour, rolled 1/8" thick',
        '1.5 pounds chicken, sliced 3/4 inch thick'
      ]
      const scaled = parser.scaleIngredients(ingredients, 2)

      // Check that quantities are scaled but sizes are preserved
      expect(scaled[0]).toContain('6') // Quantity scaled from 3 to 6
      expect(scaled[0]).toContain('1/2 inch') // Size preserved

      expect(scaled[1]).toContain('5') // Quantity scaled from 2.5 to 5
      expect(scaled[1]).toContain('1/8"') // Size preserved

      expect(scaled[2]).toContain('3') // Quantity scaled from 1.5 to 3
      expect(scaled[2]).toContain('3/4 inch') // Size preserved
    })

    it('should handle decimal scaling with size measurements', () => {
      const ingredients = [
        '4 tomatoes, sliced 1/4 inch thick',
        '6 carrots, cut into 2" pieces'
      ]
      const scaled = parser.scaleIngredients(ingredients, 0.5)

      expect(scaled[0]).toContain('2') // Quantity scaled from 4 to 2
      expect(scaled[0]).toContain('1/4 inch') // Size preserved

      expect(scaled[1]).toContain('3') // Quantity scaled from 6 to 3
      expect(scaled[1]).toContain('2"') // Size preserved
    })

    it('should handle edge cases with size measurements', () => {
      const ingredients = [
        '12 cookies, each 3" diameter',
        '1 pie crust, 9 inch diameter',
        '2 steaks, 1.5 inches thick',
        'Salt and pepper to taste'
      ]
      const scaled = parser.scaleIngredients(ingredients, 2)

      expect(scaled[0]).toContain('24') // Quantity scaled
      expect(scaled[0]).toContain('3"') // Size preserved

      expect(scaled[1]).toContain('2') // Quantity scaled
      expect(scaled[1]).toContain('9 inch') // Size preserved

      expect(scaled[2]).toContain('4') // Quantity scaled
      expect(scaled[2]).toContain('1.5 inches') // Size preserved

      expect(scaled[3]).toBe('Salt and pepper to taste') // No quantities, unchanged
    })
  })

  describe('Options', () => {
    it('should normalize units when requested', () => {
      const result = parser.parseIngredient('2 tbsp olive oil', { normalizeUOM: true })
      expect(result[0].unitOfMeasure).toBe('tablespoon')
    })

    it('should ignore specified units of measure', () => {
      const result = parser.parseIngredient('2 large eggs', {
        ignoreUOMs: ['large', 'medium', 'small']
      })
      expect(result[0].unitOfMeasure).toBe(null)
      expect(result[0].description).toBe('large eggs')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty ingredients', () => {
      const result = parser.parseIngredient('')
      expect(result).toHaveLength(0)
    })

    it('should handle whitespace-only ingredients', () => {
      const result = parser.parseIngredient('   ')
      expect(result).toHaveLength(0)
    })

    it('should handle very long ingredient descriptions', () => {
      const longDescription = '2 cups all-purpose flour, sifted twice, preferably organic and stone-ground from winter wheat'
      const result = parser.parseIngredient(longDescription)

      expect(result).toHaveLength(1)
      expect(result[0].quantity).toBe(2)
      expect(result[0].unitOfMeasure).toBe('cup')
      expect(result[0].description).toContain('flour')
    })

    it('should handle ingredients with special characters', () => {
      const result = parser.parseIngredient('1/2 cup jalapeño peppers, seeded & diced')
      expect(result).toHaveLength(1)
      expect(result[0].quantity).toBe(0.5)
      expect(result[0].description).toContain('jalapeño')
    })
  })
})