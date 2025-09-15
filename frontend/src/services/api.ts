const API_BASE_URL = 'http://localhost:3001/api'

export interface IngredientCategory {
  category?: string
  items: string[]
}

export interface Recipe {
  id: string
  name: string
  description: string
  prepTimeMinutes: number
  servings: number
  ingredients: string[] | IngredientCategory[]
  instructions: string[]
  image?: string
  createdAt: string
  updatedAt: string
}

export interface CreateRecipeData {
  name: string
  description: string
  prepTimeMinutes?: number
  servings?: number
  ingredients: string[] | IngredientCategory[]
  instructions: string[]
  image?: string
}

export interface UpdateRecipeData extends Partial<CreateRecipeData> {}

export interface RecipeFilters {
  search?: string
  isPublic?: boolean
  sortBy?: 'name' | 'createdAt' | 'prepTimeMinutes' | 'servings'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
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

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
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
    if (filters?.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString())
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.offset) params.append('offset', filters.offset.toString())

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

  // Ingredient parsing operations
  async parseIngredients(ingredients: string[], options?: IngredientParsingOptions) {
    return this.request<{
      parsed: ParsedIngredient[]
      validation: { isValid: boolean; errors: string[] }
      estimatedServings: number
      estimatedPrepTime: number
    }>('/ingredients/parse', {
      method: 'POST',
      body: JSON.stringify({ ingredients, options }),
    })
  }

  async scaleIngredients(ingredients: string[], scaleFactor: number) {
    return this.request<{
      originalIngredients: string[]
      scaledIngredients: string[]
      scaleFactor: number
    }>('/ingredients/scale', {
      method: 'POST',
      body: JSON.stringify({ ingredients, scaleFactor }),
    })
  }

  async parseIngredientsFromText(text: string, options?: IngredientParsingOptions) {
    return this.request<{
      parsed: ParsedIngredient[]
      validation: { isValid: boolean; errors: string[] }
      ingredients: string[]
      estimatedServings: number
      estimatedPrepTime: number
    }>('/ingredients/parse-text', {
      method: 'POST',
      body: JSON.stringify({ text, options }),
    })
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health')
  }
}

export const apiService = new ApiService()