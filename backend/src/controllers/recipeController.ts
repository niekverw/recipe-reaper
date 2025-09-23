import { Request, Response, NextFunction } from 'express'
import { recipeModel } from '../models/recipeModel'
import { CreateRecipeRequest, UpdateRecipeRequest, RecipeFilters, IngredientCategory } from '../types/recipe'
import { createError } from '../middleware/errorHandler'
import { openaiService } from '../services/openaiService'
import { geminiService } from '../services/geminiService'
import { recipeEnhancementService } from '../services/recipeEnhancementService'
import { imageService } from '../services/imageService'
import { User } from '../types/user'
import { spawn } from 'child_process'
import { join } from 'path'

interface ScrapeRecipeRequest {
  url: string
}

interface ParseTextRecipeRequest {
  text: string
}

function parseServings(servings?: string): number | undefined {
  if (!servings) return undefined

  // Extract number from various formats
  const match = servings.match(/(\d+)/)
  return match ? parseInt(match[1]) : undefined
}

async function scrapeWithPython(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonExecutable = join(__dirname, '../../venv/bin/python')
    const scraperScript = join(__dirname, '../../scraper.py')

    const pythonProcess = spawn(pythonExecutable, [scraperScript, url], {
      cwd: join(__dirname, '../..')
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python scraper failed: ${stderr}`))
        return
      }

      try {
        const result = JSON.parse(stdout.trim())
        if (result.error) {
          reject(new Error(result.error))
          return
        }
        resolve(result)
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error}`))
      }
    })

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
  })
}

function parseImageUrl(image?: any): string | undefined {
  if (!image) return undefined

  // If it's already a string, return it
  if (typeof image === 'string') {
    return image
  }

  // If it's an object with a url property, return that
  if (typeof image === 'object' && image.url) {
    return image.url
  }

  // If it's an object with a contentUrl property, return that
  if (typeof image === 'object' && image.contentUrl) {
    return image.contentUrl
  }

  // If it's an object with an @id that looks like a URL, return that
  if (typeof image === 'object' && image['@id'] && image['@id'].startsWith('http')) {
    return image['@id']
  }

  return undefined
}

export const recipeController = {
  async getRecipes(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined

      const scope = req.query.scope as 'my' | 'public' | 'all' || 'all'

      const filters: RecipeFilters = {
        search: req.query.search as string,
        sortBy: req.query.sortBy as 'name' | 'time' | 'servings' | 'recent',
        isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        // Add user context for access control
        userId: user?.id,
        householdId: user?.householdId,
        scope: scope
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
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

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

      // Add user context
      recipeData.userId = user.id
      if (recipeData.householdId) {
        // If sharing to household, verify user is in that household
        if (user.householdId !== recipeData.householdId) {
          throw createError('You can only share recipes to your own household', 403)
        }
      }

      const recipe = await recipeModel.create(recipeData)
      res.status(201).json({ recipe })
    } catch (error) {
      next(error)
    }
  },

  async updateRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

      const { id } = req.params
      const updates: UpdateRecipeRequest = req.body

      const existingRecipe = await recipeModel.findById(id)
      if (!existingRecipe) {
        throw createError('Recipe not found', 404)
      }

      // Check authorization: user must own the recipe or it must be in their household
      const isOwner = existingRecipe.userId === user.id
      const isInHousehold = existingRecipe.householdId && existingRecipe.householdId === user.householdId

      if (!isOwner && !isInHousehold) {
        throw createError('You do not have permission to update this recipe', 403)
      }

      const updatedRecipe = await recipeModel.update(id, updates)
      res.json({ recipe: updatedRecipe })
    } catch (error) {
      next(error)
    }
  },

  async deleteRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

      const { id } = req.params

      const existingRecipe = await recipeModel.findById(id)
      if (!existingRecipe) {
        throw createError('Recipe not found', 404)
      }

      // Check authorization: user must own the recipe or it must be in their household
      const isOwner = existingRecipe.userId === user.id
      const isInHousehold = existingRecipe.householdId && existingRecipe.householdId === user.householdId

      if (!isOwner && !isInHousehold) {
        throw createError('You do not have permission to delete this recipe', 403)
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

      // Scrape recipe data using Python scraper
      const scrapedData = await scrapeWithPython(url)

      if (!scrapedData) {
        throw createError('No recipe data found at the provided URL', 404)
      }

      // Transform scraped data to our format
      // Instructions come as a string with \n separators, split into array
      const instructions = scrapedData.instructions
        ? scrapedData.instructions.split('\n').filter((step: string) => step.trim())
        : []

      const transformedData = {
        name: scrapedData.name || 'Imported Recipe',
        description: scrapedData.description || 'Recipe imported from web',
        ingredients: scrapedData.ingredients || [],
        instructions: instructions,
        image: scrapedData.image,
        sourceUrl: url,
        prepTimeMinutes: scrapedData.prepTimeMinutes,
        cookTimeMinutes: scrapedData.cookTimeMinutes,
        totalTimeMinutes: scrapedData.totalTimeMinutes,
        servings: parseServings(scrapedData.yields)
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
  },

  async parseTextRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const { text }: ParseTextRecipeRequest = req.body

      if (!text?.trim()) {
        throw createError('Recipe text is required', 400)
      }

      // Parse the text using OpenAI
      const parsedData = await openaiService.parseRecipeText(text)

      // Transform to match scraper response format
      const transformedData = {
        name: parsedData.name,
        description: parsedData.description,
        ingredients: parsedData.ingredients,
        instructions: parsedData.instructions,
        prepTimeMinutes: parsedData.prepTimeMinutes,
        cookTimeMinutes: parsedData.cookTimeMinutes,
        totalTimeMinutes: parsedData.totalTimeMinutes,
        servings: parsedData.servings,
        image: parsedData.image,
        sourceUrl: undefined // No source URL for text input
      }

      res.json({ recipeData: transformedData })
    } catch (error) {
      // Handle OpenAI specific errors
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw createError('OpenAI API configuration error', 500)
        }
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          throw createError('OpenAI service temporarily unavailable. Please try again later.', 429)
        }
        if (error.message.includes('Missing required recipe fields')) {
          throw createError('Unable to extract recipe data from the provided text. Please ensure the text contains recipe information.', 400)
        }
      }
      next(error)
    }
  },

  async parseTextRecipeGemini(req: Request, res: Response, next: NextFunction) {
    try {
      const { text }: ParseTextRecipeRequest = req.body

      if (!text?.trim()) {
        throw createError('Recipe text is required', 400)
      }

      // Parse the text using Gemini
      const parsedData = await geminiService.parseRecipeText(text)

      // Transform to match scraper response format
      const transformedData = {
        name: parsedData.name,
        description: parsedData.description,
        ingredients: parsedData.ingredients,
        instructions: parsedData.instructions,
        prepTimeMinutes: parsedData.prepTimeMinutes,
        cookTimeMinutes: parsedData.cookTimeMinutes,
        totalTimeMinutes: parsedData.totalTimeMinutes,
        servings: parsedData.servings,
        image: parsedData.image,
        sourceUrl: undefined // No source URL for text input
      }

      res.json({ recipeData: transformedData })
    } catch (error) {
      // Handle Gemini specific errors
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw createError('Gemini API configuration error', 500)
        }
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          throw createError('Gemini service temporarily unavailable. Please try again later.', 429)
        }
        if (error.message.includes('Missing required recipe fields')) {
          throw createError('Unable to extract recipe data from the provided text. Please ensure the text contains recipe information.', 400)
        }
      }
      next(error)
    }
  },

  async enhanceRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params

      // Get the existing recipe
      const recipe = await recipeModel.findById(id)
      if (!recipe) {
        throw createError('Recipe not found', 404)
      }

      // Check if recipe already has AI enhanced notes
      if (recipe.aiEnhancedNotes) {
        return res.json({
          message: 'Recipe already has AI enhanced notes',
          recipe: recipe
        })
      }

      // Prepare recipe data for enhancement
      const recipeData = {
        name: recipe.name,
        description: recipe.description,
        ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
          ? typeof recipe.ingredients[0] === 'string'
            ? recipe.ingredients as string[]
            : (recipe.ingredients as IngredientCategory[]).flatMap((cat) => cat.items || [])
          : [],
        instructions: recipe.instructions,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings
      }

      // Generate AI enhancement
      const enhancementData = await recipeEnhancementService.enhanceRecipe(recipeData)

      // Store the enhancement as JSON string
      const enhancementJson = JSON.stringify(enhancementData)
      const updatedRecipe = await recipeModel.updateAiEnhancedNotes(id, enhancementJson)

      res.json({
        message: 'Recipe enhanced successfully',
        recipe: updatedRecipe
      })
    } catch (error) {
      // Handle enhancement specific errors
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw createError('AI enhancement service configuration error', 500)
        }
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          throw createError('AI enhancement service temporarily unavailable. Please try again later.', 429)
        }
      }
      next(error)
    }
  },

  async getAllTags(req: Request, res: Response, next: NextFunction) {
    try {
      const tags = await recipeModel.getAllTags()
      res.json({ tags })
    } catch (error) {
      next(error)
    }
  },

  async parseImageRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw createError('Image file is required', 400)
      }

      const storedImage = await imageService.storeImage(req.file.buffer, req.file.originalname)

      // Parse the image directly using Gemini Vision to create a recipe
      const parsedData = await geminiService.parseRecipeFromImage(req.file.buffer)

      // Transform to match expected response format
      const transformedData = {
        name: parsedData.name,
        description: parsedData.description,
        ingredients: parsedData.ingredients,
        instructions: parsedData.instructions,
        prepTimeMinutes: parsedData.prepTimeMinutes,
        cookTimeMinutes: parsedData.cookTimeMinutes,
        totalTimeMinutes: parsedData.totalTimeMinutes,
        servings: parseServings(parsedData.servings?.toString()),
        image: storedImage.url,
        imageSizes: storedImage.sizes
      }

      res.json({
        recipeData: transformedData
      })
    } catch (error) {
      // Handle Gemini vision specific errors
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw createError('Gemini API configuration error', 500)
        }
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          throw createError('Gemini service temporarily unavailable. Please try again later.', 429)
        }
        if (error.message.includes('Missing required recipe fields')) {
          throw createError('Unable to extract recipe data from the image. Please ensure the image contains clear recipe information.', 400)
        }
        if (error.message.includes('Image buffer is required')) {
          throw createError('Invalid image file. Please upload a valid image.', 400)
        }
      }
      next(error)
    }
  },

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw createError('Image file is required', 400)
      }

      const storedImage = await imageService.storeImage(req.file.buffer, req.file.originalname)

      res.json({
        imageUrl: storedImage.url,
        imageSizes: storedImage.sizes
      })
    } catch (error) {
      // Handle image upload specific errors
      if (error instanceof Error) {
        if (error.message.includes('Image file is required')) {
          throw createError('Invalid image file. Please upload a valid image.', 400)
        }
      }
      next(error)
    }
  },

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename } = req.params

      if (!filename) {
        throw createError('Filename is required', 400)
      }

      // Delete the image file
      await imageService.deleteImage(filename)

      res.status(204).send()
    } catch (error) {
      // Handle image deletion specific errors
      if (error instanceof Error) {
        if (error.message.includes('Filename is required')) {
          throw createError('Invalid filename provided', 400)
        }
      }
      next(error)
    }
  },

  // Check if recipe name exists in public recipes
  async checkRecipeName(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.query
      const { excludeId } = req.query

      if (!name || typeof name !== 'string') {
        throw createError('Recipe name is required', 400)
      }

      const exists = await recipeModel.checkPublicNameExists(
        name.trim(),
        excludeId as string || undefined
      )

      res.json({
        exists,
        message: exists ? 'A public recipe with this name already exists' : 'Name is available'
      })
    } catch (error) {
      next(error)
    }
  },

  // Copy a recipe to user's collection
  async copyRecipe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as User | undefined
      if (!user) {
        throw createError('Authentication required', 401)
      }

      const { id } = req.params
      const { householdId } = req.body

      // Verify the source recipe exists and is accessible
      const sourceRecipe = await recipeModel.findById(id)
      if (!sourceRecipe) {
        throw createError('Recipe not found', 404)
      }

      // Check if user can access this recipe
      if (!sourceRecipe.isPublic && sourceRecipe.userId !== user.id && sourceRecipe.householdId !== user.householdId) {
        throw createError('You cannot copy this recipe', 403)
      }

      // If copying to household, verify user is in that household
      if (householdId && user.householdId !== householdId) {
        throw createError('You can only copy recipes to your own household', 403)
      }

      const copiedRecipe = await recipeModel.copyRecipe(
        id,
        user.id,
        householdId || undefined
      )

      res.status(201).json({
        recipe: copiedRecipe,
        message: 'Recipe copied successfully'
      })
    } catch (error) {
      next(error)
    }
  }
}