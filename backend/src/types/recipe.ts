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
  tags?: string[]
  // Simplified 2-level privacy: private (personal/household) vs public
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
  tags?: string[]
  // User context (set by controller)
  userId?: string
  householdId?: string
  copiedFrom?: string
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
  tags?: string[]
}

export interface RecipeFilters {
  search?: string
  sortBy?: 'name' | 'time' | 'servings' | 'recent'
  isPublic?: boolean
  tags?: string[]
  limit?: number
  offset?: number
  // User context for access control
  userId?: string
  householdId?: string
  // Recipe context
  scope?: 'my' | 'public' | 'all'  // 'my' = user's accessible recipes, 'public' = only public, 'all' = everything user can see
}