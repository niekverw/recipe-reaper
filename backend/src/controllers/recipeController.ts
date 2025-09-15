import { Request, Response, NextFunction } from 'express'
import { recipeModel } from '../models/recipeModel'
import { CreateRecipeRequest, UpdateRecipeRequest, RecipeFilters } from '../types/recipe'
import { createError } from '../middleware/errorHandler'

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
  }
}