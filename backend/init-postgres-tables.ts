import { Database } from './src/models/database'

async function initializeTables() {
  console.log('Initializing PostgreSQL tables...')

  try {
    const db = Database.getInstance()
    await db.initialize()
    console.log('PostgreSQL tables created successfully!')
    await db.close()
  } catch (error) {
    console.error('Failed to initialize tables:', error)
    process.exit(1)
  }
}

// Load environment variables
require('dotenv').config()

// Run initialization
initializeTables()