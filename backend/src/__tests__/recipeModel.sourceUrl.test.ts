import { Database } from '../models/database'
import { recipeModel } from '../models/recipeModel'
import { CreateRecipeRequest, UpdateRecipeRequest } from '../types/recipe'

describe('Recipe Model - Source URL Support', () => {
  beforeAll(async () => {
    await Database.getInstance().initialize(':memory:')
  })

  afterAll(async () => {
    await Database.getInstance().close()
  })

  afterEach(async () => {
    // Clean up recipes after each test
    const db = Database.getInstance()
    await db.run('DELETE FROM recipes')
  })

  describe('Database Schema', () => {
    it('should have source_url column in recipes table', async () => {
      const db = Database.getInstance()
      const tableInfo = await db.all<{name: string, type: string}>('PRAGMA table_info(recipes)')

      const sourceUrlColumn = tableInfo.find((col) => col.name === 'source_url')
      expect(sourceUrlColumn).toBeDefined()
      expect(sourceUrlColumn?.type).toBe('TEXT')
    })
  })

  describe('Recipe Creation with Source URL', () => {
    it('should create recipe with source URL', async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['1 cup flour'],
        instructions: ['Mix ingredients'],
        sourceUrl: 'https://example.com/recipe'
      }

      const recipe = await recipeModel.create(recipeData)

      expect(recipe).toBeDefined()
      expect(recipe.sourceUrl).toBe('https://example.com/recipe')
      expect(recipe.name).toBe('Test Recipe')
    })

    it('should create recipe without source URL', async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['1 cup flour'],
        instructions: ['Mix ingredients']
      }

      const recipe = await recipeModel.create(recipeData)

      expect(recipe).toBeDefined()
      expect(recipe.sourceUrl).toBeUndefined()
      expect(recipe.name).toBe('Test Recipe')
    })

    it('should handle null source URL gracefully', async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['1 cup flour'],
        instructions: ['Mix ingredients'],
        sourceUrl: undefined
      }

      const recipe = await recipeModel.create(recipeData)

      expect(recipe).toBeDefined()
      expect(recipe.sourceUrl).toBeUndefined()
    })
  })

  describe('Recipe Updates with Source URL', () => {
    let createdRecipe: any

    beforeEach(async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Original Recipe',
        description: 'Original description',
        ingredients: ['1 cup flour'],
        instructions: ['Mix ingredients']
      }
      createdRecipe = await recipeModel.create(recipeData)
    })

    it('should update recipe to add source URL', async () => {
      const updates: UpdateRecipeRequest = {
        sourceUrl: 'https://example.com/new-recipe'
      }

      const updatedRecipe = await recipeModel.update(createdRecipe.id, updates)

      expect(updatedRecipe.sourceUrl).toBe('https://example.com/new-recipe')
      expect(updatedRecipe.name).toBe('Original Recipe') // Other fields unchanged
    })

    it('should update recipe to remove source URL', async () => {
      // First add a source URL
      await recipeModel.update(createdRecipe.id, { sourceUrl: 'https://example.com/recipe' })

      // Then remove it by setting to empty string (which gets converted to null/undefined)
      const updates: UpdateRecipeRequest = {
        sourceUrl: ''
      }

      const updatedRecipe = await recipeModel.update(createdRecipe.id, updates)

      expect(updatedRecipe.sourceUrl).toBeUndefined()
    })

    it('should update recipe with new source URL', async () => {
      // First add a source URL
      await recipeModel.update(createdRecipe.id, { sourceUrl: 'https://example.com/old-recipe' })

      // Then update it
      const updates: UpdateRecipeRequest = {
        sourceUrl: 'https://example.com/new-recipe'
      }

      const updatedRecipe = await recipeModel.update(createdRecipe.id, updates)

      expect(updatedRecipe.sourceUrl).toBe('https://example.com/new-recipe')
    })
  })

  describe('Recipe Retrieval with Source URL', () => {
    it('should retrieve recipe with source URL', async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['1 cup flour'],
        instructions: ['Mix ingredients'],
        sourceUrl: 'https://example.com/recipe'
      }

      const createdRecipe = await recipeModel.create(recipeData)
      const retrievedRecipe = await recipeModel.findById(createdRecipe.id)

      expect(retrievedRecipe).toBeDefined()
      expect(retrievedRecipe!.sourceUrl).toBe('https://example.com/recipe')
    })

    it('should retrieve recipe without source URL', async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['1 cup flour'],
        instructions: ['Mix ingredients']
      }

      const createdRecipe = await recipeModel.create(recipeData)
      const retrievedRecipe = await recipeModel.findById(createdRecipe.id)

      expect(retrievedRecipe).toBeDefined()
      expect(retrievedRecipe!.sourceUrl).toBeUndefined()
    })

    it('should include source URL in findAll results', async () => {
      const recipe1Data: CreateRecipeRequest = {
        name: 'Recipe 1',
        description: 'First recipe',
        ingredients: ['ingredient 1'],
        instructions: ['instruction 1'],
        sourceUrl: 'https://example.com/recipe1'
      }

      const recipe2Data: CreateRecipeRequest = {
        name: 'Recipe 2',
        description: 'Second recipe',
        ingredients: ['ingredient 2'],
        instructions: ['instruction 2']
      }

      await recipeModel.create(recipe1Data)
      await recipeModel.create(recipe2Data)

      const recipes = await recipeModel.findAll()

      expect(recipes).toHaveLength(2)

      const recipeWithUrl = recipes.find(r => r.name === 'Recipe 1')
      const recipeWithoutUrl = recipes.find(r => r.name === 'Recipe 2')

      expect(recipeWithUrl!.sourceUrl).toBe('https://example.com/recipe1')
      expect(recipeWithoutUrl!.sourceUrl).toBeUndefined()
    })
  })

  describe('Data Type Validation', () => {
    it('should accept valid URLs', async () => {
      const validUrls = [
        'https://example.com/recipe',
        'http://test.com/recipe/123',
        'https://subdomain.example.com/path/to/recipe?param=value',
        'https://example.org/recipe#section'
      ]

      for (const url of validUrls) {
        const recipeData: CreateRecipeRequest = {
          name: `Recipe for ${url}`,
          description: 'Test recipe',
          ingredients: ['1 ingredient'],
          instructions: ['1 instruction'],
          sourceUrl: url
        }

        const recipe = await recipeModel.create(recipeData)
        expect(recipe.sourceUrl).toBe(url)
      }
    })

    it('should handle empty string as undefined', async () => {
      const recipeData: CreateRecipeRequest = {
        name: 'Test Recipe',
        description: 'Test description',
        ingredients: ['1 ingredient'],
        instructions: ['1 instruction'],
        sourceUrl: ''
      }

      const recipe = await recipeModel.create(recipeData)
      expect(recipe.sourceUrl).toBeUndefined()
    })
  })
})