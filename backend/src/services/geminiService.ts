import { GoogleGenerativeAI } from '@google/generative-ai'
import { RECIPE_PARSER_PROMPT } from '../config/prompts'

interface ParsedRecipeData {
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  servings?: number
  image?: string
}

class GeminiService {
  private genAI: GoogleGenerativeAI

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }

  async parseRecipeText(text: string): Promise<ParsedRecipeData> {
    if (!text?.trim()) {
      throw new Error('Recipe text is required')
    }

    const systemPrompt = RECIPE_PARSER_PROMPT

    try {
      console.log('Making Gemini API call with model: gemini-2.5-flash-lite')
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

      const result = await model.generateContent(`${systemPrompt}\n\n${text}`)
      const response = await result.response
      const content = response.text()

      console.log('Gemini API call successful')

      if (!content) {
        throw new Error('No response from Gemini')
      }

      // Parse the JSON response
      let parsedData: ParsedRecipeData
      try {
        parsedData = JSON.parse(content)
      } catch (error) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Invalid JSON response from Gemini')
        }
      }

      // Validate required fields
      if (!parsedData.name || !parsedData.ingredients || !parsedData.instructions) {
        throw new Error('Missing required recipe fields in parsed data')
      }

      // Ensure arrays are arrays
      if (!Array.isArray(parsedData.ingredients)) {
        parsedData.ingredients = []
      }
      if (!Array.isArray(parsedData.instructions)) {
        parsedData.instructions = []
      }

      // Set default description if missing
      if (!parsedData.description) {
        parsedData.description = 'Recipe imported from text'
      }

      return parsedData
    } catch (error) {
      console.error('Gemini API Error:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to parse recipe text: ${error.message}`)
      }
      throw new Error('Failed to parse recipe text: Unknown error')
    }
  }
}

export const geminiService = new GeminiService()