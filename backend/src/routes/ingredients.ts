import { Router } from 'express'
import { ingredientController } from '../controllers/ingredientController'

export const ingredientRoutes = Router()

// POST /api/ingredients/parse - Parse ingredient strings
ingredientRoutes.post('/parse', ingredientController.parseIngredients)

// POST /api/ingredients/scale - Scale ingredient quantities
ingredientRoutes.post('/scale', ingredientController.scaleIngredients)

// POST /api/ingredients/parse-text - Parse ingredients from multiline text
ingredientRoutes.post('/parse-text', ingredientController.parseFromText)