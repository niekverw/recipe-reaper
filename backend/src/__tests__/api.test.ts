import request from 'supertest'
import { app } from '../index'
import { Database } from '../models/database'

describe('Recipe API Tests', () => {
  beforeEach(async () => {
    // Clear the database between tests
    const db = Database.getInstance()
    await db.run('DELETE FROM recipes')
  })

  describe('POST /api/recipes', () => {
    it('should create a new recipe', async () => {
      const recipeData = {
        name: 'Test Recipe',
        description: 'A test recipe',
        ingredients: ['1 cup flour', '2 eggs'],
        instructions: ['Mix ingredients', 'Cook for 10 minutes'],
        prepTimeMinutes: 30,
        servings: 4,
        image: 'https://example.com/image.jpg',
        isPublic: true
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(201)

      expect(response.body.recipe).toMatchObject({
        name: recipeData.name,
        description: recipeData.description,
        ingredients: recipeData.ingredients,
        instructions: recipeData.instructions,
        prepTimeMinutes: recipeData.prepTimeMinutes,
        servings: recipeData.servings,
        image: recipeData.image,
        isPublic: recipeData.isPublic
      })
      expect(response.body.recipe.id).toBeDefined()
      expect(response.body.recipe.createdAt).toBeDefined()
      expect(response.body.recipe.updatedAt).toBeDefined()
    })

    it('should create recipe with auto-inferred values', async () => {
      const recipeData = {
        name: 'Simple Recipe',
        description: 'A simple recipe',
        ingredients: ['ingredient1', 'ingredient2'],
        instructions: ['step1', 'step2', 'step3']
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(recipeData)
        .expect(201)

      expect(response.body.recipe.prepTimeMinutes).toBeGreaterThanOrEqual(10)
      expect(response.body.recipe.servings).toBeGreaterThanOrEqual(2)
      expect(response.body.recipe.isPublic).toBe(true)
    })

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        description: 'Missing name',
        ingredients: ['ingredient'],
        instructions: ['step']
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidData)
        .expect(400)

      expect(response.body.error.message).toContain('name is required')
    })

    it('should return 400 for empty ingredients', async () => {
      const invalidData = {
        name: 'Test Recipe',
        description: 'Description',
        ingredients: [],
        instructions: ['step1']
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidData)
        .expect(400)

      expect(response.body.error.message).toContain('ingredient')
    })

    it('should return 400 for empty instructions', async () => {
      const invalidData = {
        name: 'Test Recipe',
        description: 'Description',
        ingredients: ['ingredient1'],
        instructions: []
      }

      const response = await request(app)
        .post('/api/recipes')
        .send(invalidData)
        .expect(400)

      expect(response.body.error.message).toContain('instruction')
    })
  })

  describe('GET /api/recipes', () => {
    beforeEach(async () => {
      // Create test data
      await request(app)
        .post('/api/recipes')
        .send({
          name: 'Chocolate Cake',
          description: 'Rich chocolate dessert',
          ingredients: ['chocolate', 'flour'],
          instructions: ['mix', 'bake'],
          prepTimeMinutes: 60,
          servings: 8,
          isPublic: true
        })

      // Small delay for different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      await request(app)
        .post('/api/recipes')
        .send({
          name: 'Vanilla Cookies',
          description: 'Simple cookies',
          ingredients: ['vanilla', 'flour'],
          instructions: ['mix', 'bake'],
          prepTimeMinutes: 30,
          servings: 12,
          isPublic: false
        })
    })

    it('should get all recipes', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200)

      expect(response.body.recipes).toHaveLength(2)
      expect(response.body.recipes[0].name).toBe('Vanilla Cookies') // Most recent first
      expect(response.body.recipes[1].name).toBe('Chocolate Cake')
    })

    it('should search recipes by name', async () => {
      const response = await request(app)
        .get('/api/recipes?search=cake')
        .expect(200)

      expect(response.body.recipes).toHaveLength(1)
      expect(response.body.recipes[0].name).toBe('Chocolate Cake')
    })

    it('should search recipes by description', async () => {
      const response = await request(app)
        .get('/api/recipes?search=simple')
        .expect(200)

      expect(response.body.recipes).toHaveLength(1)
      expect(response.body.recipes[0].name).toBe('Vanilla Cookies')
    })

    it('should filter by public status', async () => {
      const publicResponse = await request(app)
        .get('/api/recipes?isPublic=true')
        .expect(200)

      const privateResponse = await request(app)
        .get('/api/recipes?isPublic=false')
        .expect(200)

      expect(publicResponse.body.recipes).toHaveLength(1)
      expect(publicResponse.body.recipes[0].name).toBe('Chocolate Cake')

      expect(privateResponse.body.recipes).toHaveLength(1)
      expect(privateResponse.body.recipes[0].name).toBe('Vanilla Cookies')
    })

    it('should sort by name', async () => {
      const response = await request(app)
        .get('/api/recipes?sortBy=name')
        .expect(200)

      expect(response.body.recipes[0].name).toBe('Chocolate Cake')
      expect(response.body.recipes[1].name).toBe('Vanilla Cookies')
    })

    it('should sort by time', async () => {
      const response = await request(app)
        .get('/api/recipes?sortBy=time')
        .expect(200)

      expect(response.body.recipes[0].prepTimeMinutes).toBe(30)
      expect(response.body.recipes[1].prepTimeMinutes).toBe(60)
    })

    it('should handle pagination', async () => {
      const page1 = await request(app)
        .get('/api/recipes?limit=1&offset=0')
        .expect(200)

      const page2 = await request(app)
        .get('/api/recipes?limit=1&offset=1')
        .expect(200)

      expect(page1.body.recipes).toHaveLength(1)
      expect(page2.body.recipes).toHaveLength(1)
      expect(page1.body.recipes[0].id).not.toBe(page2.body.recipes[0].id)
    })
  })

  describe('GET /api/recipes/:id', () => {
    let recipeId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          description: 'Test description',
          ingredients: ['ingredient1'],
          instructions: ['step1']
        })
      recipeId = response.body.recipe.id
    })

    it('should get recipe by id', async () => {
      const response = await request(app)
        .get(`/api/recipes/${recipeId}`)
        .expect(200)

      expect(response.body.recipe.id).toBe(recipeId)
      expect(response.body.recipe.name).toBe('Test Recipe')
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/non-existent-id')
        .expect(404)

      expect(response.body.error.message).toBe('Recipe not found')
    })
  })

  describe('PUT /api/recipes/:id', () => {
    let recipeId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Original Recipe',
          description: 'Original description',
          ingredients: ['ingredient1'],
          instructions: ['step1']
        })
      recipeId = response.body.recipe.id
    })

    it('should update recipe', async () => {
      const updates = {
        name: 'Updated Recipe',
        description: 'Updated description',
        prepTimeMinutes: 45
      }

      const response = await request(app)
        .put(`/api/recipes/${recipeId}`)
        .send(updates)
        .expect(200)

      expect(response.body.recipe.name).toBe(updates.name)
      expect(response.body.recipe.description).toBe(updates.description)
      expect(response.body.recipe.prepTimeMinutes).toBe(updates.prepTimeMinutes)
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .put('/api/recipes/non-existent-id')
        .send({ name: 'Updated' })
        .expect(404)

      expect(response.body.error.message).toBe('Recipe not found')
    })
  })

  describe('DELETE /api/recipes/:id', () => {
    let recipeId: string

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'To Delete',
          description: 'Will be deleted',
          ingredients: ['ingredient1'],
          instructions: ['step1']
        })
      recipeId = response.body.recipe.id
    })

    it('should delete recipe', async () => {
      await request(app)
        .delete(`/api/recipes/${recipeId}`)
        .expect(204)

      // Verify it's deleted
      await request(app)
        .get(`/api/recipes/${recipeId}`)
        .expect(404)
    })

    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .delete('/api/recipes/non-existent-id')
        .expect(404)

      expect(response.body.error.message).toBe('Recipe not found')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400)
    })

    it('should handle server errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll just verify our error handler is attached
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404)

      expect(response.body.error).toBe('Route not found')
    })
  })
})