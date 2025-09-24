import { ingredientParser } from './ingredientParser'

export interface IngredientCategory {
  id: string
  name: string
  emoji: string
  sortOrder: number
}

export interface CategorizedIngredient {
  originalText: string
  displayName: string
  category: IngredientCategory
  confidence: number // 0-1, how confident we are in the match
}

export const INGREDIENT_CATEGORIES: Record<string, IngredientCategory> = {
  PRODUCE: {
    id: 'PRODUCE',
    name: 'Produce',
    emoji: '🥬',
    sortOrder: 1
  },
  MEAT_SEAFOOD: {
    id: 'MEAT_SEAFOOD',
    name: 'Meat & Seafood',
    emoji: '🥩',
    sortOrder: 2
  },
  DAIRY_EGGS: {
    id: 'DAIRY_EGGS',
    name: 'Dairy & Eggs',
    emoji: '🥛',
    sortOrder: 3
  },
  PANTRY: {
    id: 'PANTRY',
    name: 'Pantry',
    emoji: '🥄',
    sortOrder: 4
  },
  CANNED_JARRED: {
    id: 'CANNED_JARRED',
    name: 'Canned & Jarred',
    emoji: '🥫',
    sortOrder: 5
  },
  FROZEN: {
    id: 'FROZEN',
    name: 'Frozen',
    emoji: '🧊',
    sortOrder: 6
  },
  BAKERY: {
    id: 'BAKERY',
    name: 'Bakery',
    emoji: '🍞',
    sortOrder: 7
  },
  GRAINS_PASTA: {
    id: 'GRAINS_PASTA',
    name: 'Grains & Pasta',
    emoji: '🍝',
    sortOrder: 8
  },
  SNACKS_BEVERAGES: {
    id: 'SNACKS_BEVERAGES',
    name: 'Snacks & Beverages',
    emoji: '🥤',
    sortOrder: 9
  },
  PERSONAL_CARE: {
    id: 'PERSONAL_CARE',
    name: 'Personal Care',
    emoji: '🧴',
    sortOrder: 10
  },
  OTHER: {
    id: 'OTHER',
    name: 'Other',
    emoji: '📦',
    sortOrder: 11
  }
}

interface IngredientMapping {
  displayName: string
  category: string
  keywords: string[]
  exactMatches?: string[]
  excludeKeywords?: string[]
}

class IngredientCategorizer {
  private ingredientMappings: IngredientMapping[] = [
    // PRODUCE
    {
      displayName: 'Onions',
      category: 'PRODUCE',
      keywords: ['onion', 'onions'],
      exactMatches: ['yellow onion', 'white onion', 'red onion', 'sweet onion', 'vidalia onion']
    },
    {
      displayName: 'Green Onions',
      category: 'PRODUCE',
      keywords: ['green onion', 'scallion', 'spring onion', 'green onions', 'scallions'],
      exactMatches: ['green onion', 'scallions', 'green onions']
    },
    {
      displayName: 'Garlic',
      category: 'PRODUCE',
      keywords: ['garlic', 'garlic clove', 'garlic cloves', 'fresh garlic'],
      exactMatches: ['garlic', 'garlic cloves', 'fresh garlic']
    },
    {
      displayName: 'Tomatoes',
      category: 'PRODUCE',
      keywords: ['tomato', 'tomatoes', 'cherry tomato', 'grape tomato', 'roma tomato'],
      exactMatches: ['fresh tomato', 'fresh tomatoes', 'cherry tomatoes', 'grape tomatoes'],
      excludeKeywords: ['canned', 'can', 'paste', 'sauce']
    },
    {
      displayName: 'Potatoes',
      category: 'PRODUCE',
      keywords: ['potato', 'potatoes', 'russet potato', 'red potato', 'yukon potato'],
      exactMatches: ['potatoes', 'russet potatoes', 'red potatoes']
    },
    {
      displayName: 'Carrots',
      category: 'PRODUCE',
      keywords: ['carrot', 'carrots', 'baby carrot'],
      exactMatches: ['carrots', 'baby carrots', 'fresh carrots']
    },
    {
      displayName: 'Celery',
      category: 'PRODUCE',
      keywords: ['celery', 'celery stalk', 'celery stalks'],
      exactMatches: ['celery', 'celery stalks', 'fresh celery']
    },
    {
      displayName: 'Bell Peppers',
      category: 'PRODUCE',
      keywords: ['bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'orange pepper'],
      exactMatches: ['bell pepper', 'bell peppers', 'red bell pepper']
    },
    {
      displayName: 'Mushrooms',
      category: 'PRODUCE',
      keywords: ['mushroom', 'mushrooms', 'button mushroom', 'cremini', 'shiitake', 'portobello'],
      exactMatches: ['mushrooms', 'fresh mushrooms', 'button mushrooms']
    },
    {
      displayName: 'Lettuce',
      category: 'PRODUCE',
      keywords: ['lettuce', 'romaine', 'iceberg lettuce', 'butter lettuce', 'mixed greens'],
      exactMatches: ['lettuce', 'romaine lettuce', 'mixed greens']
    },
    {
      displayName: 'Spinach',
      category: 'PRODUCE',
      keywords: ['spinach', 'baby spinach', 'fresh spinach'],
      exactMatches: ['spinach', 'fresh spinach', 'baby spinach'],
      excludeKeywords: ['frozen']
    },
    {
      displayName: 'Basil',
      category: 'PRODUCE',
      keywords: ['basil', 'fresh basil', 'sweet basil'],
      exactMatches: ['fresh basil', 'basil leaves'],
      excludeKeywords: ['dried']
    },
    {
      displayName: 'Parsley',
      category: 'PRODUCE',
      keywords: ['parsley', 'fresh parsley', 'flat leaf parsley', 'curly parsley'],
      exactMatches: ['fresh parsley', 'italian parsley'],
      excludeKeywords: ['dried']
    },
    {
      displayName: 'Cilantro',
      category: 'PRODUCE',
      keywords: ['cilantro', 'fresh cilantro', 'coriander leaves'],
      exactMatches: ['fresh cilantro', 'cilantro bunch']
    },
    {
      displayName: 'Lemon',
      category: 'PRODUCE',
      keywords: ['lemon', 'lemons', 'fresh lemon'],
      exactMatches: ['lemon', 'lemons', 'fresh lemon']
    },
    {
      displayName: 'Lime',
      category: 'PRODUCE',
      keywords: ['lime', 'limes', 'fresh lime'],
      exactMatches: ['lime', 'limes', 'fresh lime']
    },
    {
      displayName: 'Avocado',
      category: 'PRODUCE',
      keywords: ['avocado', 'avocados', 'ripe avocado'],
      exactMatches: ['avocado', 'avocados', 'ripe avocado']
    },
    {
      displayName: 'Bananas',
      category: 'PRODUCE',
      keywords: ['banana', 'bananas', 'ripe banana'],
      exactMatches: ['bananas', 'ripe bananas']
    },
    {
      displayName: 'Apples',
      category: 'PRODUCE',
      keywords: ['apple', 'apples', 'granny smith', 'red delicious', 'gala apple'],
      exactMatches: ['apples', 'granny smith apples']
    },

    // MEAT & SEAFOOD
    {
      displayName: 'Ground Beef',
      category: 'MEAT_SEAFOOD',
      keywords: ['ground beef', 'ground chuck', 'hamburger'],
      exactMatches: ['ground beef', '80/20 ground beef', 'lean ground beef']
    },
    {
      displayName: 'Chicken Breast',
      category: 'MEAT_SEAFOOD',
      keywords: ['chicken breast', 'boneless chicken breast', 'skinless chicken breast'],
      exactMatches: ['chicken breast', 'boneless skinless chicken breast', 'chicken breasts']
    },
    {
      displayName: 'Chicken Thighs',
      category: 'MEAT_SEAFOOD',
      keywords: ['chicken thigh', 'chicken thighs', 'boneless thighs'],
      exactMatches: ['chicken thighs', 'boneless chicken thighs']
    },
    {
      displayName: 'Ground Turkey',
      category: 'MEAT_SEAFOOD',
      keywords: ['ground turkey', 'turkey ground'],
      exactMatches: ['ground turkey', 'lean ground turkey']
    },
    {
      displayName: 'Salmon',
      category: 'MEAT_SEAFOOD',
      keywords: ['salmon', 'salmon fillet', 'atlantic salmon'],
      exactMatches: ['salmon', 'salmon fillets', 'fresh salmon']
    },
    {
      displayName: 'Shrimp',
      category: 'MEAT_SEAFOOD',
      keywords: ['shrimp', 'prawns', 'jumbo shrimp'],
      exactMatches: ['shrimp', 'large shrimp', 'raw shrimp'],
      excludeKeywords: ['frozen']
    },
    {
      displayName: 'Bacon',
      category: 'MEAT_SEAFOOD',
      keywords: ['bacon', 'thick cut bacon', 'turkey bacon'],
      exactMatches: ['bacon', 'thick-cut bacon']
    },

    // DAIRY & EGGS
    {
      displayName: 'Eggs',
      category: 'DAIRY_EGGS',
      keywords: ['egg', 'eggs', 'large eggs', 'free range eggs', 'organic eggs'],
      exactMatches: ['eggs', 'large eggs', 'dozen eggs']
    },
    {
      displayName: 'Milk',
      category: 'DAIRY_EGGS',
      keywords: ['milk', 'whole milk', '2% milk', 'skim milk', 'low fat milk'],
      exactMatches: ['milk', 'whole milk', '2% milk']
    },
    {
      displayName: 'Butter',
      category: 'DAIRY_EGGS',
      keywords: ['butter', 'unsalted butter', 'salted butter'],
      exactMatches: ['butter', 'unsalted butter']
    },
    {
      displayName: 'Cheese',
      category: 'DAIRY_EGGS',
      keywords: ['cheese', 'cheddar', 'mozzarella', 'parmesan', 'swiss cheese', 'cream cheese'],
      exactMatches: ['cheddar cheese', 'mozzarella cheese', 'parmesan cheese']
    },
    {
      displayName: 'Greek Yogurt',
      category: 'DAIRY_EGGS',
      keywords: ['greek yogurt', 'yogurt', 'plain yogurt'],
      exactMatches: ['greek yogurt', 'plain greek yogurt']
    },
    {
      displayName: 'Heavy Cream',
      category: 'DAIRY_EGGS',
      keywords: ['heavy cream', 'heavy whipping cream', 'whipping cream'],
      exactMatches: ['heavy cream', 'heavy whipping cream']
    },
    {
      displayName: 'Sour Cream',
      category: 'DAIRY_EGGS',
      keywords: ['sour cream'],
      exactMatches: ['sour cream', 'light sour cream']
    },

    // PANTRY
    {
      displayName: 'Olive Oil',
      category: 'PANTRY',
      keywords: ['olive oil', 'extra virgin olive oil', 'evoo'],
      exactMatches: ['olive oil', 'extra virgin olive oil']
    },
    {
      displayName: 'Vegetable Oil',
      category: 'PANTRY',
      keywords: ['vegetable oil', 'canola oil', 'cooking oil'],
      exactMatches: ['vegetable oil', 'canola oil']
    },
    {
      displayName: 'Salt',
      category: 'PANTRY',
      keywords: ['salt', 'table salt', 'kosher salt', 'sea salt'],
      exactMatches: ['salt', 'kosher salt', 'sea salt']
    },
    {
      displayName: 'Black Pepper',
      category: 'PANTRY',
      keywords: ['black pepper', 'pepper', 'ground black pepper', 'freshly ground pepper'],
      exactMatches: ['black pepper', 'ground black pepper']
    },
    {
      displayName: 'Garlic Powder',
      category: 'PANTRY',
      keywords: ['garlic powder', 'powdered garlic'],
      exactMatches: ['garlic powder']
    },
    {
      displayName: 'Paprika',
      category: 'PANTRY',
      keywords: ['paprika', 'sweet paprika', 'smoked paprika'],
      exactMatches: ['paprika', 'smoked paprika']
    },
    {
      displayName: 'Cumin',
      category: 'PANTRY',
      keywords: ['cumin', 'ground cumin', 'cumin powder'],
      exactMatches: ['cumin', 'ground cumin']
    },
    {
      displayName: 'Oregano',
      category: 'PANTRY',
      keywords: ['oregano', 'dried oregano', 'ground oregano'],
      exactMatches: ['oregano', 'dried oregano'],
      excludeKeywords: ['fresh']
    },
    {
      displayName: 'Thyme',
      category: 'PANTRY',
      keywords: ['thyme', 'dried thyme', 'ground thyme'],
      exactMatches: ['thyme', 'dried thyme'],
      excludeKeywords: ['fresh']
    },
    {
      displayName: 'Bay Leaves',
      category: 'PANTRY',
      keywords: ['bay leaf', 'bay leaves', 'dried bay leaves'],
      exactMatches: ['bay leaves', 'bay leaf']
    },
    {
      displayName: 'Baking Soda',
      category: 'PANTRY',
      keywords: ['baking soda', 'sodium bicarbonate'],
      exactMatches: ['baking soda']
    },
    {
      displayName: 'Baking Powder',
      category: 'PANTRY',
      keywords: ['baking powder'],
      exactMatches: ['baking powder']
    },
    {
      displayName: 'Vanilla Extract',
      category: 'PANTRY',
      keywords: ['vanilla extract', 'pure vanilla extract', 'vanilla'],
      exactMatches: ['vanilla extract', 'pure vanilla extract']
    },
    {
      displayName: 'Soy Sauce',
      category: 'PANTRY',
      keywords: ['soy sauce', 'low sodium soy sauce'],
      exactMatches: ['soy sauce', 'low sodium soy sauce']
    },
    {
      displayName: 'Hot Sauce',
      category: 'PANTRY',
      keywords: ['hot sauce', 'tabasco', 'sriracha'],
      exactMatches: ['hot sauce', 'tabasco sauce', 'sriracha']
    },
    {
      displayName: 'Vinegar',
      category: 'PANTRY',
      keywords: ['vinegar', 'white vinegar', 'apple cider vinegar', 'balsamic vinegar'],
      exactMatches: ['white vinegar', 'apple cider vinegar', 'balsamic vinegar']
    },
    {
      displayName: 'Sugar',
      category: 'PANTRY',
      keywords: ['sugar', 'white sugar', 'granulated sugar', 'cane sugar'],
      exactMatches: ['sugar', 'white sugar', 'granulated sugar']
    },
    {
      displayName: 'Brown Sugar',
      category: 'PANTRY',
      keywords: ['brown sugar', 'light brown sugar', 'dark brown sugar'],
      exactMatches: ['brown sugar', 'light brown sugar', 'dark brown sugar']
    },
    {
      displayName: 'Maple Syrup',
      category: 'PANTRY',
      keywords: ['maple syrup', 'pure maple syrup', 'pancake syrup'],
      exactMatches: ['maple syrup', 'pure maple syrup', 'pancake syrup']
    },
    {
      displayName: 'Honey',
      category: 'PANTRY',
      keywords: ['honey', 'raw honey', 'wildflower honey'],
      exactMatches: ['honey', 'raw honey']
    },

    // CANNED & JARRED
    {
      displayName: 'Canned Tomatoes',
      category: 'CANNED_JARRED',
      keywords: ['canned tomato', 'canned tomatoes', 'can tomato', 'diced tomatoes', 'crushed tomatoes', 'whole tomatoes'],
      exactMatches: ['canned diced tomatoes', 'canned crushed tomatoes', 'can diced tomatoes']
    },
    {
      displayName: 'Tomato Paste',
      category: 'CANNED_JARRED',
      keywords: ['tomato paste', 'can tomato paste'],
      exactMatches: ['tomato paste', 'can tomato paste']
    },
    {
      displayName: 'Tomato Sauce',
      category: 'CANNED_JARRED',
      keywords: ['tomato sauce', 'marinara sauce', 'pasta sauce'],
      exactMatches: ['tomato sauce', 'marinara sauce', 'jar pasta sauce']
    },
    {
      displayName: 'Canned Beans',
      category: 'CANNED_JARRED',
      keywords: ['canned beans', 'black beans', 'kidney beans', 'chickpeas', 'garbanzo beans', 'pinto beans'],
      exactMatches: ['canned black beans', 'canned kidney beans', 'canned chickpeas']
    },
    {
      displayName: 'Chicken Broth',
      category: 'CANNED_JARRED',
      keywords: ['chicken broth', 'chicken stock', 'low sodium chicken broth'],
      exactMatches: ['chicken broth', 'low sodium chicken broth', 'chicken stock']
    },
    {
      displayName: 'Vegetable Broth',
      category: 'CANNED_JARRED',
      keywords: ['vegetable broth', 'vegetable stock'],
      exactMatches: ['vegetable broth', 'vegetable stock']
    },
    {
      displayName: 'Coconut Milk',
      category: 'CANNED_JARRED',
      keywords: ['coconut milk', 'canned coconut milk', 'full fat coconut milk'],
      exactMatches: ['coconut milk', 'canned coconut milk']
    },

    // FROZEN
    {
      displayName: 'Frozen Vegetables',
      category: 'FROZEN',
      keywords: ['frozen vegetables', 'frozen peas', 'frozen corn', 'frozen broccoli', 'frozen spinach'],
      exactMatches: ['frozen mixed vegetables', 'frozen peas', 'frozen corn']
    },
    {
      displayName: 'Frozen Berries',
      category: 'FROZEN',
      keywords: ['frozen berries', 'frozen strawberries', 'frozen blueberries', 'frozen raspberries'],
      exactMatches: ['frozen strawberries', 'frozen blueberries', 'frozen mixed berries']
    },
    {
      displayName: 'Ice Cream',
      category: 'FROZEN',
      keywords: ['ice cream', 'vanilla ice cream', 'chocolate ice cream'],
      exactMatches: ['ice cream', 'vanilla ice cream']
    },
    {
      displayName: 'Frozen Shrimp',
      category: 'FROZEN',
      keywords: ['frozen shrimp'],
      exactMatches: ['frozen shrimp', 'frozen cooked shrimp']
    },

    // BAKERY
    {
      displayName: 'Bread',
      category: 'BAKERY',
      keywords: ['bread', 'white bread', 'wheat bread', 'whole grain bread', 'sourdough'],
      exactMatches: ['bread', 'white bread', 'wheat bread', 'sourdough bread']
    },
    {
      displayName: 'Bagels',
      category: 'BAKERY',
      keywords: ['bagel', 'bagels', 'everything bagel'],
      exactMatches: ['bagels', 'everything bagels']
    },
    {
      displayName: 'Tortillas',
      category: 'BAKERY',
      keywords: ['tortilla', 'tortillas', 'flour tortilla', 'corn tortilla'],
      exactMatches: ['flour tortillas', 'corn tortillas']
    },
    {
      displayName: 'Pita Bread',
      category: 'BAKERY',
      keywords: ['pita', 'pita bread', 'pita pocket'],
      exactMatches: ['pita bread', 'pita pockets']
    },

    // GRAINS & PASTA
    {
      displayName: 'Rice',
      category: 'GRAINS_PASTA',
      keywords: ['rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice'],
      exactMatches: ['white rice', 'brown rice', 'jasmine rice']
    },
    {
      displayName: 'Pasta',
      category: 'GRAINS_PASTA',
      keywords: ['pasta', 'spaghetti', 'penne', 'rigatoni', 'fettuccine', 'linguine'],
      exactMatches: ['spaghetti', 'penne pasta', 'rigatoni']
    },
    {
      displayName: 'Quinoa',
      category: 'GRAINS_PASTA',
      keywords: ['quinoa', 'tri-color quinoa'],
      exactMatches: ['quinoa', 'tri-color quinoa']
    },
    {
      displayName: 'Oats',
      category: 'GRAINS_PASTA',
      keywords: ['oats', 'rolled oats', 'old fashioned oats', 'quick oats'],
      exactMatches: ['rolled oats', 'old fashioned oats']
    },
    {
      displayName: 'Flour',
      category: 'GRAINS_PASTA',
      keywords: ['flour', 'all purpose flour', 'whole wheat flour', 'bread flour'],
      exactMatches: ['all purpose flour', 'whole wheat flour']
    },

    // SNACKS & BEVERAGES
    {
      displayName: 'Coffee',
      category: 'SNACKS_BEVERAGES',
      keywords: ['coffee', 'ground coffee', 'coffee beans', 'instant coffee'],
      exactMatches: ['ground coffee', 'coffee beans']
    },
    {
      displayName: 'Tea',
      category: 'SNACKS_BEVERAGES',
      keywords: ['tea', 'black tea', 'green tea', 'herbal tea'],
      exactMatches: ['black tea', 'green tea', 'tea bags']
    },
    {
      displayName: 'Nuts',
      category: 'SNACKS_BEVERAGES',
      keywords: ['nuts', 'almonds', 'walnuts', 'cashews', 'peanuts', 'mixed nuts'],
      exactMatches: ['almonds', 'walnuts', 'cashews', 'mixed nuts']
    },
    {
      displayName: 'Seeds',
      category: 'SNACKS_BEVERAGES',
      keywords: ['seeds', 'sunflower seeds', 'pumpkin seeds', 'sesame seeds', 'chia seeds'],
      exactMatches: ['sesame seeds', 'sunflower seeds', 'chia seeds']
    }
  ]

  // Basic term patterns for quick matching
  private basicPatterns = [
    { keywords: ['can ', 'canned ', 'tinned '], category: 'CANNED_JARRED', confidence: 0.8 },
    { keywords: ['frozen ', 'freeze '], category: 'FROZEN', confidence: 0.9 },
    { keywords: ['ground ', 'dried '], category: 'PANTRY', confidence: 0.7 },
    { keywords: ['fresh '], category: 'PRODUCE', confidence: 0.6 },
    { keywords: ['jar ', 'jarred '], category: 'CANNED_JARRED', confidence: 0.8 }
  ]

  /**
   * Categorize an ingredient and provide a display name
   */
  categorizeIngredient(ingredientText: string): CategorizedIngredient {
    const originalText = ingredientText.trim()
    const lowerText = originalText.toLowerCase()

    // Try exact ingredient mappings first
    const exactMatch = this.findExactMatch(lowerText)
    if (exactMatch) {
      return {
        originalText,
        displayName: exactMatch.displayName,
        category: INGREDIENT_CATEGORIES[exactMatch.category],
        confidence: 1.0
      }
    }

    // Try keyword-based matching
    const keywordMatch = this.findKeywordMatch(lowerText)
    if (keywordMatch) {
      return {
        originalText,
        displayName: keywordMatch.displayName,
        category: INGREDIENT_CATEGORIES[keywordMatch.category],
        confidence: 0.8
      }
    }

    // Try basic patterns (can, frozen, etc.)
    const patternMatch = this.findPatternMatch(lowerText)
    if (patternMatch) {
      // Extract the main ingredient name after removing pattern words
      let cleanedName = lowerText
      for (const keyword of patternMatch.keywords) {
        cleanedName = cleanedName.replace(keyword.trim(), ' ').trim()
      }
      // Remove extra spaces
      cleanedName = cleanedName.replace(/\s+/g, ' ')

      return {
        originalText,
        displayName: this.capitalizeWords(cleanedName),
        category: INGREDIENT_CATEGORIES[patternMatch.category],
        confidence: patternMatch.confidence
      }
    }

    // Use parsing to help categorize based on quantity/unit context
    const contextMatch = this.categorizeByContext(originalText)
    if (contextMatch) {
      return contextMatch
    }

    // Fallback to OTHER category
    return {
      originalText,
      displayName: this.capitalizeWords(originalText),
      category: INGREDIENT_CATEGORIES.OTHER,
      confidence: 0.1
    }
  }

  private findExactMatch(lowerText: string): IngredientMapping | null {
    return this.ingredientMappings.find(mapping => {
      if (mapping.exactMatches) {
        return mapping.exactMatches.some(exact => lowerText === exact.toLowerCase())
      }
      return false
    }) || null
  }

  private findKeywordMatch(lowerText: string): IngredientMapping | null {
    for (const mapping of this.ingredientMappings) {
      // Check if any exclude keywords are present
      if (mapping.excludeKeywords &&
          mapping.excludeKeywords.some(exclude => lowerText.includes(exclude.toLowerCase()))) {
        continue
      }

      // Check if any keywords match
      if (mapping.keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))) {
        return mapping
      }
    }
    return null
  }

  private findPatternMatch(lowerText: string): { keywords: string[], category: string, confidence: number } | null {
    for (const pattern of this.basicPatterns) {
      if (pattern.keywords.some(keyword => lowerText.includes(keyword))) {
        return pattern
      }
    }
    return null
  }

  private categorizeByContext(originalText: string): CategorizedIngredient | null {
    try {
      const parsed = ingredientParser.parseIngredient(originalText)
      if (parsed.length === 0) return null

      const ingredient = parsed[0]
      const description = ingredient.description.toLowerCase()
      const unit = ingredient.unitOfMeasure?.toLowerCase() || ''

      // Use unit context to help categorization
      if (unit.includes('bunch') || unit.includes('head')) {
        return {
          originalText,
          displayName: this.capitalizeWords(ingredient.description),
          category: INGREDIENT_CATEGORIES.PRODUCE,
          confidence: 0.7
        }
      }

      if (unit.includes('lb') || unit.includes('pound') || unit.includes('oz') || unit.includes('ounce')) {
        // Could be meat if substantial weight
        if (ingredient.quantity && ingredient.quantity > 0.5) {
          return {
            originalText,
            displayName: this.capitalizeWords(ingredient.description),
            category: INGREDIENT_CATEGORIES.MEAT_SEAFOOD,
            confidence: 0.6
          }
        }
      }

    } catch (error) {
      // Parsing failed, continue to fallback
    }

    return null
  }

  private capitalizeWords(text: string): string {
    return text.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Get all categories sorted by sort order
   */
  getAllCategories(): IngredientCategory[] {
    return Object.values(INGREDIENT_CATEGORIES).sort((a, b) => a.sortOrder - b.sortOrder)
  }

  /**
   * Get category by ID
   */
  getCategoryById(id: string): IngredientCategory | null {
    return INGREDIENT_CATEGORIES[id] || null
  }
}

// Export singleton instance
export const ingredientCategorizer = new IngredientCategorizer()