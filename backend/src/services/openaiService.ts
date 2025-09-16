import OpenAI from 'openai'
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

class OpenAIService {
  private openai: OpenAI

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async parseRecipeText(text: string): Promise<ParsedRecipeData> {
    if (!text?.trim()) {
      throw new Error('Recipe text is required')
    }

    const systemPrompt = RECIPE_PARSER_PROMPT

    try {
      console.log('Making OpenAI API call with model: gpt-3.5-turbo')
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })
      console.log('OpenAI API call successful')

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
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
          throw new Error('Invalid JSON response from OpenAI')
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
      console.error('OpenAI API Error:', error)
      if (error instanceof Error) {
        throw new Error(`Failed to parse recipe text: ${error.message}`)
      }
      throw new Error('Failed to parse recipe text: Unknown error')
    }
  }
}

export const openaiService = new OpenAIService()