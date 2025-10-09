import { Household, User } from '../types/user'

const translateScraperErrorMessage = (message: string | undefined | null): string | undefined => {
  if (!message) return message ?? undefined

  const normalized = message.toLowerCase()

  const scraperHints = [
    "nonetype",
    'recipe scrape failed',
    'unable to parse recipe',
    'not currently supported',
  ]

  const hasScraperSignature = scraperHints.some((hint) => normalized.includes(hint))

  if (hasScraperSignature) {
    return 'This website is not currently supported by the recipe scraper. Try using the "Text" or "Image" import options instead.'
  }

  return message
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface IngredientCategory {
  category?: string
  items: string[]
}

export interface Recipe {
  id: string
  name: string
  description: string
  prepTimeMinutes: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings: number
  ingredients: string[] | IngredientCategory[]
  instructions: string[]
  image?: string
  imageSizes?: {
    small: { url: string; width: number; height?: number; webp?: string }
    medium: { url: string; width: number; height?: number; webp?: string }
    large: { url: string; width: number; height?: number; webp?: string }
  }
  blurDataUrl?: string
  sourceUrl?: string
  aiEnhancedNotes?: string
  tags?: string[]
  isPublic: boolean
  userId?: string
  householdId?: string
  language?: string
  createdAt: string
  updatedAt: string
  canEdit?: boolean
}

export interface CreateRecipeData {
  name: string
  description: string
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings?: number
  ingredients: string[] | IngredientCategory[]
  instructions: string[]
  image?: string
  imageSizes?: {
    small: { url: string; width: number; height?: number; webp?: string }
    medium: { url: string; width: number; height?: number; webp?: string }
    large: { url: string; width: number; height?: number; webp?: string }
  }
  blurDataUrl?: string
  sourceUrl?: string
  tags?: string[]
  isPublic?: boolean
  householdId?: string
  // Original input tracking
  originalScrapedData?: string
  originalTextInput?: string
  importAdditionalContext?: string
  language?: string
}

export interface UpdateRecipeData extends Partial<CreateRecipeData> {}

export interface RecipeFilters {
  search?: string
  sortBy?: 'name' | 'time' | 'servings' | 'recent'
  tags?: string[]
  limit?: number
  offset?: number
  scope?: 'my' | 'public' | 'all'
}

export interface IngredientParsingOptions {
  language?: string
  additionalUOMs?: Record<string, string>
  allowLeadingOf?: boolean
}

export interface ParsedIngredient {
  quantity: number | null
  unit: string | null
  ingredient: string
  preparation: string | null
  original: string
}

export interface ShoppingListItem {
  id: string
  userId: string
  householdId?: string
  ingredient: string
  description?: string
  quantity?: string
  unit?: string
  category?: string
  displayName?: string
  recipeId?: string
  recipeName?: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface AddToShoppingListRequest {
  ingredients: string[]
  recipeId?: string
  recipeName?: string
  scale?: number
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const startTime = performance.now()

    // Don't set Content-Type for FormData, let the browser set it
    const isFormData = options?.body instanceof FormData
    const headers = isFormData
      ? { ...options?.headers }
      : {
          'Content-Type': 'application/json',
          ...options?.headers,
        }

    const response = await fetch(url, {
      headers,
      credentials: 'include',
      ...options,
    })

    // Track API call for performance monitoring
    const duration = performance.now() - startTime
    try {
      // Dynamically import to avoid circular dependencies
      import('../utils/performanceMonitor').then(({ performanceMonitor }) => {
        performanceMonitor.trackAPICall(
          endpoint,
          options?.method || 'GET',
          response.status,
          Math.round(duration)
        )
      }).catch(() => {
        // Silently fail if performance monitor isn't available
      })
    } catch (e) {
      // Silently fail
    }

    if (!response.ok) {
      // Try to parse error response as JSON
      const fallbackErrorMessage = `Server error (${response.status})`
      let errorMessage = fallbackErrorMessage

      try {
        const errorData = await response.json()
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch (parseError) {
        // If JSON parsing fails, try to get text response
        try {
          const errorText = await response.text()
          if (errorText) {
            errorMessage = errorText
          }
        } catch (textError) {
          // Use default error message with status code
        }
      }

      // Provide helpful messages for common HTTP status codes
      const friendlyErrorMessage = translateScraperErrorMessage(errorMessage)
      if (friendlyErrorMessage) {
        errorMessage = friendlyErrorMessage
      }

      if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.'
      } else if (response.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again in a few moments.'
      } else if (response.status === 500) {
        const hasMeaningfulMessage = errorMessage &&
          errorMessage !== fallbackErrorMessage &&
          !/internal server error/i.test(errorMessage)

        if (!hasMeaningfulMessage) {
          errorMessage = 'An internal server error occurred. Please try again.'
        }
      }

      throw new Error(errorMessage)
    }

    // Handle responses with no content (like DELETE operations)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T
    }

    return response.json()
  }

  // Recipe CRUD operations
  async getRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    const params = new URLSearchParams()

    if (filters?.search) params.append('search', filters.search)
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','))
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())
    if (filters?.scope) params.append('scope', filters.scope)

    const queryString = params.toString()
    const endpoint = queryString ? `/recipes?${queryString}` : '/recipes'

    const response = await this.request<{recipes: Recipe[]}>(endpoint)
    return response.recipes
  }

  async getRecipe(id: string): Promise<Recipe> {
    const response = await this.request<{recipe: Recipe}>(`/recipes/${id}`)
    return response.recipe
  }

  async createRecipe(data: CreateRecipeData): Promise<Recipe> {
    if (!navigator.onLine) {
      throw new Error('You are offline. Please reconnect to create recipes.')
    }

    const response = await this.request<{recipe: Recipe}>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    return response.recipe
  }

  async updateRecipe(id: string, data: UpdateRecipeData): Promise<Recipe> {
    if (!navigator.onLine) {
      throw new Error('You are offline. Please reconnect to update recipes.')
    }

    const response = await this.request<{recipe: Recipe}>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    return response.recipe
  }

  async deleteRecipe(id: string): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('You are offline. Please reconnect to delete recipes.')
    }

    await this.request<void>(`/recipes/${id}`, {
      method: 'DELETE',
    })
  }


  // Recipe scraping operation
  async scrapeRecipeFromUrl(url: string, targetLanguage?: string, additionalContext?: string) {
    const payload: Record<string, unknown> = { url }

    if (targetLanguage) {
      payload.targetLanguage = targetLanguage
    }

    if (additionalContext) {
      payload.additionalContext = additionalContext
    }

    return this.request<{
      recipeData: {
        name: string
        description: string
        ingredients: string[]
        instructions: string[]
        image?: string
        sourceUrl: string
        prepTimeMinutes?: number
        cookTimeMinutes?: number
        totalTimeMinutes?: number
        servings?: number
        originalScrapedData?: string
        importAdditionalContext?: string
        language?: string
      }
    }>('/recipes/scrape', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // Recipe text parsing operation using OpenAI
  async parseRecipeFromText(text: string, targetLanguage?: string) {
    return this.request<{
      recipeData: {
        name: string
        description: string
        ingredients: string[]
        instructions: string[]
        image?: string
        sourceUrl?: string
        prepTimeMinutes?: number
        cookTimeMinutes?: number
        totalTimeMinutes?: number
        servings?: number
        originalTextInput?: string
        language?: string
      }
    }>('/recipes/parse-text', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage }),
    })
  }

  // Recipe text parsing operation using Google Gemini
  async parseRecipeFromTextGemini(text: string, targetLanguage?: string, additionalContext?: string) {
    const payload: Record<string, unknown> = { text }

    if (targetLanguage) {
      payload.targetLanguage = targetLanguage
    }

    if (additionalContext) {
      payload.additionalContext = additionalContext
    }

    return this.request<{
      recipeData: {
        name: string
        description: string
        ingredients: string[]
        instructions: string[]
        image?: string
        sourceUrl?: string
        prepTimeMinutes?: number
        cookTimeMinutes?: number
        totalTimeMinutes?: number
        servings?: number
        originalTextInput?: string
        importAdditionalContext?: string
        language?: string
      }
    }>('/recipes/parse-text-gemini', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  // Recipe image parsing operation using Vision API + Gemini
  async parseRecipeFromImage(imageFile: File, targetLanguage?: string) {
    const formData = new FormData()
    formData.append('image', imageFile)
    if (targetLanguage) {
      formData.append('targetLanguage', targetLanguage)
    }

    return this.request<{
      recipeData: {
        name: string
        description: string
        ingredients: string[]
        instructions: string[]
        image?: string
        sourceUrl?: string
        prepTimeMinutes?: number
        cookTimeMinutes?: number
        totalTimeMinutes?: number
        servings?: number
        language?: string
      }
      extractedText: string
    }>('/recipes/parse-image', {
      method: 'POST',
      body: formData,
    })
  }

  // Recipe enhancement operation using AI
  async enhanceRecipe(id: string) {
    const response = await this.request<{
      message: string
      recipe: Recipe
    }>(`/recipes/${id}/enhance`, {
      method: 'POST',
    })

    return response
  }

  // Upload image and get URL (no recipe parsing)
  async uploadImage(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)

    return this.request<{
      imageUrl: string
      imageSizes: {
        small: { url: string; width: number; height?: number }
        medium: { url: string; width: number; height?: number }
        large: { url: string; width: number; height?: number }
      }
    }>('/recipes/upload-image', {
      method: 'POST',
      body: formData,
    })
  }

  // Delete uploaded image by filename
  async deleteImage(filename: string) {
    return this.request<void>(`/recipes/delete-image/${filename}`, {
      method: 'DELETE',
    })
  }

  // Helper to determine the public frontend URL for image URLs
  private getPublicBackendUrl(): string {
    const currentUrl = window.location
    const hostname = currentUrl.hostname
    const port = currentUrl.port || (currentUrl.protocol === 'https:' ? '443' : '80')

    // Return the frontend URL (images will be served via proxy)
    return `${currentUrl.protocol}//${hostname}:${port}`
  }

  // Helper to construct full URL from relative path or return external URLs as-is
  public constructImageUrl(imagePath: string): string {
    if (!imagePath) return ''

    // If it's already a full URL (external image), return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }

    // If it's a relative path starting with /uploads, construct full URL
    if (imagePath.startsWith('/uploads/')) {
      return `${this.getPublicBackendUrl()}${imagePath}`
    }

    // For any other relative paths, also construct full URL
    if (imagePath.startsWith('/')) {
      return `${this.getPublicBackendUrl()}${imagePath}`
    }

    // Fallback - return as-is
    return imagePath
  }

  // Get all unique tags
  async getAllTags(): Promise<string[]> {
    const response = await this.request<{ tags: string[] }>('/recipes/tags')
    return response.tags
  }

  // Copy recipe to user's collection
  async copyRecipe(id: string, data: { householdId?: string } = {}): Promise<Recipe> {
    const response = await this.request<{ recipe: Recipe }>(`/recipes/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    return response.recipe
  }

  // Check if recipe name exists in public recipes
  async checkRecipeName(name: string, excludeId?: string): Promise<{ exists: boolean; message: string }> {
    const params = new URLSearchParams()
    params.append('name', name)
    if (excludeId) params.append('excludeId', excludeId)

    return this.request<{ exists: boolean; message: string }>(`/recipes/check-name?${params.toString()}`)
  }

  // Household management functions
  async getCurrentHousehold(): Promise<{ household: Household | null }> {
    return this.request<{ household: Household | null }>('/households/current')
  }

  async regenerateInviteCode(): Promise<{ household: Household }> {
    return this.request<{ household: Household }>('/households/regenerate-invite', {
      method: 'POST'
    })
  }

  // Shopping list methods
  async getShoppingList(): Promise<ShoppingListItem[]> {
    return this.request<ShoppingListItem[]>('/shopping-list')
  }

  async addToShoppingList(data: AddToShoppingListRequest): Promise<{ message: string; items: ShoppingListItem[] }> {
    const result = await this.request<{ message: string; items: ShoppingListItem[] }>('/shopping-list', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return result
  }

  async updateShoppingListItem(id: string, data: { isCompleted: boolean }): Promise<ShoppingListItem> {
    const result = await this.request<ShoppingListItem>(`/shopping-list/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return result
  }

  async deleteShoppingListItem(id: string): Promise<{ message: string }> {
    const result = await this.request<{ message: string }>(`/shopping-list/${id}`, {
      method: 'DELETE'
    })
    return result
  }

  async clearCompletedShoppingItems(): Promise<{ message: string }> {
    const result = await this.request<{ message: string }>('/shopping-list/completed', {
      method: 'DELETE'
    })
    return result
  }

  async clearAllShoppingItems(): Promise<{ message: string }> {
    const result = await this.request<{ message: string }>('/shopping-list', {
      method: 'DELETE'
    })
    return result
  }

  // Update user's default translation language preference
  async updateTranslationPreference(language: string | null): Promise<{ message: string; user: User }> {
    return this.request<{ message: string; user: User }>('/auth/translation-preference', {
      method: 'PATCH',
      body: JSON.stringify({ language }),
    })
  }
}

export const apiService = new ApiService()
