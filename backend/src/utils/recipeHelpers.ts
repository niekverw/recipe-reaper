/**
 * Helper functions for recipe data processing
 */

/**
 * Parse servings from various string formats
 * @param servings - String containing servings information
 * @returns Parsed number of servings or undefined
 */
export function parseServings(servings?: string): number | undefined {
  if (!servings) return undefined

  // Extract number from various formats
  const match = servings.match(/(\d+)/)
  return match ? parseInt(match[1]) : undefined
}

/**
 * Normalize various data types to string array
 * @param value - Value to normalize (string, array, or other)
 * @returns Normalized string array
 */
export function normalizeArray(value: unknown): string[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
      .filter((item) => item.length > 0)
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  return [String(value)].filter((item) => item.length > 0)
}

/**
 * Build formatted recipe text from scraped data
 * @param data - Scraped recipe data
 * @param ingredients - Array of ingredients
 * @param instructions - Array of instructions
 * @returns Formatted recipe text
 */
export function buildRecipeTextFromScrape(
  data: any,
  ingredients: string[],
  instructions: string[]
): string {
  const lines: string[] = []

  if (data?.name) {
    lines.push(`Recipe Name: ${data.name}`)
  }

  if (data?.description) {
    lines.push(`Description: ${data.description}`)
  }

  if (ingredients.length) {
    lines.push('Ingredients:')
    for (const ingredient of ingredients) {
      lines.push(`- ${ingredient}`)
    }
  }

  if (instructions.length) {
    lines.push('Instructions:')
    instructions.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`)
    })
  }

  if (data?.prepTimeMinutes) {
    lines.push(`Prep Time: ${data.prepTimeMinutes} minutes`)
  }

  if (data?.cookTimeMinutes) {
    lines.push(`Cook Time: ${data.cookTimeMinutes} minutes`)
  }

  if (data?.totalTimeMinutes) {
    lines.push(`Total Time: ${data.totalTimeMinutes} minutes`)
  }

  if (data?.yields) {
    lines.push(`Servings: ${data.yields}`)
  }

  if (data?.category) {
    lines.push(`Category: ${data.category}`)
  }

  if (data?.cuisine) {
    lines.push(`Cuisine: ${data.cuisine}`)
  }

  return lines.join('\n')
}

/**
 * Parse image URL from various data formats
 * @param image - Image data (string, object, or undefined)
 * @returns Parsed image URL or undefined
 */
export function parseImageUrl(image?: any): string | undefined {
  if (!image) return undefined

  // If it's already a string, return it
  if (typeof image === 'string') {
    return image
  }

  // If it's an object with a url property, return that
  if (typeof image === 'object' && image.url) {
    return image.url
  }

  // If it's an object with a contentUrl property, return that
  if (typeof image === 'object' && image.contentUrl) {
    return image.contentUrl
  }

  // If it's an object with an @id that looks like a URL, return that
  if (typeof image === 'object' && image['@id'] && image['@id'].startsWith('http')) {
    return image['@id']
  }

  return undefined
}
