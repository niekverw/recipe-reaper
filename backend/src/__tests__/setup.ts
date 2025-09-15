// Test setup file
import { Database } from '../models/database'

beforeAll(async () => {
  // Use in-memory database for tests
  process.env.NODE_ENV = 'test'
  const db = Database.getInstance()
  await db.initialize(':memory:')
})

afterAll(async () => {
  const db = Database.getInstance()
  await db.close()
})