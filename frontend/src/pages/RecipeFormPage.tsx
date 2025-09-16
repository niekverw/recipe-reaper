import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { apiService, Recipe, CreateRecipeData } from '../services/api'
import { IngredientHelper } from '../utils/ingredientHelper'
import {
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface RecipeFormData {
  name: string
  description: string
  ingredients: string
  instructions: string
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings?: number
  image?: string
  sourceUrl?: string
}

interface ImportUrlData {
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings?: number
  image?: string
  sourceUrl: string
}

function RecipeFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isEdit = Boolean(id)
  const copiedRecipe = location.state?.copiedRecipe

  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    description: '',
    ingredients: '',
    instructions: '',
    prepTimeMinutes: undefined,
    cookTimeMinutes: undefined,
    totalTimeMinutes: undefined,
    servings: undefined,
    image: '',
    sourceUrl: undefined
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(isEdit)

  // URL import state
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    if (isEdit && id) {
      loadRecipe(id)
    } else if (copiedRecipe) {
      // Pre-populate form with copied recipe data
      setFormData({
        name: copiedRecipe.name,
        description: copiedRecipe.description,
        ingredients: IngredientHelper.toTextareaFormat(copiedRecipe.ingredients),
        instructions: copiedRecipe.instructions.join('\n'),
        prepTimeMinutes: copiedRecipe.prepTimeMinutes,
        cookTimeMinutes: copiedRecipe.cookTimeMinutes,
        totalTimeMinutes: copiedRecipe.totalTimeMinutes,
        servings: copiedRecipe.servings,
        image: copiedRecipe.image || '',
        sourceUrl: copiedRecipe.sourceUrl
      })
    }
  }, [isEdit, id, copiedRecipe])

  const loadRecipe = async (recipeId: string) => {
    try {
      setIsLoadingRecipe(true)
      const recipe = await apiService.getRecipe(recipeId)

      setFormData({
        name: recipe.name,
        description: recipe.description,
        ingredients: IngredientHelper.toTextareaFormat(recipe.ingredients),
        instructions: recipe.instructions.join('\n'),
        prepTimeMinutes: recipe.prepTimeMinutes,
        servings: recipe.servings,
        image: recipe.image || '',
        sourceUrl: recipe.sourceUrl
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe')
      console.error('Failed to load recipe:', err)
    } finally {
      setIsLoadingRecipe(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'prepTimeMinutes' || name === 'servings'
        ? (value === '' ? undefined : Number(value))
        : value
    }))
  }

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      setImportError('Please enter a URL')
      return
    }

    try {
      setIsImporting(true)
      setImportError(null)

      const response = await apiService.scrapeRecipeFromUrl(importUrl.trim())
      const recipeData = response.recipeData

      // Check if form has existing data and confirm overwrite
      const hasExistingData = formData.name.trim() || formData.description.trim() ||
        formData.ingredients.trim() || formData.instructions.trim()

      if (hasExistingData) {
        const shouldOverwrite = window.confirm(
          'This will overwrite your current form data. Do you want to continue?'
        )
        if (!shouldOverwrite) return
      }

      // Update form with imported data
      setFormData({
        name: recipeData.name,
        description: recipeData.description,
        ingredients: recipeData.ingredients.join('\n'),
        instructions: recipeData.instructions.join('\n'),
        prepTimeMinutes: recipeData.prepTimeMinutes,
        cookTimeMinutes: recipeData.cookTimeMinutes,
        totalTimeMinutes: recipeData.totalTimeMinutes,
        servings: recipeData.servings,
        image: recipeData.image || '',
        sourceUrl: recipeData.sourceUrl
      })

      // Clear import URL
      setImportUrl('')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import recipe from URL')
      console.error('Failed to import recipe:', err)
    } finally {
      setIsImporting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Recipe name is required')
      return
    }

    if (!formData.description.trim()) {
      setError('Description is required')
      return
    }

    if (!formData.ingredients.trim()) {
      setError('Ingredients are required')
      return
    }

    if (!formData.instructions.trim()) {
      setError('Instructions are required')
      return
    }

    try {
      setLoading(true)

      const recipeData: CreateRecipeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        ingredients: IngredientHelper.parseFromTextarea(formData.ingredients),
        instructions: formData.instructions
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0),
        prepTimeMinutes: formData.prepTimeMinutes,
        cookTimeMinutes: formData.cookTimeMinutes,
        totalTimeMinutes: formData.totalTimeMinutes,
        servings: formData.servings,
        image: formData.image?.trim() || undefined,
        sourceUrl: formData.sourceUrl?.trim() || undefined
      }

      let savedRecipe: Recipe
      if (isEdit && id) {
        savedRecipe = await apiService.updateRecipe(id, recipeData)
      } else {
        savedRecipe = await apiService.createRecipe(recipeData)
      }

      // Navigate to the recipe detail page
      navigate(`/recipe/${savedRecipe.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} recipe`)
      console.error(`Failed to ${isEdit ? 'update' : 'create'} recipe:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate(isEdit && id ? `/recipe/${id}` : '/')
  }

  if (isLoadingRecipe) {
    return (
      <div className="px-4 py-8 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading recipe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isEdit ? 'Edit Recipe' : 'Add New Recipe'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update your recipe details' : 'Create and share your culinary masterpiece'}
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* URL Import Section */}
      {!isEdit && !copiedRecipe && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
            Import from URL
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
            Paste a recipe URL to automatically fill in the form with recipe data from supported websites.
          </p>

          <div className="flex gap-3">
            <input
              type="text"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-900/30 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isImporting}
              pattern="https?://.*"
              title="Please enter a valid URL starting with http:// or https://"
            />
            <button
              type="button"
              onClick={handleImportFromUrl}
              disabled={isImporting || !importUrl.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Import Recipe
                </>
              )}
            </button>
          </div>

          {importError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{importError}</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Recipe Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter recipe name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of your recipe"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* Ingredients and Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Ingredients *
            </h3>
            <div className="relative">
              <textarea
                id="ingredients"
                name="ingredients"
                required
                rows={10}
                value={formData.ingredients}
                onChange={handleInputChange}
                placeholder={`*Dry Ingredients
2 cups all-purpose flour
1 tsp baking powder
1/2 tsp salt

*Wet Ingredients
1/2 cup butter, softened
1 cup sugar
2 large eggs`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none font-mono text-sm"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                One item per line • Use *Category Name for sections
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Instructions *
            </h3>
            <div className="relative">
              <textarea
                id="instructions"
                name="instructions"
                required
                rows={10}
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder={`Preheat oven to 350°F
Mix dry ingredients in a bowl
Cream butter and sugar
Add eggs one at a time
Combine wet and dry ingredients
Bake for 25-30 minutes`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-sm"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                Each step on a new line
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Additional Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="prepTimeMinutes" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                id="prepTimeMinutes"
                name="prepTimeMinutes"
                min="1"
                value={formData.prepTimeMinutes || ''}
                onChange={handleInputChange}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active prep time</p>
            </div>
            <div>
              <label htmlFor="cookTimeMinutes" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Cook Time (minutes)
              </label>
              <input
                type="number"
                id="cookTimeMinutes"
                name="cookTimeMinutes"
                min="1"
                value={formData.cookTimeMinutes || ''}
                onChange={handleInputChange}
                placeholder="25"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cooking/baking time</p>
            </div>
            <div>
              <label htmlFor="totalTimeMinutes" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Total Time (minutes)
              </label>
              <input
                type="number"
                id="totalTimeMinutes"
                name="totalTimeMinutes"
                min="1"
                value={formData.totalTimeMinutes || ''}
                onChange={handleInputChange}
                placeholder="55"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total recipe time</p>
            </div>

            <div>
              <label htmlFor="servings" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Servings
              </label>
              <input
                type="number"
                id="servings"
                name="servings"
                min="1"
                value={formData.servings || ''}
                onChange={handleInputChange}
                placeholder="4"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty to auto-infer</p>
            </div>
          </div>

          <div>
            <label htmlFor="image" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Image URL
            </label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              placeholder="https://example.com/my-recipe-image.jpg"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add a URL to an image of your completed recipe</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                {isEdit ? 'Update Recipe' : 'Save Recipe'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default RecipeFormPage