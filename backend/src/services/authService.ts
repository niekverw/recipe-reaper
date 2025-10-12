import { userModel } from '../models/userModel'
import { CreateUserRequest } from '../types/user'

/**
 * Service for authentication business logic
 */
export class AuthService {
  /**
   * Validate registration data
   * @param email - User email
   * @param password - User password
   * @param displayName - User display name
   * @returns Validation result
   */
  validateRegistration(
    email: string,
    password: string,
    displayName: string
  ): { valid: boolean; error?: string } {
    if (!email || !password || !displayName) {
      return {
        valid: false,
        error: 'Email, password, and display name are required'
      }
    }

    if (password.length < 6) {
      return {
        valid: false,
        error: 'Password must be at least 6 characters long'
      }
    }

    return { valid: true }
  }

  /**
   * Register a new user
   * @param userData - User registration data
   * @returns Created user
   * @throws Error if user already exists or creation fails
   */
  async registerUser(userData: CreateUserRequest) {
    const { email, password, displayName } = userData

    // Check if user already exists
    const existingUser = await userModel.findByEmail(email)
    if (existingUser) {
      throw new Error('An account with this email already exists')
    }

    // Create user
    return await userModel.create({ email, password, displayName })
  }
}

// Export singleton instance
export const authService = new AuthService()
