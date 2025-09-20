export interface Household {
  id: string
  name: string
  inviteCode?: string
  createdBy: string
  createdAt: string
  members?: HouseholdMember[]
}

export interface HouseholdMember {
  id: string
  email: string
  displayName: string
  joinedAt: string
}

export interface CreateHouseholdRequest {
  name: string
}

export interface JoinHouseholdRequest {
  inviteCode: string
}

export interface HouseholdRow {
  id: string
  name: string
  invite_code: string | null
  created_by: string
  created_at: string
}