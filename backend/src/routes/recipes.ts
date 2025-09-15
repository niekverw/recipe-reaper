import { Router } from 'express'
import { recipeController } from '../controllers/recipeController'

export const recipeRoutes = Router()

// GET /api/recipes - List recipes with optional filters
recipeRoutes.get('/', recipeController.getRecipes)

// POST /api/recipes - Create a new recipe
recipeRoutes.post('/', recipeController.createRecipe)

// GET /api/recipes/:id - Get a specific recipe
recipeRoutes.get('/:id', recipeController.getRecipeById)

// PUT /api/recipes/:id - Update a specific recipe
recipeRoutes.put('/:id', recipeController.updateRecipe)

// DELETE /api/recipes/:id - Delete a specific recipe
recipeRoutes.delete('/:id', recipeController.deleteRecipe)