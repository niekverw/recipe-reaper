// Test setup file
import { PostgreSQLDatabase } from '../models/database-pg'

beforeAll(async () => {
  // Use test PostgreSQL database for tests
  process.env.NODE_ENV = 'test'
  process.env.DB_NAME = 'recipeapp_test'
  const db = PostgreSQLDatabase.getInstance()
  await db.initialize()
})

afterAll(async () => {
  const db = PostgreSQLDatabase.getInstance()
  await db.close()
})