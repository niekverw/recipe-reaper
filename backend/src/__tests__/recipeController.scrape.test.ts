import request from 'supertest'
import express from 'express'
import { recipeRoutes } from '../routes/recipes'
import { Database } from '../models/database'

// Mock the recipe scraper
jest.mock('@jitl/recipe-data-scraper', () => {
  return jest.fn()
})

const mockScraper = require('@jitl/recipe-data-scraper')

// Create test app
const app = express()
app.use(express.json())
app.use('/api/recipes', recipeRoutes)

// Error handler middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = error.statusCode || error.status || 500
  res.status(statusCode).json({
    error: {
      message: error.message || 'Internal server error'
    }
  })
})

describe('Recipe Scraper API', () => {
  beforeAll(async () => {
    // Initialize test database
    await Database.getInstance().initialize(':memory:')
  })

  afterAll(async () => {
    await Database.getInstance().close()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/recipes/scrape', () => {
    const validUrl = 'https://example.com/recipe'
    const mockScrapedData = {
      name: 'Test Recipe',
      description: 'A delicious test recipe',
      recipeIngredients: ['2 cups flour', '1 tsp salt'],
      recipeInstructions: ['Mix ingredients', 'Bake for 30 minutes'],
      image: 'https://example.com/image.jpg',
      prepTime: 'PT15M',
      totalTime: 'PT45M',
      recipeYield: '4 servings'
    }

    it('should successfully scrape and return recipe data', async () => {
      mockScraper.mockResolvedValue(mockScrapedData)

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(200)

      expect(response.body).toHaveProperty('recipeData')
      expect(response.body.recipeData).toMatchObject({
        name: 'Test Recipe',
        description: 'A delicious test recipe',
        ingredients: ['2 cups flour', '1 tsp salt'],
        instructions: ['Mix ingredients', 'Bake for 30 minutes'],
        image: 'https://example.com/image.jpg',
        sourceUrl: validUrl,
        prepTimeMinutes: 15,
        servings: 4
      })

      expect(mockScraper).toHaveBeenCalledWith(validUrl)
    })

    it('should handle missing optional fields gracefully', async () => {
      const minimalData = {
        name: 'Minimal Recipe',
        recipeIngredients: ['1 ingredient'],
        recipeInstructions: ['1 instruction']
      }
      mockScraper.mockResolvedValue(minimalData)

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(200)

      expect(response.body.recipeData).toMatchObject({
        name: 'Minimal Recipe',
        description: 'Recipe imported from web',
        ingredients: ['1 ingredient'],
        instructions: ['1 instruction'],
        sourceUrl: validUrl
      })
    })

    it('should parse various duration formats', async () => {
      const testCases = [
        { prepTime: 'PT30M', expected: 30 },
        { prepTime: 'PT1H30M', expected: 90 },
        { prepTime: '45 minutes', expected: 45 },
        { prepTime: '2 hours', expected: 120 },
        { totalTime: 'PT2H', expected: 120 }
      ]

      for (const testCase of testCases) {
        mockScraper.mockResolvedValue({
          ...mockScrapedData,
          ...testCase,
          prepTime: testCase.prepTime || undefined,
          totalTime: testCase.totalTime || undefined
        })

        const response = await request(app)
          .post('/api/recipes/scrape')
          .send({ url: validUrl })
          .expect(200)

        expect(response.body.recipeData.prepTimeMinutes).toBe(testCase.expected)
      }
    })

    it('should parse various serving formats', async () => {
      const testCases = [
        { recipeYield: '4 servings', expected: 4 },
        { recipeYield: 'Makes 6', expected: 6 },
        { recipeYield: '8', expected: 8 },
        { recipeYield: 'Serves 12 people', expected: 12 }
      ]

      for (const testCase of testCases) {
        mockScraper.mockResolvedValue({
          ...mockScrapedData,
          recipeYield: testCase.recipeYield
        })

        const response = await request(app)
          .post('/api/recipes/scrape')
          .send({ url: validUrl })
          .expect(200)

        expect(response.body.recipeData.servings).toBe(testCase.expected)
      }
    })

    it('should return 400 for missing URL', async () => {
      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({})
        .expect(400)

      expect(response.body.error.message).toBe('URL is required')
    })

    it('should return 400 for empty URL', async () => {
      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: '' })
        .expect(400)

      expect(response.body.error.message).toBe('URL is required')
    })

    it('should return 400 for invalid URL format', async () => {
      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: 'not-a-url' })
        .expect(400)

      expect(response.body.error.message).toBe('Invalid URL format')
    })

    it('should handle scraper returning null/empty data', async () => {
      mockScraper.mockResolvedValue(null)

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(404)

      expect(response.body.error.message).toBe('No recipe data found at the provided URL')
    })

    it('should handle 404 errors from scraper', async () => {
      mockScraper.mockRejectedValue(new Error('404 not found'))

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(404)

      expect(response.body.error.message).toBe('Recipe not found at the provided URL')
    })

    it('should handle network timeout errors', async () => {
      mockScraper.mockRejectedValue(new Error('network timeout'))

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(500)

      expect(response.body.error.message).toBe('Unable to reach the website. Please check the URL and try again.')
    })

    it('should handle general scraper errors', async () => {
      mockScraper.mockRejectedValue(new Error('Scraper failed'))

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(500)

      expect(response.body.error.message).toBeDefined()
    })

    it('should use default values when scraper returns minimal data', async () => {
      mockScraper.mockResolvedValue({})

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(200)

      expect(response.body.recipeData).toMatchObject({
        name: 'Imported Recipe',
        description: 'Recipe imported from web',
        ingredients: [],
        instructions: [],
        sourceUrl: validUrl
      })
    })
  })
})