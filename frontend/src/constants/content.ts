/**
 * Centralized content and localization strings
 * This file contains all static text content used throughout the application
 * to facilitate easier internationalization and maintenance.
 */

export const CONTENT = {
  // RecipesPage
  recipes: {
    searchPlaceholder: 'Search recipes...',
    recipesLabel: 'recipes',
    noResultsTitle: "Even the Recipe Reaper can't find anything in this barren kitchen graveyard.",
    noResultsMessage: 'Try adjusting your search or add a new recipe to get started.',
  },
  
  // RecipeDetailPage
  recipeDetail: {
    recipeAdaptedFrom: 'Recipe adapted from',
    folderLabel: 'Folder:',
    noTags: 'None',
    addTagPlaceholder: 'Add tag...',
    addTagTitle: 'Add tag',
    removeTagTitle: 'Remove tag',
    viewRecipesWithTagTitle: 'View all recipes with this tag',
  },
  
  // Common labels
  common: {
    loading: 'Loading...',
    error: 'Error',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    copy: 'Copy',
  },
}
