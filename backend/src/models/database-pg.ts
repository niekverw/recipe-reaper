import { Pool, Client } from 'pg'

export class PostgreSQLDatabase {
  private static instance: PostgreSQLDatabase
  private pool: Pool | null = null

  private constructor() {}

  static getInstance(): PostgreSQLDatabase {
    if (!PostgreSQLDatabase.instance) {
      PostgreSQLDatabase.instance = new PostgreSQLDatabase()
    }
    return PostgreSQLDatabase.instance
  }

  async initialize(): Promise<void> {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'recipeapp',
      user: process.env.DB_USER || 'recipeapp_user',
      password: process.env.DB_PASSWORD || 'recipeapp123',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    }

    this.pool = new Pool(config)

    // Test the connection
    try {
      const client = await this.pool.connect()
      console.log(`Connected to PostgreSQL database: ${config.database}`)
      client.release()
      await this.createTables()
    } catch (error) {
      console.error('Failed to connect to PostgreSQL:', error)
      throw error
    }
  }

  private async createTables(): Promise<void> {
    const client = await this.pool!.connect()

    try {
      await client.query('BEGIN')

      // Households table (created first due to foreign key dependency)
      const createHouseholdsTable = `
        CREATE TABLE IF NOT EXISTS households (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          invite_code TEXT UNIQUE,
          created_by TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          display_name TEXT NOT NULL,
          household_id TEXT,
          google_id TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (household_id) REFERENCES households(id)
        )
      `

      // Sessions table for express-session (connect-pg-simple will create this automatically)
      // We don't need to create this table as connect-pg-simple handles it

      // Recipes table
      const createRecipesTable = `
        CREATE TABLE IF NOT EXISTS recipes (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          prep_time_minutes INTEGER NOT NULL,
          cook_time_minutes INTEGER,
          total_time_minutes INTEGER,
          servings INTEGER NOT NULL,
          ingredients TEXT NOT NULL,
          instructions TEXT NOT NULL,
          image TEXT,
          image_sizes TEXT,
          source_url TEXT,
          is_public BOOLEAN DEFAULT true,
          user_id TEXT,
          household_id TEXT,
          copied_from TEXT,
          ai_enhanced_notes TEXT,
          tags TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (household_id) REFERENCES households(id),
          FOREIGN KEY (copied_from) REFERENCES recipes(id)
        )
      `

      // Create indexes for better performance
      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)',
        'CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON recipes(household_id)',
        'CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public)',
      ]

      // Execute table creation
      await client.query(createHouseholdsTable)
      await client.query(createUsersTable)
      await client.query(createRecipesTable)

      // Create indexes
      for (const indexQuery of createIndexes) {
        await client.query(indexQuery)
      }

      // Add image_sizes column if it doesn't exist (for migration)
      await client.query(`
        ALTER TABLE recipes
        ADD COLUMN IF NOT EXISTS image_sizes TEXT
      `)

      await client.query('COMMIT')
      console.log('PostgreSQL tables and indexes created successfully')
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Error creating tables:', error)
      throw error
    } finally {
      client.release()
    }
  }

  async query(text: string, params: any[] = []): Promise<any> {
    if (!this.pool) throw new Error('Database not initialized')

    const client = await this.pool.connect()
    try {
      const result = await client.query(text, params)
      return result
    } finally {
      client.release()
    }
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    await this.query(sql, params)
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const result = await this.query(sql, params)
    return result.rows[0] as T | undefined
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.query(sql, params)
    return result.rows as T[]
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      console.log('PostgreSQL connection pool closed')
    }
  }
}