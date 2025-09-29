import { Router, Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { recipeController } from '../controllers/recipeController'
import { requireAuth, optionalAuth } from '../middleware/auth'

// Helper function to conditionally apply auth based on environment
// Ensures NODE_ENV set at runtime takes precedence over .env file
const isTestEnvironment = () => {
  return process.env.NODE_ENV === 'test'
}

const conditionalAuth = (middleware: any) =>
  isTestEnvironment() ? optionalAuth : middleware

// Configure multer for handling file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept image files and HEIC files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif']

    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'))

    if (file.mimetype.startsWith('image/') ||
        allowedMimes.includes(file.mimetype) ||
        allowedExtensions.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  }
})

export const recipeRoutes = Router()

// GET /api/recipes - List recipes with optional filters
// In production, require auth unless ALLOW_PUBLIC_API=true
const recipeListAuth = process.env.NODE_ENV === 'production' && process.env.ALLOW_PUBLIC_API !== 'true'
  ? requireAuth
  : optionalAuth
recipeRoutes.get('/', recipeListAuth, recipeController.getRecipes)

// GET /api/recipes/tags - Get all unique tags
// In production, require auth unless ALLOW_PUBLIC_API=true
const tagsAuth = process.env.NODE_ENV === 'production' && process.env.ALLOW_PUBLIC_API !== 'true'
  ? requireAuth
  : (req: Request, res: Response, next: NextFunction) => next() // no auth required
recipeRoutes.get('/tags', tagsAuth, recipeController.getAllTags)

// GET /api/recipes/check-name - Check if recipe name exists in public recipes
// In production, require auth unless ALLOW_PUBLIC_API=true
const checkNameAuth = process.env.NODE_ENV === 'production' && process.env.ALLOW_PUBLIC_API !== 'true'
  ? requireAuth
  : (req: Request, res: Response, next: NextFunction) => next() // no auth required
recipeRoutes.get('/check-name', checkNameAuth, recipeController.checkRecipeName)

// POST /api/recipes - Create a new recipe (requires authentication in production)
recipeRoutes.post('/', conditionalAuth(requireAuth), recipeController.createRecipe)

// POST /api/recipes/scrape - Scrape recipe data from URL (requires authentication in production)
recipeRoutes.post('/scrape', conditionalAuth(requireAuth), recipeController.scrapeRecipe)

// POST /api/recipes/parse-text - Parse recipe data from text using OpenAI (requires authentication in production)
recipeRoutes.post('/parse-text', conditionalAuth(requireAuth), recipeController.parseTextRecipe)

// POST /api/recipes/parse-text-gemini - Parse recipe data from text using Gemini (requires authentication in production)
recipeRoutes.post('/parse-text-gemini', conditionalAuth(requireAuth), recipeController.parseTextRecipeGemini)

// POST /api/recipes/parse-image - Parse recipe data from image using Vision API + Gemini (requires authentication in production)
recipeRoutes.post('/parse-image', conditionalAuth(requireAuth), upload.single('image'), recipeController.parseImageRecipe)

// POST /api/recipes/upload-image - Upload image and get URL (requires authentication in production)
recipeRoutes.post('/upload-image', conditionalAuth(requireAuth), upload.single('image'), recipeController.uploadImage)

// DELETE /api/recipes/delete-image/:filename - Delete uploaded image (requires authentication in production)
recipeRoutes.delete('/delete-image/:filename', conditionalAuth(requireAuth), recipeController.deleteImage)

// GET /api/recipes/:id - Get a specific recipe (public access for public recipes)
recipeRoutes.get('/:id', optionalAuth, recipeController.getRecipeById)

// POST /api/recipes/:id/copy - Copy a recipe (requires authentication in production)
recipeRoutes.post('/:id/copy', conditionalAuth(requireAuth), recipeController.copyRecipe)

// POST /api/recipes/:id/enhance - Enhance a recipe with AI (requires authentication in production)
recipeRoutes.post('/:id/enhance', conditionalAuth(requireAuth), recipeController.enhanceRecipe)

// PUT /api/recipes/:id - Update a recipe (requires authentication in production)
recipeRoutes.put('/:id', conditionalAuth(requireAuth), recipeController.updateRecipe)

// DELETE /api/recipes/:id - Delete a recipe (requires authentication in production)
recipeRoutes.delete('/:id', conditionalAuth(requireAuth), recipeController.deleteRecipe)