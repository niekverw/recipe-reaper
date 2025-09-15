import { recipeModel } from '../models/recipeModel'
import { CreateRecipeRequest, UpdateRecipeRequest } from '../types/recipe'
import { Database } from '../models/database'

describe('Recipe Model Tests', () => {
  beforeEach(async () => {
    // Clear the database between tests
    const db = Database.getInstance()
    await db.run('DELETE FROM recipes')
  })
  describe('CRUD Operations', () => {
    it('should create a recipe with all fields', async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Test Recipe',
        description: 'A delicious test recipe',
        prepTimeMinutes: 30,
        servings: 4,
        ingredients: ['2 cups flour', '1 tsp salt', '1 cup water'],
        instructions: ['Mix dry ingredients', 'Add water slowly', 'Knead dough'],
        image: 'https://example.com/image.jpg',
        isPublic: true
      }

      const recipe = await recipeModel.create(recipeData)

      expect(recipe).toMatchObject({
        name: recipeData.name,
        description: recipeData.description,
        prepTimeMinutes: recipeData.prepTimeMinutes,
        servings: recipeData.servings,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        image: recipeData.image,
        isPublic: recipeData.isPublic
      })
      expect(recipe.id).toBeDefined()
      expect(recipe.createdAt).toBeDefined()
      expect(recipe.updatedAt).toBeDefined()
    })

    it('should create a recipe with auto-inferred values', async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Simple Recipe',
        description: 'A simple recipe without explicit time/servings',
        ingredients: ['1 cup ingredient1', '2 cups ingredient2'],
        instructions: ['Step 1', 'Step 2', 'Step 3', 'Step 4']
      }

      const recipe = await recipeModel.create(recipeData)

      expect(recipe.prepTimeMinutes).toBeGreaterThanOrEqual(10) // Minimum 10 minutes
      expect(recipe.servings).toBeGreaterThanOrEqual(2) // Minimum 2 servings
      expect(recipe.isPublic).toBe(true) // Default to public
    })

    it('should find all recipes', async () => {
      // Create test recipes
      await recipeModel.create({
        name: 'Recipe 1',
        description: 'First recipe',
        ingredients: ['ingredient1'],
        instructions: ['step1']
      })

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      await recipeModel.create({
        name: 'Recipe 2',
        description: 'Second recipe',
        ingredients: ['ingredient2'],
        instructions: ['step2']
      })

      const recipes = await recipeModel.findAll()
      expect(recipes).toHaveLength(2)
      expect(recipes[0].name).toBe('Recipe 2') // Most recent first (default sort)
      expect(recipes[1].name).toBe('Recipe 1')
    })

    it('should find recipe by id', async () => {
      const createdRecipe = await recipeModel.create({
        name: 'Find Me',
        description: 'Recipe to find',
        ingredients: ['test ingredient'],
        instructions: ['test step']
      })

      const foundRecipe = await recipeModel.findById(createdRecipe.id)
      expect(foundRecipe).toEqual(createdRecipe)
    })

    it('should return null for non-existent recipe', async () => {
      const recipe = await recipeModel.findById('non-existent-id')
      expect(recipe).toBeNull()
    })

    it('should update a recipe', async () => {
      const originalRecipe = await recipeModel.create({
        name: 'Original Name',
        description: 'Original description',
        ingredients: ['original ingredient'],
        instructions: ['original step']
      })

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      const updates: UpdateRecipeRequest = {
        name: 'Updated Name',
        description: 'Updated description',
        prepTimeMinutes: 45
      }

      const updatedRecipe = await recipeModel.update(originalRecipe.id, updates)

      expect(updatedRecipe.name).toBe(updates.name)
      expect(updatedRecipe.description).toBe(updates.description)
      expect(updatedRecipe.prepTimeMinutes).toBe(updates.prepTimeMinutes)
      expect(updatedRecipe.ingredients).toEqual(originalRecipe.ingredients) // Unchanged
      expect(new Date(updatedRecipe.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalRecipe.updatedAt).getTime()
      )
    })

    it('should delete a recipe', async () => {
      const recipe = await recipeModel.create({
        name: 'To Be Deleted',
        description: 'This will be deleted',
        ingredients: ['ingredient'],
        instructions: ['step']
      })

      await recipeModel.delete(recipe.id)

      const deletedRecipe = await recipeModel.findById(recipe.id)
      expect(deletedRecipe).toBeNull()
    })
  })

  describe('Filtering and Sorting', () => {
    beforeEach(async () => {
      // Clear existing data first
      const db = Database.getInstance()
      await db.run('DELETE FROM recipes')

      // Create test data
      await recipeModel.create({
        name: 'Chocolate Cake',
        description: 'Rich chocolate dessert',
        prepTimeMinutes: 60,
        servings: 8,
        ingredients: ['chocolate', 'flour'],
        instructions: ['mix', 'bake'],
        isPublic: true
      })

      await recipeModel.create({
        name: 'Vanilla Cookies',
        description: 'Simple vanilla cookies',
        prepTimeMinutes: 30,
        servings: 12,
        ingredients: ['vanilla', 'flour'],
        instructions: ['mix', 'bake', 'cool'],
        isPublic: false
      })

      await recipeModel.create({
        name: 'Apple Pie',
        description: 'Classic apple pie recipe',
        prepTimeMinutes: 90,
        servings: 6,
        ingredients: ['apples', 'flour', 'sugar'],
        instructions: ['prepare', 'fill', 'bake', 'cool'],
        isPublic: true
      })
    })

    it('should search recipes by name', async () => {
      const results = await recipeModel.findAll({ search: 'cake' })
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Chocolate Cake')
    })

    it('should search recipes by description', async () => {
      const results = await recipeModel.findAll({ search: 'simple' })
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Vanilla Cookies')
    })

    it('should filter by public status', async () => {
      const publicRecipes = await recipeModel.findAll({ isPublic: true })
      const privateRecipes = await recipeModel.findAll({ isPublic: false })

      expect(publicRecipes).toHaveLength(2)
      expect(privateRecipes).toHaveLength(1)
      expect(privateRecipes[0].name).toBe('Vanilla Cookies')
    })

    it('should sort by name', async () => {
      const results = await recipeModel.findAll({ sortBy: 'name' })
      expect(results[0].name).toBe('Apple Pie')
      expect(results[1].name).toBe('Chocolate Cake')
      expect(results[2].name).toBe('Vanilla Cookies')
    })

    it('should sort by prep time', async () => {
      const results = await recipeModel.findAll({ sortBy: 'time' })
      expect(results[0].prepTimeMinutes).toBe(30)
      expect(results[1].prepTimeMinutes).toBe(60)
      expect(results[2].prepTimeMinutes).toBe(90)
    })

    it('should sort by servings', async () => {
      const results = await recipeModel.findAll({ sortBy: 'servings' })
      expect(results[0].servings).toBe(6)
      expect(results[1].servings).toBe(8)
      expect(results[2].servings).toBe(12)
    })

    it('should handle pagination', async () => {
      const page1 = await recipeModel.findAll({ limit: 2, offset: 0 })
      const page2 = await recipeModel.findAll({ limit: 2, offset: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      expect(page1[0].id).not.toBe(page2[0].id)
    })
  })

  describe('Auto-inference', () => {
    it('should infer prep time based on instruction count', async () => {
      const shortRecipe = await recipeModel.create({
        name: 'Short Recipe',
        description: 'Quick recipe',
        ingredients: ['ingredient'],
        instructions: ['step1']
      })

      const longRecipe = await recipeModel.create({
        name: 'Long Recipe',
        description: 'Complex recipe',
        ingredients: ['ingredient'],
        instructions: ['step1', 'step2', 'step3', 'step4', 'step5', 'step6']
      })

      expect(shortRecipe.prepTimeMinutes).toBe(10) // Minimum
      expect(longRecipe.prepTimeMinutes).toBe(30) // 6 steps * 5 minutes
    })

    it('should infer servings based on ingredient quantities', async () => {
      const smallBatch = await recipeModel.create({
        name: 'Small Batch',
        description: 'Small recipe',
        ingredients: ['1/2 cup flour'],
        instructions: ['mix']
      })

      const largeBatch = await recipeModel.create({
        name: 'Large Batch',
        description: 'Large recipe',
        ingredients: ['4 cups flour', '2 pounds butter'],
        instructions: ['mix']
      })

      expect(smallBatch.servings).toBeGreaterThanOrEqual(2)
      expect(largeBatch.servings).toBeGreaterThan(smallBatch.servings)
    })
  })
})