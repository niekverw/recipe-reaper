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

      // Shopping Lists table
      const createShoppingListsTable = `
        CREATE TABLE IF NOT EXISTS shopping_lists (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          household_id TEXT,
          ingredient TEXT NOT NULL,
          description TEXT,
          quantity TEXT,
          unit TEXT,
          recipe_id TEXT,
          recipe_name TEXT,
          category TEXT DEFAULT 'OTHER',
          display_name TEXT,
          is_completed BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (household_id) REFERENCES households(id),
          FOREIGN KEY (recipe_id) REFERENCES recipes(id)
        )
      `

      // Blocked IPs table for security
      const createBlockedIPsTable = `
        CREATE TABLE IF NOT EXISTS blocked_ips (
          id SERIAL PRIMARY KEY,
          ip_address TEXT NOT NULL UNIQUE,
          blocked_reason TEXT NOT NULL,
          blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          first_attempt_path TEXT,
          attempt_count INTEGER DEFAULT 1
        )
      `

      // Create indexes for better performance
      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
        'CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)',
        'CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON recipes(household_id)',
        'CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON recipes(is_public)',
        'CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_shopping_lists_household_id ON shopping_lists(household_id)',
        'CREATE INDEX IF NOT EXISTS idx_shopping_lists_is_completed ON shopping_lists(is_completed)',
        'CREATE INDEX IF NOT EXISTS idx_shopping_lists_recipe_id ON shopping_lists(recipe_id)',
        'CREATE INDEX IF NOT EXISTS idx_shopping_lists_category ON shopping_lists(category)',
        'CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON blocked_ips(ip_address)',
      ]

      // Execute table creation
      await client.query(createHouseholdsTable)
      await client.query(createUsersTable)
      await client.query(createRecipesTable)
      await client.query(createShoppingListsTable)
      await client.query(createBlockedIPsTable)

      // Create indexes
      for (const indexQuery of createIndexes) {
        await client.query(indexQuery)
      }

      // Add image_sizes column if it doesn't exist (for migration)
      await client.query(`
        ALTER TABLE recipes
        ADD COLUMN IF NOT EXISTS image_sizes TEXT
      `)

      // Add description column to shopping_lists if it doesn't exist (for migration)
      await client.query(`
        ALTER TABLE shopping_lists
        ADD COLUMN IF NOT EXISTS description TEXT
      `)

      // Add category and display_name columns to shopping_lists if they don't exist (for migration)
      await client.query(`
        ALTER TABLE shopping_lists
        ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'OTHER'
      `)

      await client.query(`
        ALTER TABLE shopping_lists
        ADD COLUMN IF NOT EXISTS display_name TEXT
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