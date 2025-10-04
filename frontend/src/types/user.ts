export interface User {
  id: string
  email: string
  displayName: string
  householdId?: string
  googleId?: string
  defaultTranslationLanguage?: string
  createdAt: string
  updatedAt: string
}

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

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  displayName: string
}

export interface CreateHouseholdData {
  name: string
}

export interface JoinHouseholdData {
  inviteCode: string
}