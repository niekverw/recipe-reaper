/**
 * Utility functions for humorous messages related to Recipe Reaper
 */

const GENERAL_HUMOR = [
  '"The reaper of recipes, not souls... usually."',
  '"Making cooking less grim, one recipe at a time."',
  '"Reaping recipes, not regrets."',
  '" 🎵 Don’t fear the recipe reaper 🎵 "',
  '"No grave mistakes—just great recipes."',
  '"The only thing we\'re killing is your hunger."'
] as const

const LOADING_HUMOR = [
  '"Summoning recipes from the digital ether..."',
  '"Sharpening the scythe... for vegetables, of course."',
  '"Consulting the culinary spirits..."',
  '"Waking the kitchen ghosts..."',
  '"Just a moment, the cauldron is bubbling..."'
] as const

const SHOPPING_LIST_HUMOR = [
  '"Gathering souls... I mean, ingredients."',
  '"Your shopping list is looking grim. Let\'s fill it up!"',
  '"Time to harvest some fresh ingredients."'
] as const

const ALL_HUMOR = [...GENERAL_HUMOR, ...LOADING_HUMOR, ...SHOPPING_LIST_HUMOR] as const

/**
 * Get a random humorous sentence from all categories
 */
export function getRandomHumorousSentence(): string {
  const randomIndex = Math.floor(Math.random() * ALL_HUMOR.length)
  return ALL_HUMOR[randomIndex]
}

/**
 * Get a random humorous sentence for loading screens
 */
export function getRandomLoadingHumor(): string {
  const randomIndex = Math.floor(Math.random() * LOADING_HUMOR.length)
  return LOADING_HUMOR[randomIndex]
}

/**
 * Get a random humorous sentence for the shopping list
 */
export function getRandomShoppingListHumor(): string {
  const randomIndex = Math.floor(Math.random() * SHOPPING_LIST_HUMOR.length)
  return SHOPPING_LIST_HUMOR[randomIndex]
}

/**
 * Get all humorous sentences
 */
export function getAllHumorousSentences(): readonly string[] {
  return ALL_HUMOR
}