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
    small: { url: string; width: number; height: number; webp?: string }
    medium: { url: string; width: number; height: number; webp?: string }
    large: { url: string; width: number; height: number; webp?: string }
  }
  blurDataUrl?: string
  sourceUrl?: string
  isPublic: boolean
  aiEnhancedNotes?: string | null
  tags?: string[]
  // Simplified 2-level privacy: private (personal/household) vs public
  userId?: string
  householdId?: string
  // Original input tracking (stores pre-AI processing data)
  originalScrapedData?: string // JSON string of raw scraper output (URL imports)
  originalTextInput?: string // Original recipe text (text imports)
  importAdditionalContext?: string // Additional context from "+" button
  language?: string // ISO 639-1 language code (2 letters) detected by AI
  createdAt: string
  updatedAt: string
  // Permissions computed based on current user context
  canEdit?: boolean
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
  imageSizes?: {
    small: { url: string; width: number; height: number; webp?: string }
    medium: { url: string; width: number; height: number; webp?: string }
    large: { url: string; width: number; height: number; webp?: string }
  }
  blurDataUrl?: string
  sourceUrl?: string
  isPublic?: boolean
  tags?: string[]
  // User context (set by controller)
  userId?: string
  householdId?: string
  copiedFrom?: string
  // Original input tracking (stores pre-AI processing data)
  originalScrapedData?: string
  originalTextInput?: string
  importAdditionalContext?: string
  language?: string
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
  imageSizes?: {
    small: { url: string; width: number; height: number; webp?: string }
    medium: { url: string; width: number; height: number; webp?: string }
    large: { url: string; width: number; height: number; webp?: string }
  }
  blurDataUrl?: string
  sourceUrl?: string
  isPublic?: boolean
  tags?: string[]
  language?: string
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