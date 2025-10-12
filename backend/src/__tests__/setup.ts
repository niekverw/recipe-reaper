// Test setup file
import { PostgreSQLDatabase } from '../models/database-pg'

// Track if database is available
let dbAvailable = false

beforeAll(async () => {
  // Use test PostgreSQL database for tests
  process.env.NODE_ENV = 'test'
  process.env.DB_NAME = 'recipeapp_test'
  
  try {
    const db = PostgreSQLDatabase.getInstance()
    await db.initialize()
    dbAvailable = true

    // Create a test household for API tests
    try {
      await db.run(`
        INSERT INTO households (id, name, invite_code, created_by)
        VALUES ('test-household-id', 'Test Household', 'test-code', 'test-user-id')
        ON CONFLICT (id) DO NOTHING
      `)
    } catch (error) {
      // Household might already exist, ignore
    }

    // Create a test user for API tests
    try {
      await db.run(`
        INSERT INTO users (id, email, password_hash, display_name, google_id, household_id)
        VALUES ('test-user-id', 'test@example.com', 'dummy-hash', 'Test User', 'test-google-id', 'test-household-id')
        ON CONFLICT (id) DO NOTHING
      `)
    } catch (error) {
      // User might already exist, ignore
    }
  } catch (error) {
    // Database not available - this is okay for unit tests
    console.warn('Database not available - skipping database setup')
    dbAvailable = false
  }
})

afterAll(async () => {
  if (dbAvailable) {
    const db = PostgreSQLDatabase.getInstance()
    await db.close()
  }
})