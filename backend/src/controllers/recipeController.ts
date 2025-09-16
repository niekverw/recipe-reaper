import { Request, Response, NextFunction } from 'express'
import { recipeModel } from '../models/recipeModel'
import { CreateRecipeRequest, UpdateRecipeRequest, RecipeFilters } from '../types/recipe'
import { createError } from '../middleware/errorHandler'
import scraper from '@jitl/recipe-data-scraper'

interface ScrapeRecipeRequest {
  url: string
}

function parseDurationToMinutes(duration?: string): number | undefined {
  if (!duration) return undefined

  // Handle ISO 8601 duration format (PT15M, PT1H30M, etc.)
  const iso8601Match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (iso8601Match) {
    const hours = parseInt(iso8601Match[1] || '0')
    const minutes = parseInt(iso8601Match[2] || '0')
    return hours * 60 + minutes
  }

  // Handle simple minute format
  const minuteMatch = duration.match(/(\d+)\s*(?:min|minute|minutes)/)
  if (minuteMatch) {
    return parseInt(minuteMatch[1])
  }

  // Handle hour format
  const hourMatch = duration.match(/(\d+)\s*(?:hr|hour|hours)/)
  if (hourMatch) {
    return parseInt(hourMatch[1]) * 60
  }

  return undefined
}

function parseServings(servings?: string): number | undefined {
  if (!servings) return undefined

  // Extract number from various formats
  const match = servings.match(/(\d+)/)
  return match ? parseInt(match[1]) : undefined
}

export const recipeController = {
  async getRecipes(req: Request, res: Response, next: NextFunction) {
    try {
      const filters: RecipeFilters = {
        search: req.query.search as string,
        sortBy: req.query.sortBy as 'name' | 'time' | 'servings' | 'recent',
        isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const recipes = await recipeModel.findAll(filters)
      res.json({ recipes })
    } catch (error) {
      next(error)
    }
  },

  async getRecipeById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const recipe = await recipeModel.findById(id)

      if (!recipe) {
        throw createError('Recipe not found', 404)
      }

      res.json({ recipe })
    } catch (error) {
      next(error)
    }
  },

  async createRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const recipeData: CreateRecipeRequest = req.body

      // Validation
      if (!recipeData.name?.trim()) {
        throw createError('Recipe name is required', 400)
      }
      if (!recipeData.description?.trim()) {
        throw createError('Recipe description is required', 400)
      }
      if (!recipeData.ingredients?.length) {
        throw createError('At least one ingredient is required', 400)
      }
      if (!recipeData.instructions?.length) {
        throw createError('At least one instruction is required', 400)
      }

      const recipe = await recipeModel.create(recipeData)
      res.status(201).json({ recipe })
    } catch (error) {
      next(error)
    }
  },

  async updateRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const updates: UpdateRecipeRequest = req.body

      const existingRecipe = await recipeModel.findById(id)
      if (!existingRecipe) {
        throw createError('Recipe not found', 404)
      }

      const updatedRecipe = await recipeModel.update(id, updates)
      res.json({ recipe: updatedRecipe })
    } catch (error) {
      next(error)
    }
  },

  async deleteRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      const existingRecipe = await recipeModel.findById(id)
      if (!existingRecipe) {
        throw createError('Recipe not found', 404)
      }

      await recipeModel.delete(id)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  },

  async scrapeRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const { url }: ScrapeRecipeRequest = req.body

      if (!url?.trim()) {
        throw createError('URL is required', 400)
      }

      // Validate URL format
      try {
        new URL(url)
      } catch {
        throw createError('Invalid URL format', 400)
      }

      // Test mode for demonstration - return mock data for test URLs
      if (url.includes('test-recipe-demo')) {
        const mockData = {
          name: 'Demo Seafood Boil Crackers',
          description: 'Delicious crackers perfect for seafood boils with a spicy kick.',
          ingredients: ['1 sleeve saltine crackers', '1/2 cup butter', '1 packet ranch dressing mix', '1 tsp garlic powder', '1 tsp cayenne pepper', '1 tsp paprika'],
          instructions: ['Preheat oven to 250°F', 'Break crackers into bite-sized pieces', 'Melt butter and mix with seasonings', 'Toss crackers with seasoned butter', 'Spread on baking sheet', 'Bake for 15-20 minutes, stirring every 5 minutes'],
          image: 'https://example.com/seafood-crackers.jpg',
          sourceUrl: url,
          prepTimeMinutes: 10,
          servings: 6
        }
        return res.json({ recipeData: mockData })
      }

      // Scrape recipe data
      const scrapedData = await scraper(url)

      if (!scrapedData) {
        throw createError('No recipe data found at the provided URL', 404)
      }

      // Transform scraped data to our format
      const transformedData = {
        name: scrapedData.name || 'Imported Recipe',
        description: scrapedData.description || 'Recipe imported from web',
        ingredients: scrapedData.recipeIngredients || [],
        instructions: scrapedData.recipeInstructions || [],
        image: scrapedData.image,
        sourceUrl: url,
        prepTimeMinutes: parseDurationToMinutes(scrapedData.prepTime),
        cookTimeMinutes: parseDurationToMinutes(scrapedData.cookTime),
        totalTimeMinutes: parseDurationToMinutes(scrapedData.totalTime),
        servings: parseServings(scrapedData.recipeYield)
      }

      res.json({ recipeData: transformedData })
    } catch (error) {
      // Handle specific scraper errors
      if (error instanceof Error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          throw createError('Recipe not found at the provided URL', 404)
        }
        if (error.message.includes('timeout') || error.message.includes('network')) {
          throw createError('Unable to reach the website. Please check the URL and try again.', 500)
        }
      }
      next(error)
    }
  }
}