// Test setup file
import { Database } from '../models/database'

beforeAll(async () => {
  // Use test PostgreSQL database for tests
  process.env.NODE_ENV = 'test'
  process.env.DB_NAME = 'recipeapp_test'
  const db = Database.getInstance()
  await db.initialize()
})

afterAll(async () => {
  const db = Database.getInstance()
  await db.close()
})