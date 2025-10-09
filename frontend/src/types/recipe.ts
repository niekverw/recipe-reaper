export interface Recipe {
  id: string
  name: string
  description: string
  prepTimeMinutes: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings: number
  ingredients: string[]
  instructions: string[]
  image?: string
  sourceUrl?: string
  tags?: string[]
  language?: string
  createdAt: string
  updatedAt: string
}