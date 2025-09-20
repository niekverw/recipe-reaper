import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'
import { Database } from './database'
import { User, CreateUserRequest, UserRow } from '../types/user'

export const userModel = {
  async findById(id: string): Promise<UserRow | null> {
    const db = Database.getInstance()
    const row = await db.get<UserRow>('SELECT * FROM users WHERE id = ?', [id])
    return row || null
  },

  async findByEmail(email: string): Promise<UserRow | null> {
    const db = Database.getInstance()
    const row = await db.get<UserRow>('SELECT * FROM users WHERE email = ?', [email])
    return row || null
  },

  async create(data: CreateUserRequest): Promise<User> {
    const db = Database.getInstance()
    const id = uuidv4()
    const now = new Date().toISOString()

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(data.password, saltRounds)

    const sql = `
      INSERT INTO users (
        id, email, password_hash, display_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
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
      createdAt: now,
      updatedAt: now
    }
  },

  async updateHousehold(userId: string, householdId: string | null): Promise<void> {
    const db = Database.getInstance()
    const now = new Date().toISOString()

    await db.run(
      'UPDATE users SET household_id = ?, updated_at = ? WHERE id = ?',
      [householdId, now, userId]
    )
  },

  async getHouseholdMembers(householdId: string): Promise<UserRow[]> {
    const db = Database.getInstance()
    const rows = await db.all<UserRow>(
      'SELECT * FROM users WHERE household_id = ? ORDER BY created_at ASC',
      [householdId]
    )
    return rows
  },

  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email)
    return !!user
  }
}