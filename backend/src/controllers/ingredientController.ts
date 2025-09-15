import { Request, Response, NextFunction } from 'express'
import { ingredientParser } from '../utils/ingredientParser'
import { createError } from '../middleware/errorHandler'

export const ingredientController = {
  async parseIngredients(req: Request, res: Response, next: NextFunction) {
    try {
      const { ingredients, options } = req.body

      if (!Array.isArray(ingredients)) {
        throw createError('ingredients must be an array of strings', 400)
      }

      const parsed = ingredientParser.parseIngredients(ingredients, options)
      const validation = ingredientParser.validateIngredients(ingredients)

      res.json({
        parsed,
        validation,
        estimatedServings: ingredientParser.estimateServingsFromIngredients(ingredients),
        estimatedPrepTime: ingredientParser.estimatePrepTimeFromIngredients(ingredients)
      })
    } catch (error) {
      next(error)
    }
  },

  async scaleIngredients(req: Request, res: Response, next: NextFunction) {
    try {
      const { ingredients, scaleFactor } = req.body

      if (!Array.isArray(ingredients)) {
        throw createError('ingredients must be an array of strings', 400)
      }

      if (typeof scaleFactor !== 'number' || scaleFactor <= 0) {
        throw createError('scaleFactor must be a positive number', 400)
      }

      const scaled = ingredientParser.scaleIngredients(ingredients, scaleFactor)

      res.json({
        originalIngredients: ingredients,
        scaledIngredients: scaled,
        scaleFactor
      })
    } catch (error) {
      next(error)
    }
  },

  async parseFromText(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, options } = req.body

      if (typeof text !== 'string') {
        throw createError('text must be a string', 400)
      }

      const parsed = ingredientParser.parseIngredientsFromText(text, options)
      const ingredients = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      const validation = ingredientParser.validateIngredients(ingredients)

      res.json({
        parsed,
        validation,
        ingredients,
        estimatedServings: ingredientParser.estimateServingsFromIngredients(ingredients),
        estimatedPrepTime: ingredientParser.estimatePrepTimeFromIngredients(ingredients)
      })
    } catch (error) {
      next(error)
    }
  }
}