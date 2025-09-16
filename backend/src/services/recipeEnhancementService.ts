import { GoogleGenerativeAI } from '@google/generative-ai'
import { RECIPE_ENHANCEMENT_PROMPT } from '../config/prompts'

interface RecipeEnhancementData {
  cookingTips: string[]
  traditionalNotes: string
  modernVariations: string[]
  troubleshooting: string[]
  servingSuggestions: string[]
  storageNotes: string
}

interface RecipeData {
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  servings?: number
}

class RecipeEnhancementService {
  private genAI: GoogleGenerativeAI

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }

  async enhanceRecipe(recipeData: RecipeData): Promise<RecipeEnhancementData> {
    if (!recipeData.name?.trim() || !recipeData.ingredients?.length || !recipeData.instructions?.length) {
      throw new Error('Recipe must have name, ingredients, and instructions to enhance')
    }

    // Format recipe data for the AI prompt
    const recipeText = this.formatRecipeForPrompt(recipeData)

    try {
      console.log('Making Gemini API call for recipe enhancement with model: gemini-2.5-flash-lite')
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

      const result = await model.generateContent(`${RECIPE_ENHANCEMENT_PROMPT}\n\nRecipe to enhance:\n${recipeText}`)
      const response = await result.response
      const content = response.text()

      console.log('Gemini API call for enhancement successful')

      if (!content) {
        throw new Error('No response from Gemini')
      }

      // Parse the JSON response
      let enhancementData: RecipeEnhancementData
      try {
        enhancementData = JSON.parse(content)
      } catch (error) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          enhancementData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Invalid JSON response from Gemini for recipe enhancement')
        }
      }

      // Validate and sanitize the response
      const sanitizedData: RecipeEnhancementData = {
        cookingTips: Array.isArray(enhancementData.cookingTips) ? enhancementData.cookingTips : [],
        traditionalNotes: typeof enhancementData.traditionalNotes === 'string' ? enhancementData.traditionalNotes : '',
        modernVariations: Array.isArray(enhancementData.modernVariations) ? enhancementData.modernVariations : [],
        troubleshooting: Array.isArray(enhancementData.troubleshooting) ? enhancementData.troubleshooting : [],
        servingSuggestions: Array.isArray(enhancementData.servingSuggestions) ? enhancementData.servingSuggestions : [],
        storageNotes: typeof enhancementData.storageNotes === 'string' ? enhancementData.storageNotes : ''
      }

      return sanitizedData
    } catch (error) {
      console.error('Recipe Enhancement Error:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to enhance recipe: ${error.message}`)
      }
      throw new Error('Failed to enhance recipe: Unknown error')
    }
  }

  private formatRecipeForPrompt(recipeData: RecipeData): string {
    let formatted = `Recipe Name: ${recipeData.name}\n\n`

    if (recipeData.description) {
      formatted += `Description: ${recipeData.description}\n\n`
    }

    formatted += `Ingredients:\n${recipeData.ingredients.map(ing => `- ${ing}`).join('\n')}\n\n`

    formatted += `Instructions:\n${recipeData.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}\n\n`

    if (recipeData.prepTimeMinutes) {
      formatted += `Prep Time: ${recipeData.prepTimeMinutes} minutes\n`
    }
    if (recipeData.cookTimeMinutes) {
      formatted += `Cook Time: ${recipeData.cookTimeMinutes} minutes\n`
    }
    if (recipeData.servings) {
      formatted += `Servings: ${recipeData.servings}\n`
    }

    return formatted
  }
}

export const recipeEnhancementService = new RecipeEnhancementService()
export type { RecipeEnhancementData }