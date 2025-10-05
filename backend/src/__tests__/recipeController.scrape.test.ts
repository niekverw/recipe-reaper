// @ts-nocheck
import request from 'supertest'
import express from 'express'
import { recipeRoutes } from '../routes/recipes'
import { PostgreSQLDatabase } from '../models/database-pg'

// Mock services to avoid requiring API keys
jest.mock('../services/openaiService', () => ({
  openaiService: {}
}))

jest.mock('../services/geminiService', () => ({
  geminiService: {
    parseRecipeText: jest.fn()
  }
}))

jest.mock('../services/recipeEnhancementService', () => ({
  recipeEnhancementService: {}
}))

jest.mock('../services/imageService', () => ({
  imageService: {}
}))

// Mock the scrapeWithPython function
jest.mock('../controllers/recipeController', () => {
  const originalModule = jest.requireActual('../controllers/recipeController') as Record<string, unknown>
  return {
    ...originalModule,
    scrapeWithPython: jest.fn()
  }
})

const { scrapeWithPython } = require('../controllers/recipeController')
const { geminiService } = require('../services/geminiService')

const parseRecipeTextMock = geminiService.parseRecipeText as jest.Mock

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
    // Database is already initialized by setup.ts
  })

  afterAll(async () => {
    // Database will be closed by setup.ts
  })

  beforeEach(() => {
    jest.clearAllMocks()
    parseRecipeTextMock.mockReset()
    parseRecipeTextMock.mockResolvedValue({})
  })

  describe('POST /api/recipes/scrape', () => {
    const validUrl = 'https://cooking.nytimes.com/recipes/1022068-skillet-chicken-with-mushrooms-and-caramelized-onions'
    const mockScrapedData = {
      name: 'Test Recipe',
      description: 'A delicious test recipe',
      ingredients: ['2 cups flour', '1 tsp salt'],
      instructions: 'Mix ingredients\nBake for 30 minutes',
      image: 'https://example.com/image.jpg',
      prepTimeMinutes: 15,
      totalTimeMinutes: 45,
      yields: '4 servings'
    }

    it('should successfully scrape and return recipe data', async () => {
      ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockResolvedValue(mockScrapedData)
      parseRecipeTextMock.mockResolvedValue({
        name: 'AI Recipe',
        description: 'AI enhanced description',
        ingredients: ['AI flour', 'AI salt'],
        instructions: ['AI step 1', 'AI step 2'],
        prepTimeMinutes: 20,
        totalTimeMinutes: 50,
        servings: 5
      })

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(200)

      expect(response.body).toHaveProperty('recipeData')
      expect(response.body.recipeData).toMatchObject({
        name: 'AI Recipe',
        description: 'AI enhanced description',
        ingredients: ['AI flour', 'AI salt'],
        instructions: ['AI step 1', 'AI step 2'],
        sourceUrl: validUrl,
        prepTimeMinutes: 20,
        totalTimeMinutes: 50,
        servings: 5
      })

      expect(scrapeWithPython).toHaveBeenCalledWith(validUrl)
      expect(parseRecipeTextMock).toHaveBeenCalledTimes(1)
    })

    it('should handle missing optional fields gracefully', async () => {
      const minimalData = {
        name: 'Minimal Recipe',
        ingredients: ['1 ingredient'],
        instructions: '1 instruction'
      }
      ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockResolvedValue(minimalData)
      parseRecipeTextMock.mockResolvedValue({})

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
        { prepTimeMinutes: 30, expected: 30, field: 'prepTimeMinutes' },
        { prepTimeMinutes: 90, expected: 90, field: 'prepTimeMinutes' },
        { totalTimeMinutes: 120, expected: 120, field: 'totalTimeMinutes' }
      ]

      for (const testCase of testCases) {
        ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockResolvedValue({
          ...mockScrapedData,
          ...testCase
        })
        parseRecipeTextMock.mockResolvedValue({
          ingredients: ['AI flour'],
          instructions: ['AI step']
        })

        const response = await request(app)
          .post('/api/recipes/scrape')
          .send({ url: validUrl })
          .expect(200)

        expect(response.body.recipeData[testCase.field]).toBe(testCase.expected)
      }
    })

    it('should parse various serving formats', async () => {
      const testCases = [
        { yields: '4 servings', expected: 4 },
        { yields: 'Makes 6', expected: 6 },
        { yields: '8', expected: 8 }
      ]

      for (const testCase of testCases) {
        ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockResolvedValue({
          ...mockScrapedData,
          yields: testCase.yields
        })
        parseRecipeTextMock.mockResolvedValue({
          servings: testCase.expected,
          ingredients: ['AI flour'],
          instructions: ['AI step']
        })

        const response = await request(app)
          .post('/api/recipes/scrape')
          .send({ url: validUrl })
          .expect(200)

        expect(response.body.recipeData.servings).toBe(testCase.expected)
      }
    })

    it('should parse image URLs from various formats', async () => {
      const testCases = [
        { image: 'https://example.com/image.jpg', expected: 'https://example.com/image.jpg' },
        { image: null, expected: null },
        { image: undefined, expected: undefined }
      ]

      for (const testCase of testCases) {
        ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockResolvedValue({
          ...mockScrapedData,
          image: testCase.image
        })
        parseRecipeTextMock.mockResolvedValue({
          ingredients: ['AI flour'],
          instructions: ['AI step']
        })

        const response = await request(app)
          .post('/api/recipes/scrape')
          .send({ url: validUrl })
          .expect(200)

        expect(response.body.recipeData.image).toBe(testCase.expected)
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
      ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockResolvedValue(null)
      parseRecipeTextMock.mockResolvedValue({})

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(404)

      expect(response.body.error.message).toBe('No recipe data found at the provided URL')
    })

    it('should handle 404 errors from scraper', async () => {
      ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockRejectedValue(new Error('404 not found'))
      parseRecipeTextMock.mockResolvedValue({})

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(404)

      expect(response.body.error.message).toBe('Recipe not found at the provided URL')
    })

    it('should handle network timeout errors', async () => {
      ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockRejectedValue(new Error('network timeout'))
      parseRecipeTextMock.mockResolvedValue({})

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(500)

      expect(response.body.error.message).toBe('Unable to reach the website. Please check the URL and try again.')
    })

    it('should handle general scraper errors', async () => {
      ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockRejectedValue(new Error('Scraper failed'))
      parseRecipeTextMock.mockResolvedValue({})

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(500)

      expect(response.body.error.message).toBeDefined()
    })

    it('should use default values when scraper returns minimal data', async () => {
      ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockResolvedValue({})
      parseRecipeTextMock.mockResolvedValue({})

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

    it('should fall back to scraped data when Gemini parsing fails', async () => {
      ;(scrapeWithPython as jest.MockedFunction<typeof scrapeWithPython>).mockResolvedValue(mockScrapedData)
      parseRecipeTextMock.mockRejectedValue(new Error('API unavailable'))

      const response = await request(app)
        .post('/api/recipes/scrape')
        .send({ url: validUrl })
        .expect(200)

      expect(response.body.recipeData).toMatchObject({
        name: 'Test Recipe',
        ingredients: ['2 cups flour', '1 tsp salt'],
        instructions: ['Mix ingredients', 'Bake for 30 minutes']
      })
    })
  })
})