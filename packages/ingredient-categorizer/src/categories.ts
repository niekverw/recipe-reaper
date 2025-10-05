import { IngredientCategory } from './types'

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
  OTHER: {
    id: 'OTHER',
    name: 'Other',
    emoji: '📦',
    sortOrder: 10
  }
}
