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

export interface CreateUserRequest {
  email: string
  password: string
  displayName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UserRow {
  id: string
  email: string
  password_hash: string
  display_name: string
  household_id: string | null
  google_id: string | null
  default_translation_language: string | null
  created_at: string
  updated_at: string
}