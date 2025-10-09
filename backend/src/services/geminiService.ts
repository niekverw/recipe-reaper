import { GoogleGenerativeAI } from '@google/generative-ai'
import { RECIPE_PARSER_PROMPT } from '../config/prompts'
import sharp from 'sharp'

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
  language?: string
}

class GeminiService {
  private genAI: GoogleGenerativeAI

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required')
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }

  async parseRecipeText(text: string, targetLanguage?: string, additionalContext?: string): Promise<ParsedRecipeData> {
    if (!text?.trim()) {
      throw new Error('Recipe text is required')
    }

    // Build prompt with language instruction at the TOP for maximum attention
    let systemPrompt: string
    if (targetLanguage) {
      systemPrompt = `CRITICAL INSTRUCTION: You MUST translate the entire output to ${targetLanguage.toUpperCase()}. Every single text field (headers, name, description, all ingredients, all instructions) MUST be translated to ${targetLanguage}. Do NOT leave any text in the original language.\n\n${RECIPE_PARSER_PROMPT.replace('{translation_instruction}', `, translate to ${targetLanguage}`)}`
    } else {
      systemPrompt = `CRITICAL INSTRUCTION: DO NOT TRANSLATE ANYTHING. You must preserve the exact original language of the recipe. Keep all text fields (headers, name, description, ingredients, instructions) in their original language.\n\n${RECIPE_PARSER_PROMPT.replace('{translation_instruction}', '')}`
    }

    try {
      console.log('Making Gemini API call with model: gemini-2.5-flash-lite')
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

      const promptSections = [systemPrompt]

      if (additionalContext?.trim()) {
        promptSections.push(
          'ADDITIONAL USER NOTES TO INFORM THE RECIPE (FOLLOW THESE IF POSSIBLE):\n' +
          additionalContext.trim()
        )
      }

      promptSections.push(text)

      const composedPrompt = promptSections.join('\n\n')

      const result = await model.generateContent(composedPrompt)
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
        // Check for rate limit errors
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded for AI service. Please try again in a few moments.')
        }
        // Check for API key errors
        if (error.message.includes('API key') || error.message.includes('invalid_api_key')) {
          throw new Error('AI service configuration error. Please contact support.')
        }
        throw new Error(`Failed to parse recipe text: ${error.message}`)
      }
      throw new Error('Failed to parse recipe text: Unknown error')
    }
  }

  async parseRecipeFromImage(imageBuffer: Buffer, targetLanguage?: string): Promise<ParsedRecipeData> {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Image buffer is required')
    }

    // Build prompt with language instruction at the TOP for maximum attention
    let systemPrompt: string
    if (targetLanguage) {
      systemPrompt = `CRITICAL INSTRUCTION: You MUST translate the entire output to ${targetLanguage.toUpperCase()}. Every single text field (name, description, all ingredients, all instructions) MUST be translated to ${targetLanguage}. Do NOT leave any text in the original language.\n\n${RECIPE_PARSER_PROMPT.replace('{name_translation_instruction}', `, translate to ${targetLanguage}`)}`
    } else {
      systemPrompt = `CRITICAL INSTRUCTION: DO NOT TRANSLATE ANYTHING. You must preserve the exact original language of the recipe. Keep all text fields (name, description, ingredients, instructions) in their original language.\n\n${RECIPE_PARSER_PROMPT.replace('{name_translation_instruction}', '')}`
    }

    try {
      console.log('Making Gemini vision API call with model: gemini-2.5-flash-lite')
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

      // Downsample the image to reduce API costs and improve processing speed
      // Recipe text is usually readable even at lower resolutions
      console.log(`Original image size: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`)

      const processedImageBuffer = await sharp(imageBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toBuffer()

      console.log(`Processed image size: ${(processedImageBuffer.length / 1024 / 1024).toFixed(2)} MB`)

      // Convert buffer to base64
      const base64Image = processedImageBuffer.toString('base64')

      const result = await model.generateContent([
        systemPrompt + '\n\nExtract the recipe information from this image and return it in the specified JSON format.',
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        }
      ])

      const response = await result.response
      const content = response.text()

      console.log('Gemini vision API call successful')

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
          throw new Error('Invalid JSON response from Gemini vision')
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
        parsedData.description = 'Recipe imported from image'
      }

      return parsedData
    } catch (error) {
      console.error('Gemini Vision API Error:', error)
      if (error instanceof Error) {
        // Check for rate limit errors
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded for AI service. Please try again in a few moments.')
        }
        // Check for API key errors
        if (error.message.includes('API key') || error.message.includes('invalid_api_key')) {
          throw new Error('AI service configuration error. Please contact support.')
        }
        throw new Error(`Failed to parse recipe from image: ${error.message}`)
      }
      throw new Error('Failed to parse recipe from image: Unknown error')
    }
  }
}

export const geminiService = new GeminiService()
