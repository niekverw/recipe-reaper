import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { PostgreSQLDatabase } from './database-pg'
import { User, CreateUserRequest, UserRow } from '../types/user'

export const userModel = {
  async findById(id: string): Promise<UserRow | null> {
    const db = PostgreSQLDatabase.getInstance()
    const row = await db.get<UserRow>('SELECT * FROM users WHERE id = $1', [id])
    return row || null
  },

  async findByEmail(email: string): Promise<UserRow | null> {
    const db = PostgreSQLDatabase.getInstance()
    const row = await db.get<UserRow>('SELECT * FROM users WHERE email = $1', [email])
    return row || null
  },

  async create(data: CreateUserRequest): Promise<User> {
    const db = PostgreSQLDatabase.getInstance()
    const id = uuidv4()
    const now = new Date().toISOString()

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    const sql = `
      INSERT INTO users (
        id, email, password_hash, display_name, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `

    const params = [
      id,
      data.email.toLowerCase().trim(),
      passwordHash,
      data.displayName.trim(),
      now,
      now
    ]

    await db.run(sql, params)

    return {
      id,
      email: data.email.toLowerCase().trim(),
      displayName: data.displayName.trim(),
      defaultTranslationLanguage: undefined,
      createdAt: now,
      updatedAt: now
    }
  },

  async updateHousehold(userId: string, householdId: string | null): Promise<void> {
    const db = PostgreSQLDatabase.getInstance()
    const now = new Date().toISOString()

    await db.run(
      'UPDATE users SET household_id = $1, updated_at = $2 WHERE id = $3',
      [householdId, now, userId]
    )
  },

  async getHouseholdMembers(householdId: string): Promise<UserRow[]> {
    const db = PostgreSQLDatabase.getInstance()
    const rows = await db.all<UserRow>(
      'SELECT * FROM users WHERE household_id = $1 ORDER BY created_at ASC',
      [householdId]
    )
    return rows
  },

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email)
    return !!user
  },

  async createGoogleUser(data: { email: string; displayName: string; googleId: string }): Promise<User> {
    const db = PostgreSQLDatabase.getInstance()
    const id = uuidv4()
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO users (
        id, email, password_hash, display_name, google_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `

    const params = [
      id,
      data.email.toLowerCase().trim(),
      '', // Empty password hash for Google OAuth users
      data.displayName.trim(),
      data.googleId,
      now,
      now
    ]

    await db.run(sql, params)

    return {
      id,
      email: data.email.toLowerCase().trim(),
      displayName: data.displayName.trim(),
      googleId: data.googleId,
      defaultTranslationLanguage: undefined,
      createdAt: now,
      updatedAt: now
    }
  },

  async linkGoogleAccount(userId: string, googleId: string): Promise<void> {
    const db = PostgreSQLDatabase.getInstance()
    const now = new Date().toISOString()

    await db.run(
      'UPDATE users SET google_id = $1, updated_at = $2 WHERE id = $3',
      [googleId, now, userId]
    )
  },

  async updateTranslationPreference(userId: string, language: string | null): Promise<void> {
    const db = PostgreSQLDatabase.getInstance()
    const now = new Date().toISOString()

    await db.run(
      'UPDATE users SET default_translation_language = $1, updated_at = $2 WHERE id = $3',
      [language, now, userId]
    )
  }
}

export function mapUserRowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    householdId: row.household_id || undefined,
    googleId: row.google_id || undefined,
    defaultTranslationLanguage: row.default_translation_language || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}