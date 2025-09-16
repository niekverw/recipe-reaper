import { Router } from 'express'
import { recipeController } from '../controllers/recipeController'

export const recipeRoutes = Router()

// GET /api/recipes - List recipes with optional filters
recipeRoutes.get('/', recipeController.getRecipes)

// GET /api/recipes/tags - Get all unique tags
recipeRoutes.get('/tags', recipeController.getAllTags)

// POST /api/recipes - Create a new recipe
recipeRoutes.post('/', recipeController.createRecipe)

// POST /api/recipes/scrape - Scrape recipe data from URL
recipeRoutes.post('/scrape', recipeController.scrapeRecipe)

// POST /api/recipes/parse-text - Parse recipe data from text using OpenAI
recipeRoutes.post('/parse-text', recipeController.parseTextRecipe)

// POST /api/recipes/parse-text-gemini - Parse recipe data from text using Gemini
recipeRoutes.post('/parse-text-gemini', recipeController.parseTextRecipeGemini)

// GET /api/recipes/:id - Get a specific recipe
recipeRoutes.get('/:id', recipeController.getRecipeById)

// POST /api/recipes/:id/enhance - Enhance a recipe with AI-generated chef's notes
recipeRoutes.post('/:id/enhance', recipeController.enhanceRecipe)

// PUT /api/recipes/:id - Update a specific recipe
recipeRoutes.put('/:id', recipeController.updateRecipe)

// DELETE /api/recipes/:id - Delete a specific recipe
recipeRoutes.delete('/:id', recipeController.deleteRecipe)