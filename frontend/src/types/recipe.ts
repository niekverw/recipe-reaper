export interface Recipe {
  id: string
  name: string
  description: string
  prepTimeMinutes: number
  servings: number
  ingredients: string[]
  instructions: string[]
  image?: string
  sourceUrl?: string
  createdAt: string
  updatedAt: string
}