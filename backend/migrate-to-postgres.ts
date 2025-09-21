import sqlite3 from 'sqlite3'
import { Pool } from 'pg'
import { promises as fs } from 'fs'
import { join } from 'path'

interface User {
  id: string
  email: string
  password_hash: string
  display_name: string
  household_id?: string
  google_id?: string
  created_at: string
  updated_at: string
}

interface Household {
  id: string
  name: string
  invite_code?: string
  created_by: string
  created_at: string
}

interface Recipe {
  id: string
  name: string
  description: string
  prep_time_minutes: number
  cook_time_minutes?: number
  total_time_minutes?: number
  servings: number
  ingredients: string
  instructions: string
  image?: string
  source_url?: string
  is_public: boolean
  user_id?: string
  household_id?: string
  copied_from?: string
  ai_enhanced_notes?: string
  tags?: string
  created_at: string
  updated_at: string
}

async function migrateData() {
  console.log('Starting migration from SQLite to PostgreSQL...')

  // PostgreSQL connection
  const pgPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'recipeapp',
    user: process.env.DB_USER || 'recipeapp_user',
    password: process.env.DB_PASSWORD || 'recipeapp123',
  })

  // SQLite connections
  const sqliteDbPath = './data/recipes.db'
  const sqliteSessionsPath = './data/sessions.db'
  const sqliteDbExists = await fs.access(sqliteDbPath).then(() => true).catch(() => false)

  if (!sqliteDbExists) {
    console.log('No existing SQLite database found. Migration complete.')
    return
  }

  const sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY)

  try {
    // Test PostgreSQL connection
    const pgClient = await pgPool.connect()
    console.log('Connected to PostgreSQL')
    pgClient.release()

    // Migrate households first (due to foreign key constraints)
    console.log('Migrating households...')
    const households = await new Promise<Household[]>((resolve, reject) => {
      sqliteDb.all('SELECT * FROM households', (err, rows) => {
        if (err) reject(err)
        else resolve(rows as Household[])
      })
    })

    for (const household of households) {
      await pgPool.query(
        'INSERT INTO households (id, name, invite_code, created_by, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [household.id, household.name, household.invite_code, household.created_by, household.created_at]
      )
    }
    console.log(`Migrated ${households.length} households`)

    // Migrate users
    console.log('Migrating users...')
    const users = await new Promise<User[]>((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', (err, rows) => {
        if (err) reject(err)
        else resolve(rows as User[])
      })
    })

    for (const user of users) {
      await pgPool.query(
        'INSERT INTO users (id, email, password_hash, display_name, household_id, google_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
        [user.id, user.email, user.password_hash, user.display_name, user.household_id, user.google_id, user.created_at, user.updated_at]
      )
    }
    console.log(`Migrated ${users.length} users`)

    // Migrate recipes
    console.log('Migrating recipes...')
    const recipes = await new Promise<Recipe[]>((resolve, reject) => {
      sqliteDb.all('SELECT * FROM recipes', (err, rows) => {
        if (err) reject(err)
        else resolve(rows as Recipe[])
      })
    })

    for (const recipe of recipes) {
      await pgPool.query(
        `INSERT INTO recipes (id, name, description, prep_time_minutes, cook_time_minutes, total_time_minutes,
         servings, ingredients, instructions, image, source_url, is_public, user_id, household_id,
         copied_from, ai_enhanced_notes, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO NOTHING`,
        [
          recipe.id, recipe.name, recipe.description, recipe.prep_time_minutes, recipe.cook_time_minutes,
          recipe.total_time_minutes, recipe.servings, recipe.ingredients, recipe.instructions, recipe.image,
          recipe.source_url, recipe.is_public, recipe.user_id, recipe.household_id, recipe.copied_from,
          recipe.ai_enhanced_notes, recipe.tags, recipe.created_at, recipe.updated_at
        ]
      )
    }
    console.log(`Migrated ${recipes.length} recipes`)

    // Migrate sessions if they exist
    const sqliteSessionsExists = await fs.access(sqliteSessionsPath).then(() => true).catch(() => false)
    if (sqliteSessionsExists) {
      console.log('Migrating sessions...')
      const sqliteSessionsDb = new sqlite3.Database(sqliteSessionsPath, sqlite3.OPEN_READONLY)

      const sessions = await new Promise<any[]>((resolve, reject) => {
        sqliteSessionsDb.all('SELECT * FROM sessions', (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })

      for (const session of sessions) {
        await pgPool.query(
          'INSERT INTO sessions (sid, sess, expired) VALUES ($1, $2, $3) ON CONFLICT (sid) DO NOTHING',
          [session.sid, session.sess, session.expired]
        )
      }
      console.log(`Migrated ${sessions.length} sessions`)

      sqliteSessionsDb.close()
    }

    console.log('Migration completed successfully!')
    console.log('You can now start your application with PostgreSQL.')
    console.log('Remember to run the setup-postgres.sh script first if you haven\'t created the database user.')

  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    sqliteDb.close()
    await pgPool.end()
  }
}

// Load environment variables
require('dotenv').config()

// Run migration
migrateData().catch(error => {
  console.error('Migration error:', error)
  process.exit(1)
})