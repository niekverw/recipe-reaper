import sqlite3 from 'sqlite3'
import { promisify } from 'util'

export class Database {
  private static instance: Database
  private db: sqlite3.Database | null = null

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  async initialize(dbPath: string = './recipes.db'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err)
        } else {
          console.log(`Connected to SQLite database: ${dbPath}`)
          this.createTables().then(resolve).catch(reject)
        }
      })
    })
  }

  private async createTables(): Promise<void> {
    const createRecipesTable = `
      CREATE TABLE IF NOT EXISTS recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        prep_time_minutes INTEGER NOT NULL,
        servings INTEGER NOT NULL,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        image TEXT,
        is_public BOOLEAN DEFAULT true,
        user_id TEXT,
        household_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `

    return this.run(createRecipesTable)
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row) => {
        if (err) reject(err)
        else resolve(row as T)
      })
    })
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows as T[])
      })
    })
  }

  async close(): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) reject(err)
        else {
          this.db = null
          console.log('Database connection closed')
          resolve()
        }
      })
    })
  }
}