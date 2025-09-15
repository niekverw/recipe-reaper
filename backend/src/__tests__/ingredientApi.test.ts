import request from 'supertest'
import { app } from '../index'

describe('Ingredient API Tests', () => {
  describe('POST /api/ingredients/parse', () => {
    it('should parse ingredient strings', async () => {
      const requestData = {
        ingredients: [
          '2 cups flour',
          '1 1/2 tsp salt',
          '3 large eggs'
        ]
      }

      const response = await request(app)
        .post('/api/ingredients/parse')
        .send(requestData)
        .expect(200)

      expect(response.body.parsed).toHaveLength(3)
      expect(response.body.parsed[0]).toMatchObject({
        quantity: 2,
        unitOfMeasure: 'cup',
        description: 'flour',
        isGroupHeader: false
      })

      expect(response.body.validation.valid).toHaveLength(3)
      expect(response.body.validation.invalid).toHaveLength(0)

      expect(response.body.estimatedServings).toBeGreaterThan(0)
      expect(response.body.estimatedPrepTime).toBeGreaterThanOrEqual(10)
    })

    it('should handle parsing options', async () => {
      const requestData = {
        ingredients: ['2 tbsp olive oil'],
        options: {
          normalizeUOM: true
        }
      }

      const response = await request(app)
        .post('/api/ingredients/parse')
        .send(requestData)
        .expect(200)

      expect(response.body.parsed[0].unitOfMeasure).toBe('tablespoon')
    })

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/ingredients/parse')
        .send({ ingredients: 'not an array' })
        .expect(400)

      expect(response.body.error.message).toContain('array')
    })

    it('should handle empty ingredient arrays', async () => {
      const response = await request(app)
        .post('/api/ingredients/parse')
        .send({ ingredients: [] })
        .expect(200)

      expect(response.body.parsed).toHaveLength(0)
      expect(response.body.validation.valid).toHaveLength(0)
    })
  })

  describe('POST /api/ingredients/scale', () => {
    it('should scale ingredients by factor', async () => {
      const requestData = {
        ingredients: [
          '1 cup flour',
          '1/2 tsp salt'
        ],
        scaleFactor: 2
      }

      const response = await request(app)
        .post('/api/ingredients/scale')
        .send(requestData)
        .expect(200)

      expect(response.body.scaledIngredients).toHaveLength(2)
      expect(response.body.scaleFactor).toBe(2)

      // Verify scaling worked
      expect(response.body.scaledIngredients[0]).toContain('2')
      expect(response.body.scaledIngredients[0]).toContain('cup')
      expect(response.body.scaledIngredients[0]).toContain('flour')
    })

    it('should scale by fractional factors', async () => {
      const requestData = {
        ingredients: ['2 cups flour'],
        scaleFactor: 0.5
      }

      const response = await request(app)
        .post('/api/ingredients/scale')
        .send(requestData)
        .expect(200)

      expect(response.body.scaledIngredients[0]).toContain('1')
    })

    it('should return 400 for invalid scale factor', async () => {
      const response = await request(app)
        .post('/api/ingredients/scale')
        .send({
          ingredients: ['1 cup flour'],
          scaleFactor: -1
        })
        .expect(400)

      expect(response.body.error.message).toContain('positive number')
    })

    it('should return 400 for non-array ingredients', async () => {
      const response = await request(app)
        .post('/api/ingredients/scale')
        .send({
          ingredients: 'not an array',
          scaleFactor: 2
        })
        .expect(400)

      expect(response.body.error.message).toContain('array')
    })
  })

  describe('POST /api/ingredients/parse-text', () => {
    it('should parse multiline ingredient text', async () => {
      const requestData = {
        text: `2 cups all-purpose flour
1 tsp baking powder
1/2 cup butter, softened
3 large eggs

For icing:
1 cup powdered sugar
2 tbsp milk`
      }

      const response = await request(app)
        .post('/api/ingredients/parse-text')
        .send(requestData)
        .expect(200)

      expect(response.body.parsed.length).toBeGreaterThan(5)
      expect(response.body.ingredients).toHaveLength(7)

      // Check that group header was detected
      const groupHeader = response.body.parsed.find((p: any) => p.isGroupHeader)
      expect(groupHeader).toBeDefined()
      expect(groupHeader.description).toContain('icing')

      expect(response.body.estimatedServings).toBeGreaterThan(0)
      expect(response.body.estimatedPrepTime).toBeGreaterThanOrEqual(10)
    })

    it('should handle empty text', async () => {
      const response = await request(app)
        .post('/api/ingredients/parse-text')
        .send({ text: '' })
        .expect(200)

      expect(response.body.parsed).toHaveLength(0)
      expect(response.body.ingredients).toHaveLength(0)
    })

    it('should handle whitespace-only text', async () => {
      const response = await request(app)
        .post('/api/ingredients/parse-text')
        .send({ text: '   \n\n   \n  ' })
        .expect(200)

      expect(response.body.parsed).toHaveLength(0)
      expect(response.body.ingredients).toHaveLength(0)
    })

    it('should return 400 for non-string text', async () => {
      const response = await request(app)
        .post('/api/ingredients/parse-text')
        .send({ text: 123 })
        .expect(400)

      expect(response.body.error.message).toContain('string')
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle mixed ingredient complexity', async () => {
      const requestData = {
        ingredients: [
          'For the cake:',
          '2 1/2 cups all-purpose flour, sifted',
          '1-2 tsp vanilla extract',
          '3 large eggs, room temperature',
          '1/4 cup vegetable oil',
          'For garnish:',
          'Fresh berries',
          'Powdered sugar for dusting'
        ]
      }

      const response = await request(app)
        .post('/api/ingredients/parse')
        .send(requestData)
        .expect(200)

      expect(response.body.parsed.length).toBeGreaterThan(6)

      // Check group headers
      const groupHeaders = response.body.parsed.filter((p: any) => p.isGroupHeader)
      expect(groupHeaders).toHaveLength(2)

      // Check range quantity
      const vanillaExtract = response.body.parsed.find((p: any) =>
        p.description && p.description.includes('vanilla'))
      expect(vanillaExtract).toMatchObject({
        quantity: 1,
        quantity2: 2
      })

      // Check complex description
      const flour = response.body.parsed.find((p: any) =>
        p.description && p.description.includes('flour'))
      expect(flour.description).toContain('sifted')

      // Should handle ingredients without measurements
      const berries = response.body.parsed.find((p: any) =>
        p.description && p.description.includes('berries'))
      expect(berries).toBeDefined()
      expect(berries.quantity).toBeNull()
    })

    it('should provide accurate estimates for complex recipes', async () => {
      const requestData = {
        ingredients: [
          '4 cups bread flour',
          '2 1/4 tsp active dry yeast',
          '2 tsp salt',
          '1 1/2 cups warm water',
          '2 tbsp olive oil',
          '2 large onions, thinly sliced',
          '3 cloves garlic, minced',
          '1 lb Italian sausage, casings removed',
          '1 can (28 oz) crushed tomatoes',
          '2 cups mozzarella cheese, shredded',
          'Fresh basil leaves, torn'
        ]
      }

      const response = await request(app)
        .post('/api/ingredients/parse')
        .send(requestData)
        .expect(200)

      // Large quantities should suggest more servings
      expect(response.body.estimatedServings).toBeGreaterThanOrEqual(6)

      // Complex ingredients with prep work should take more time
      expect(response.body.estimatedPrepTime).toBeGreaterThan(20)
    })
  })
})