import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { apiService, Recipe, CreateRecipeData } from '../services/api'
import { IngredientHelper } from '../utils/ingredientHelper'
import { isOurUploadedImage, cleanupImage } from '../utils/imageUtils'
import TagInput from '../components/TagInput'
import {
  ArrowLeftIcon,
  CheckIcon
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
  tags: string[]
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
    sourceUrl: undefined,
    tags: []
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(isEdit)
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // Import state
  const [importType, setImportType] = useState<'url' | 'text' | 'image'>('url')
  const [importUrl, setImportUrl] = useState('')
  const [importText, setImportText] = useState('')
  const [importImage, setImportImage] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isImportingGemini, setIsImportingGemini] = useState(false)
  const [isImportingImage, setIsImportingImage] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // Image upload state (for upload button next to Image URL)
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [previousImageUrl, setPreviousImageUrl] = useState<string>('')

  useEffect(() => {
    // Load available tags
    loadAvailableTags()

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
        sourceUrl: copiedRecipe.sourceUrl,
        tags: copiedRecipe.tags || []
      })
      setPreviousImageUrl(copiedRecipe.image || '')
    }
  }, [isEdit, id, copiedRecipe])

  // Track image URL changes for cleanup
  useEffect(() => {
    if (formData.image !== previousImageUrl) {
      // Clean up previous image if it was one of our uploads
      if (previousImageUrl && isOurUploadedImage(previousImageUrl)) {
        cleanupImage(previousImageUrl)
      }
      setPreviousImageUrl(formData.image || '')
    }
  }, [formData.image, previousImageUrl])

  const loadAvailableTags = async () => {
    try {
      const tags = await apiService.getAllTags()
      setAvailableTags(tags)
    } catch (err) {
      console.error('Failed to load available tags:', err)
    }
  }

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
        sourceUrl: recipe.sourceUrl,
        tags: recipe.tags || []
      })
      setPreviousImageUrl(recipe.image || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe')
      console.error('Failed to load recipe:', err)
    } finally {
      setIsLoadingRecipe(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    let processedValue: string | number | undefined = value
    
    // Special handling for image field
    if (name === 'image') {
      // If the user enters a full URL that matches our current domain, convert to relative
      const currentUrl = window.location
      const frontendBaseUrl = `${currentUrl.protocol}//${currentUrl.hostname}:${currentUrl.port || (currentUrl.protocol === 'https:' ? '443' : '80')}`
      
      if (value.startsWith(`${frontendBaseUrl}/uploads/`)) {
        // Convert full URL back to relative path
        processedValue = value.replace(frontendBaseUrl, '')
      }
      // External URLs are kept as-is
    } else {
      processedValue = name === 'prepTimeMinutes' || name === 'servings'
        ? (value === '' ? undefined : Number(value))
        : value
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
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
        sourceUrl: recipeData.sourceUrl,
        tags: []
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

  const handleImportFromText = async () => {
    if (!importText.trim()) {
      setImportError('Please enter recipe text')
      return
    }

    try {
      setIsImporting(true)
      setImportError(null)

      const response = await apiService.parseRecipeFromText(importText.trim())
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
        sourceUrl: recipeData.sourceUrl,
        tags: []
      })

      // Clear import text
      setImportText('')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse recipe from text')
      console.error('Failed to parse recipe:', err)
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportFromTextGemini = async () => {
    if (!importText.trim()) {
      setImportError('Please enter recipe text')
      return
    }

    try {
      setIsImportingGemini(true)
      setImportError(null)

      const response = await apiService.parseRecipeFromTextGemini(importText.trim())
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
        sourceUrl: recipeData.sourceUrl,
        tags: []
      })

      // Clear import text
      setImportText('')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse recipe from text')
      console.error('Failed to parse recipe:', err)
    } finally {
      setIsImportingGemini(false)
    }
  }

  const handleImport = () => {
    if (importType === 'url') {
      handleImportFromUrl()
    } else if (importType === 'text') {
      handleImportFromText()
    } else if (importType === 'image') {
      handleImportFromImage()
    }
  }

  const handleImportFromImage = async () => {
    if (!importImage) {
      setImportError('Please select an image file')
      return
    }

    try {
      setIsImportingImage(true)
      setImportError(null)

      const response = await apiService.parseRecipeFromImage(importImage)
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
        sourceUrl: recipeData.sourceUrl,
        tags: []
      })

      // Clear import image
      setImportImage(null)
      // Reset the file input if it exists
      const fileInput = document.getElementById('import-image-file') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse recipe from image')
      console.error('Failed to parse recipe from image:', err)
    } finally {
      setIsImportingImage(false)
    }
  }

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadImageFile(file)

      // Upload immediately after file selection
      try {
        setIsUploadingImage(true)
        const response = await apiService.uploadImage(file)

        // Set the image URL in the form data
        setFormData(prev => ({
          ...prev,
          image: response.imageUrl
        }))

        // Clear the selected file
        setUploadImageFile(null)
        // Reset the file input
        e.target.value = ''
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image')
        console.error('Failed to upload image:', err)
        // Keep the file selected if upload failed
      } finally {
        setIsUploadingImage(false)
      }
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
        image: formData.image?.trim() || '',
        sourceUrl: formData.sourceUrl?.trim() || '',
        tags: formData.tags
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

      {/* Import Section */}
      {!isEdit && !copiedRecipe && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h2 className="text-lg font-semibold mb-4 text-blue-900 dark:text-blue-100">
            Import Recipe
          </h2>

          {/* Import Type Tabs */}
          <div className="flex mb-4 bg-blue-100 dark:bg-blue-800/30 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setImportType('url')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                importType === 'url'
                  ? 'bg-white dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow-sm'
                  : 'text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100'
              }`}
            >
              Import from URL
            </button>
            <button
              type="button"
              onClick={() => setImportType('text')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                importType === 'text'
                  ? 'bg-white dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow-sm'
                  : 'text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100'
              }`}
            >
              Import Text
            </button>
            <button
              type="button"
              onClick={() => setImportType('image')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                importType === 'image'
                  ? 'bg-white dark:bg-blue-900 text-blue-900 dark:text-blue-100 shadow-sm'
                  : 'text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100'
              }`}
            >
              Import from Image
            </button>
          </div>

          {/* Import Content */}
          {importType === 'url' ? (
            <>
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
                  onClick={handleImport}
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
            </>
          ) : importType === 'text' ? (
            <>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Paste recipe text from cookbooks, websites, or handwritten notes to automatically parse and fill in the form. Or describe your ingredients and cooking ideas to let AI generate a complete recipe with instructions and variations.
              </p>
              <div className="space-y-3">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`Paste your recipe text here, for example:

Chocolate Chip Cookies

This recipe makes the perfect chewy chocolate chip cookies.

Ingredients:
- 2 cups all-purpose flour
- 1 tsp baking soda
- 1 tsp salt
- 1 cup butter, softened
- 3/4 cup brown sugar
- 1/2 cup white sugar
- 2 large eggs
- 2 tsp vanilla extract
- 2 cups chocolate chips

Instructions:
1. Preheat oven to 375°F
2. Mix flour, baking soda, and salt in a bowl
3. Cream butter and sugars together
4. Add eggs and vanilla to butter mixture
5. Gradually mix in flour mixture
6. Stir in chocolate chips
7. Bake for 9-11 minutes

Prep time: 15 minutes
Cook time: 10 minutes
Serves: 24 cookies`}
                  rows={8}
                  className="w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-blue-900/30 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none text-sm"
                  disabled={isImporting || isImportingGemini}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleImportFromTextGemini}
                    disabled={isImporting || isImportingGemini || !importText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    {isImportingGemini ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Parsing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Parse with Gemini
                      </>
                    )}
                  </button>
                  {/* Temporarily hidden - out of credits
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={isImporting || isImportingGemini || !importText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Parsing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Parse with GPT-5-mini (not working)
                      </>
                    )}
                  </button>
                  */}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Upload a photo of a recipe from a book, handwritten notes, or screenshot. The AI will extract the text and convert it to a structured recipe.
              </p>
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center w-full">
                  <label
                    htmlFor="import-image-file"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        PNG, JPG, JPEG (Max 10MB)
                      </p>
                    </div>
                    <input
                      id="import-image-file"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setImportImage(file)
                        }
                      }}
                      disabled={isImportingImage}
                    />
                  </label>
                </div>

                {importImage && (
                  <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">{importImage.name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{(importImage.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportImage(null)
                        const fileInput = document.getElementById('import-image-file') as HTMLInputElement
                        if (fileInput) fileInput.value = ''
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleImportFromImage}
                  disabled={isImportingImage || !importImage}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  {isImportingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing Image...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Extract Recipe from Image
                    </>
                  )}
                </button>
              </div>
            </>
          )}

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
            <div className="flex gap-2">
              <input
                type="url"
                id="image"
                name="image"
                value={apiService.constructImageUrl(formData.image || '')}
                onChange={handleInputChange}
                placeholder="https://example.com/my-recipe-image.jpg"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <div className="relative">
                <input
                  id="upload-image-file"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  disabled={isUploadingImage}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('upload-image-file')?.click()}
                  disabled={isUploadingImage}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                  {isUploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Upload Image
                    </>
                  )}
                </button>
              </div>
            </div>
            {uploadImageFile && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Selected: {uploadImageFile.name} ({(uploadImageFile.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add a URL to an image of your completed recipe or upload a file</p>
          </div>

          <div>
            <label htmlFor="sourceUrl" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Source URL
            </label>
            <input
              type="url"
              id="sourceUrl"
              name="sourceUrl"
              value={formData.sourceUrl || ''}
              onChange={handleInputChange}
              placeholder="https://example.com/original-recipe"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">URL of the original recipe or inspiration source</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Tags
            </label>
            <TagInput
              tags={formData.tags}
              onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              availableTags={availableTags}
              placeholder="Add tags like 'vegetarian', 'quick', 'dessert'..."
              disabled={loading}
            />
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