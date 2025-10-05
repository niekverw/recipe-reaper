# @ingredient-categorizer/core

Smart ingredient categorization library with 1800+ ingredient mappings for organizing grocery shopping lists.

**Bundle Size:** ~60KB minified (~20KB gzipped)

## Features

- 🎯 **1800+ Ingredient Mappings** - Comprehensive database of common ingredients
- 📦 **10 Grocery Categories** - Produce, Meat & Seafood, Dairy & Eggs, Pantry, Canned & Jarred, Frozen, Bakery, Grains & Pasta, Snacks & Beverages, Other
- 🔍 **Smart Matching** - Exact, whole-word, and partial matching with confidence scores
- 🏷️ **Display Names** - Normalized ingredient names for better UX
- 🚫 **Exclude Keywords** - Handles edge cases (e.g., "fresh tuna" vs "canned tuna")
- 🔄 **Pluralization** - Automatic singular/plural variant handling
- 📊 **Confidence Scores** - Know how certain the categorization is

## Installation

```bash
npm install @ingredient-categorizer/core
```

## Usage

### Basic Example

```typescript
import { ingredientCategorizer, INGREDIENT_CATEGORIES } from '@ingredient-categorizer/core'

// Categorize an ingredient
const result = ingredientCategorizer.categorizeIngredient('2 cups chopped tomato')

console.log(result)
// {
//   originalText: '2 cups chopped tomato',
//   displayName: 'Tomatoes',
//   category: {
//     id: 'PRODUCE',
//     name: 'Produce',
//     emoji: '🥬',
//     sortOrder: 1
//   },
//   confidence: 0.85
// }
```

### Get All Categories

```typescript
const categories = ingredientCategorizer.getAllCategories()
// Returns all 10 categories sorted by sortOrder
```

### Get Category by ID

```typescript
const produceCategory = ingredientCategorizer.getCategoryById('PRODUCE')
```

### Available Categories

```typescript
import { INGREDIENT_CATEGORIES } from '@ingredient-categorizer/core'

INGREDIENT_CATEGORIES.PRODUCE          // 🥬 Produce
INGREDIENT_CATEGORIES.MEAT_SEAFOOD     // 🥩 Meat & Seafood
INGREDIENT_CATEGORIES.DAIRY_EGGS       // 🥛 Dairy & Eggs
INGREDIENT_CATEGORIES.PANTRY           // 🥄 Pantry
INGREDIENT_CATEGORIES.CANNED_JARRED    // 🥫 Canned & Jarred
INGREDIENT_CATEGORIES.FROZEN           // 🧊 Frozen
INGREDIENT_CATEGORIES.BAKERY           // 🍞 Bakery
INGREDIENT_CATEGORIES.GRAINS_PASTA     // 🍝 Grains & Pasta
INGREDIENT_CATEGORIES.SNACKS_BEVERAGES // 🥤 Snacks & Beverages
INGREDIENT_CATEGORIES.OTHER            // 📦 Other
```

## How It Works

The categorizer uses a sophisticated matching algorithm:

1. **Exact Match** (confidence: 1.0) - Input exactly matches a keyword
2. **Whole Word Match** (confidence: 0.85) - Keyword found as complete word
3. **Partial Match** (confidence: 0.6) - Keyword found within the text
4. **Pattern Heuristics** (confidence: varies) - Keywords like "frozen", "canned", "jarred" trigger category-specific handling
5. **Fallback** (confidence: 0.1) - Unknown ingredients go to OTHER category

### Examples

```typescript
// Exact match
ingredientCategorizer.categorizeIngredient('arborio')
// → Rice, GRAINS_PASTA, confidence: 1.0

// Whole word match with quantity
ingredientCategorizer.categorizeIngredient('2 cups chopped tomato')
// → Tomatoes, PRODUCE, confidence: 0.85

// Pattern heuristic
ingredientCategorizer.categorizeIngredient('frozen mystery meal')
// → Mystery Meal, FROZEN, confidence: 0.9

// Exclude keyword handling
ingredientCategorizer.categorizeIngredient('canned tuna')
// → Canned Tuna, CANNED_JARRED (not MEAT_SEAFOOD due to "canned")
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  CategorizedIngredient,
  IngredientCategory,
  IngredientMapping
} from '@ingredient-categorizer/core'
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run lint
```

## License

MIT

## Contributing

Contributions welcome! This package is part of a larger recipe management application and is designed to be detachable as a standalone library.

### Adding Ingredients

To add new ingredient mappings, edit `src/data/ingredients.json`:

```json
{
  "displayName": "New Ingredient",
  "category": "PRODUCE",
  "keywords": ["keyword1", "keyword2"],
  "excludeKeywords": ["optional", "exclude", "words"]
}
```

Run tests to ensure data integrity:

```bash
npm test
```
