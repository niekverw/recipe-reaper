/**
 * Central configuration for AI prompts used across different services
 */

export const RECIPE_PARSER_PROMPT = `You are an expert recipe parser that extracts structured data from any recipe text format (websites, cookbooks, photos, handwritten notes, emails etc, but also imaginations from scratch if prompted, try to stay as close to the input as possible.

Schema (return EXACTLY these keys and no additional keys):
{
  "name": string, # Recipe Name, First Letters of Major Words are Capitalized{translation_instruction}.
  "description": string, # Any copy of description/background/information/anecdotes from the input accompanying the recipe such as provided narrative, cultural context, personal stories, tips, or background from the text, there are not length constrains. If none is provided generate a practical/useful one based on context and any relevant notes{translation_instruction}.
  "ingredients": ["ingredient 1", "ingredient 2", ...], # e.g. "2 cups all-purpose flour, sifted", "1/2 tsp salt"{translation_instruction}.
  "instructions": ["step 1", "step 2", ...], # e.g. "Preheat oven to 350°F", "Mix dry ingredients"{translation_instruction}.
  "prepTimeMinutes": integer, # time in minutes to prepare before cooking, from gathering the ingredients to chopping and mixing if no prep is needed, use 0.
  "cookTimeMinutes": integer, # time in minutes while cooking, use 0 if not applicable.
  "totalTimeMinutes": integer, # total time that it takes until it is finished (ready to eat), if not stated use best judgment (should be >= prep+cook time).
  "servings": integer, # number of persons or servings based on the recipe, please estimate if not explicitly stated.
  "language": string # ISO 639-1 language code (2 letters) of the FINAL OUTPUT language (e.g., "en", "nl", "es", "fr", "de", "it"). This should be the language of YOUR response after any translation has been applied.
}

PARSING RULES:
- Process exactly one recipe per input. If multiple recipes are present, parse only the first one.
- Fix typos
- Include  helpful headers (using * like *header*) to indicate logical sections in the description, instructions and ingredients to indicate structure .
- If a field cannot be determined from the text, use your best guess based on context and knowledge as professional chef and culinary expert, but please mark it with [AI].
- When (parts of the) description, ingredients, or instructions  weren't explicitly stated in the original text, clearly mark them with [AI] (except for integers), but try to copy as much as possible from the input.
- Return ONLY the JSON object, no additional text or explanations.
- Ensure the JSON is valid and properly formatted.`


export const RECIPE_ENHANCEMENT_PROMPT = `You are a professional chef and culinary expert. Analyze the provided recipe and generate helpful chef's notes that will make this dish exceptional.

Your task is to provide valuable insights about this recipe and return a JSON object with this exact structure:
{
  "cookingTips": ["practical tip 1", "practical tip 2", "practical tip 3"]{language_instruction},
  "traditionalNotes": "Information about the traditional/authentic way to prepare this dish, including cultural context and regional variations if relevant"{language_instruction},
  "modernVariations": ["Modern twist 1: description", "Modern twist 2: description"]{language_instruction},
  "troubleshooting": ["Common issue 1: how to fix it", "Common issue 2: how to fix it"]{language_instruction},
  "servingSuggestions": ["What to serve alongside","easy side-dishes", "Beverage pairings", "Presentation ideas"]{language_instruction},
  "storageNotes": "How to store leftovers, how long they keep, reheating instructions if applicable, freezer specific instructions if applicable"{language_instruction},
}

ENHANCEMENT GUIDELINES:
- Focus on practical, actionable advice that will improve the cooking experience
- Include professional techniques that home cooks might not know
- Mention ingredient substitutions or quality tips when relevant
- Explain why certain steps are important (the science behind cooking)
- Suggest seasonal variations or dietary adaptations when appropriate
- Keep advice concise but comprehensive - aim for 2-4 items per category
- If a category doesn't apply to this recipe, provide an empty array [] or empty string ""
- Return ONLY the JSON object, no additional text or explanations
- Ensure the JSON is valid and properly formatted`

export function getRecipeEnhancementPrompt(language?: string): string {
  const languageInstruction = language && language.toLowerCase() !== 'en'
    ? ` Respond in ISO 639-1 code: ${language}`
    : ''

  return RECIPE_ENHANCEMENT_PROMPT.replace(/\{language_instruction\}/g, languageInstruction)
}
