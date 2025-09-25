import { Household } from '../types/user'

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
    small: { url: string; width: number }
    medium: { url: string; width: number }
    large: { url: string; width: number }
  }
  sourceUrl?: string
  aiEnhancedNotes?: string
  tags?: string[]
  isPublic: boolean
  userId?: string
  householdId?: string
  createdAt: string
  updatedAt: string
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
    small: { url: string; width: number }
    medium: { url: string; width: number }
    large: { url: string; width: number }
  }
  sourceUrl?: string
  tags?: string[]
  isPublic?: boolean
  householdId?: string
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
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
    const response = await this.request<{recipe: Recipe}>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.recipe
  }

  async updateRecipe(id: string, data: UpdateRecipeData): Promise<Recipe> {
    const response = await this.request<{recipe: Recipe}>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response.recipe
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.request<void>(`/recipes/${id}`, {
      method: 'DELETE',
    })
  }

  // Recipe scraping operation
  async scrapeRecipeFromUrl(url: string) {
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
      }
    }>('/recipes/scrape', {
      method: 'POST',
      body: JSON.stringify({ url }),
    })
  }

  // Recipe text parsing operation using OpenAI
  async parseRecipeFromText(text: string) {
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
      }
    }>('/recipes/parse-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  // Recipe text parsing operation using Google Gemini
  async parseRecipeFromTextGemini(text: string) {
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
      }
    }>('/recipes/parse-text-gemini', {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  // Recipe image parsing operation using Vision API + Gemini
  async parseRecipeFromImage(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)

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
      }
      extractedText: string
    }>('/recipes/parse-image', {
      method: 'POST',
      body: formData,
    })
  }

  // Recipe enhancement operation using AI
  async enhanceRecipe(id: string) {
    return this.request<{
      message: string
      recipe: Recipe
    }>(`/recipes/${id}/enhance`, {
      method: 'POST',
    })
  }

  // Upload image and get URL (no recipe parsing)
  async uploadImage(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)

    return this.request<{
      imageUrl: string
      imageSizes: {
        small: { url: string; width: number }
        medium: { url: string; width: number }
        large: { url: string; width: number }
      }
    }>('/recipes/upload-image', {
      method: 'POST',
      body: formData,
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

  // Delete uploaded image by filename
  async deleteImage(filename: string) {
    return this.request<void>(`/recipes/delete-image/${filename}`, {
      method: 'DELETE',
    })
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
    return this.request<{ message: string; items: ShoppingListItem[] }>('/shopping-list', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateShoppingListItem(id: string, data: { isCompleted: boolean }): Promise<ShoppingListItem> {
    return this.request<ShoppingListItem>(`/shopping-list/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteShoppingListItem(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/shopping-list/${id}`, {
      method: 'DELETE'
    })
  }

  async clearCompletedShoppingItems(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/shopping-list/completed', {
      method: 'DELETE'
    })
  }

  async clearAllShoppingItems(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/shopping-list', {
      method: 'DELETE'
    })
  }
}

export const apiService = new ApiService()