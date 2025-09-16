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
  sourceUrl?: string
  isPublic: boolean
  aiEnhancedNotes?: string | null
  // Future-ready fields for user/household support
  userId?: string
  householdId?: string
  createdAt: string
  updatedAt: string
}

export interface CreateRecipeRequest {
  name: string
  description: string
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings?: number
  ingredients: string[] | IngredientCategory[]
  instructions: string[]
  image?: string
  sourceUrl?: string
  isPublic?: boolean
}

export interface UpdateRecipeRequest {
  name?: string
  description?: string
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings?: number
  ingredients?: string[] | IngredientCategory[]
  instructions?: string[]
  image?: string
  sourceUrl?: string
  isPublic?: boolean
}

export interface RecipeFilters {
  search?: string
  sortBy?: 'name' | 'time' | 'servings' | 'recent'
  isPublic?: boolean
  limit?: number
  offset?: number
}