/**
 * Utility functions for humorous messages related to Recipe Reaper
 */

const GENERAL_HUMOR = [
  '"The reaper of recipes, not souls... usually."',
  '"Making cooking less grim, one recipe at a time."',
  '"Reaping recipes, not regrets."',
  '🎵 Don’t fear the recipe reaper 🎵',
  '"The only thing we\'re killing is your hunger."'
] as const

const LOADING_HUMOR = [
  '"Raising your recipes from the dead..."',
  '"Summoning recipes from the digital ether..."',
  '"Consulting the culinary spirits..."',
  '🎵 Don’t fear the recipe reaper 🎵',
  '"Waking the kitchen ghosts..."',
  '"Just a moment, the cauldron is bubbling..."'
] as const

const SHOPPING_LIST_HUMOR = [
  '"Cooking with a side of existential dread."',
  '"Gathering souls... I mean, ingredients."',
  '"Your shopping list is looking grim. Let\'s fill it up!"',
  '"Are you feeding an army or just summoning something?"'
] as const

const SETTINGS_HUMOR = [
  '"Tending to the mortal coil... and your account settings."',
  '"Even reapers have paperwork. Manage your details here."',
  '"Configure your coven... I mean, household."',
  '"The Reaper\'s Ledger: Manage your profile, account, and household."'
] as const

const ALL_HUMOR = [...GENERAL_HUMOR, ...LOADING_HUMOR, ...SHOPPING_LIST_HUMOR, ...SETTINGS_HUMOR] as const

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
 * Get a random humorous sentence for the settings page
 */
export function getRandomSettingsHumor(): string {
  const randomIndex = Math.floor(Math.random() * SETTINGS_HUMOR.length)
  return SETTINGS_HUMOR[randomIndex]
}

/**
 * Get a random humorous sentence for general purposes
 */
export function getRandomGeneralHumor(): string {
  const randomIndex = Math.floor(Math.random() * GENERAL_HUMOR.length)
  return GENERAL_HUMOR[randomIndex]
}

/**
 * Get all humorous sentences
 */
export function getAllHumorousSentences(): readonly string[] {
  return ALL_HUMOR
}