import { Router } from 'express'
import multer from 'multer'
import { recipeController } from '../controllers/recipeController'

// Configure multer for handling file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  }
})

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

// POST /api/recipes/parse-image - Parse recipe data from image using Vision API + Gemini
recipeRoutes.post('/parse-image', upload.single('image'), recipeController.parseImageRecipe)

// POST /api/recipes/upload-image - Upload image and get URL (no parsing)
recipeRoutes.post('/upload-image', upload.single('image'), recipeController.uploadImage)

// DELETE /api/recipes/delete-image/:filename - Delete uploaded image
recipeRoutes.delete('/delete-image/:filename', recipeController.deleteImage)

// GET /api/recipes/:id - Get a specific recipe
recipeRoutes.get('/:id', recipeController.getRecipeById)

// POST /api/recipes/:id/enhance - Enhance a recipe with AI-generated chef's notes
recipeRoutes.post('/:id/enhance', recipeController.enhanceRecipe)

// PUT /api/recipes/:id - Update a specific recipe
recipeRoutes.put('/:id', recipeController.updateRecipe)

// DELETE /api/recipes/:id - Delete a specific recipe
recipeRoutes.delete('/:id', recipeController.deleteRecipe)