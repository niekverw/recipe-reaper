import { v4 as uuidv4 } from 'uuid'
import { Database } from './database'
import { Household, CreateHouseholdRequest, HouseholdRow, HouseholdMember } from '../types/household'
import { userModel } from './userModel'

function generateInviteCode(): string {
  // Generate a 6-character invite code using uppercase letters and numbers
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const householdModel = {
  async findById(id: string): Promise<HouseholdRow | null> {
    const db = Database.getInstance()
    const row = await db.get<HouseholdRow>('SELECT * FROM households WHERE id = ?', [id])
    return row || null
  },

  async findByInviteCode(inviteCode: string): Promise<HouseholdRow | null> {
    const db = Database.getInstance()
    const row = await db.get<HouseholdRow>('SELECT * FROM households WHERE invite_code = ?', [inviteCode])
    return row || null
  },

  async create(data: CreateHouseholdRequest, createdBy: string): Promise<Household> {
    const db = Database.getInstance()
    const id = uuidv4()
    const now = new Date().toISOString()
    const inviteCode = generateInviteCode()

    const sql = `
      INSERT INTO households (
        id, name, invite_code, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `

    const params = [
      id,
      data.name.trim(),
      inviteCode,
      createdBy,
      now
    ]

    await db.run(sql, params)

    // Add creator to household
    await userModel.updateHousehold(createdBy, id)

    return {
      id,
      name: data.name.trim(),
      inviteCode,
      createdBy,
      createdAt: now
    }
  },

  async getWithMembers(id: string): Promise<Household | null> {
    const householdRow = await this.findById(id)
    if (!householdRow) return null

    const memberRows = await userModel.getHouseholdMembers(id)
    const members: HouseholdMember[] = memberRows.map(row => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      joinedAt: row.created_at
    }))

    return {
      id: householdRow.id,
      name: householdRow.name,
      inviteCode: householdRow.invite_code || undefined,
      createdBy: householdRow.created_by,
      createdAt: householdRow.created_at,
      members
    }
  },

  async addMember(householdId: string, userId: string): Promise<void> {
    await userModel.updateHousehold(userId, householdId)
  },

  async removeMember(userId: string): Promise<void> {
    await userModel.updateHousehold(userId, null)
  },

  async regenerateInviteCode(householdId: string): Promise<string> {
    const db = Database.getInstance()
    const newInviteCode = generateInviteCode()

    await db.run(
      'UPDATE households SET invite_code = ? WHERE id = ?',
      [newInviteCode, householdId]
    )

    return newInviteCode
  }
}