# Removed Files and Code

This document tracks files and code that were removed from the repository as they were no longer needed.

## Files Removed

### Backend

1. **`backend/src/services/openaiService.ts`** (104 lines)
   - OpenAI-based recipe text parser service
   - Replaced by Gemini service (`geminiService.ts`) which provides the same functionality
   - Removed because: Out of OpenAI API credits, service was non-functional

2. **`backend/package.json`**
   - Removed dependency: `openai` package (^5.20.3)
   - No longer needed as OpenAI service was removed

### Frontend

3. **`frontend/src/services/api.ts`**
   - Removed method: `parseRecipeFromText()` (23 lines)
   - This method called the OpenAI-based backend endpoint
   - Replaced by: `parseRecipeFromTextGemini()` which is actively used

4. **`frontend/src/pages/RecipeFormPage.tsx`**
   - Removed commented-out button code (22 lines)
   - The "Parse with GPT-5-mini (not working)" button was commented out with note "Temporarily hidden - out of credits"
   - Updated `handleImportFromText()` and `handleImportText()` to use Gemini service instead of OpenAI

5. **`frontend/src/__tests__/RecipeFormPage.import.test.tsx`**
   - Removed mock for `parseRecipeFromText` from test setup
   - Test now only uses `parseRecipeFromTextGemini` mock

### Backend Routes and Controllers

6. **`backend/src/routes/recipes.ts`**
   - Removed route: `POST /api/recipes/parse-text` (2 lines)
   - This route was using the OpenAI service

7. **`backend/src/controllers/recipeController.ts`**
   - Removed import: `openaiService` (1 line)
   - Removed method: `parseTextRecipe()` (46 lines)
   - This controller method was calling the OpenAI service

8. **`backend/src/__tests__/recipeController.scrape.test.ts`**
   - Removed jest mock for `openaiService` (3 lines)
   - No longer needed as service is removed

### Documentation

9. **`packages/ingredient-categorizer/MIGRATION_SUMMARY.md`** (179 lines)
   - Migration documentation for the ingredient categorizer package
   - Removed because: Migration is complete, documentation no longer needed

10. **`packages/ingredient-categorizer/DETACH.md`** (188 lines)
    - Instructions for extracting the ingredient categorizer into a standalone repository
    - Removed because: Package is integrated into monorepo, no plans to detach

## Summary

- **Total lines removed**: ~592 lines
- **Files deleted**: 3 files
- **Files modified**: 7 files
- **Reason**: Consolidation to single AI service (Gemini), removal of non-functional OpenAI integration, cleanup of completed migration documentation

## Impact

- ✅ All frontend tests passing (33/33)
- ✅ Frontend builds successfully
- ✅ OpenAI API key no longer required for the application
- ✅ Reduced dependencies (removed `openai` package)
- ✅ Simplified codebase with single AI service implementation
- ⚠️  Backend tests have pre-existing issues with PostgreSQL connection and Gemini API key requirement (not related to these changes)

## Replacement Functionality

All removed OpenAI functionality has been replaced with equivalent Gemini-based functionality:

| Removed | Replacement |
|---------|-------------|
| `openaiService.parseRecipeText()` | `geminiService.parseRecipeText()` |
| `apiService.parseRecipeFromText()` | `apiService.parseRecipeFromTextGemini()` |
| `POST /api/recipes/parse-text` | `POST /api/recipes/parse-text-gemini` |
| `recipeController.parseTextRecipe()` | `recipeController.parseTextRecipeGemini()` |
