import { Database } from '../models/database'

describe('Database Tests', () => {
  let db: Database

  beforeEach(async () => {
    db = Database.getInstance()
    await db.initialize(':memory:')
  })

  afterEach(async () => {
    await db.close()
  })

  describe('Connection', () => {
    it('should connect to database successfully', async () => {
      // Database is already initialized in beforeEach, so if we get here, it worked
      expect(db).toBeDefined()
    })

    it('should create recipes table', async () => {
      // Verify table exists by trying to query it
      const result = await db.all('SELECT name FROM sqlite_master WHERE type="table" AND name="recipes"')
      expect(result).toHaveLength(1)
    })
  })

  describe('Basic Operations', () => {
    it('should insert and retrieve a recipe', async () => {
      const testRecipe = {
        id: 'test-id',
        name: 'Test Recipe',
        description: 'Test Description',
        prep_time_minutes: 30,
        servings: 4,
        ingredients: JSON.stringify(['1 cup flour', '2 eggs']),
        instructions: JSON.stringify(['Mix ingredients', 'Bake for 30 minutes']),
        image: null,
        is_public: 1,
        user_id: null,
        household_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await db.run(`
        INSERT INTO recipes (
          id, name, description, prep_time_minutes, servings,
          ingredients, instructions, image, is_public, user_id, household_id,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        testRecipe.id, testRecipe.name, testRecipe.description,
        testRecipe.prep_time_minutes, testRecipe.servings,
        testRecipe.ingredients, testRecipe.instructions,
        testRecipe.image, testRecipe.is_public, testRecipe.user_id,
        testRecipe.household_id, testRecipe.created_at, testRecipe.updated_at
      ])

      const result = await db.get('SELECT * FROM recipes WHERE id = $1', [testRecipe.id])
      expect(result).toEqual(testRecipe)
    })

    it('should update a recipe', async () => {
      const recipeId = 'test-update-id'

      // Insert initial recipe
      await db.run(`
        INSERT INTO recipes (
          id, name, description, prep_time_minutes, servings,
          ingredients, instructions, is_public, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        recipeId, 'Original Name', 'Original Description', 20, 2,
        JSON.stringify(['ingredient 1']), JSON.stringify(['step 1']),
        1, new Date().toISOString(), new Date().toISOString()
      ])

      // Update recipe
      const newName = 'Updated Name'
      await db.run('UPDATE recipes SET name = $1 WHERE id = $2', [newName, recipeId])

      const result = await db.get('SELECT name FROM recipes WHERE id = $1', [recipeId])
      expect(result).toEqual({ name: newName })
    })

    it('should delete a recipe', async () => {
      const recipeId = 'test-delete-id'

      // Insert recipe
      await db.run(`
        INSERT INTO recipes (
          id, name, description, prep_time_minutes, servings,
          ingredients, instructions, is_public, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        recipeId, 'To Delete', 'Description', 15, 1,
        JSON.stringify(['ingredient']), JSON.stringify(['step']),
        1, new Date().toISOString(), new Date().toISOString()
      ])

      // Delete recipe
      await db.run('DELETE FROM recipes WHERE id = $1', [recipeId])

      const result = await db.get('SELECT * FROM recipes WHERE id = $1', [recipeId])
      expect(result).toBeUndefined()
    })
  })

  describe('Schema Validation', () => {
    it('should have all required columns following schema.org/Recipe standard', async () => {
      const tableInfo = await db.all('PRAGMA table_info(recipes)')
      const columnNames = tableInfo.map((col: any) => col.name)

      // Core recipe fields (following schema.org/Recipe)
      expect(columnNames).toContain('id')
      expect(columnNames).toContain('name')
      expect(columnNames).toContain('description')
      expect(columnNames).toContain('prep_time_minutes')
      expect(columnNames).toContain('servings')
      expect(columnNames).toContain('ingredients')
      expect(columnNames).toContain('instructions')
      expect(columnNames).toContain('image')

      // Additional fields
      expect(columnNames).toContain('is_public')

      // Future-ready fields for user/household support
      expect(columnNames).toContain('user_id')
      expect(columnNames).toContain('household_id')
      expect(columnNames).toContain('created_at')
      expect(columnNames).toContain('updated_at')
    })

    it('should enforce NOT NULL constraints on required fields', async () => {
      // Try to insert recipe with missing required field
      await expect(
        db.run(`
          INSERT INTO recipes (id, description, prep_time_minutes, servings, ingredients, instructions)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['test-id', 'Description', 30, 4, '[]', '[]'])
      ).rejects.toThrow()
    })
  })
})