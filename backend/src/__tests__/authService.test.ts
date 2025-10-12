import { authService } from '../services/authService'
import { userModel } from '../models/userModel'

// Mock the userModel
jest.mock('../models/userModel', () => ({
  userModel: {
    findByEmail: jest.fn(),
    create: jest.fn()
  }
}))

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateRegistration', () => {
    it('should validate correct registration data', () => {
      const result = authService.validateRegistration(
        'test@example.com',
        'password123',
        'Test User'
      )
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject missing email', () => {
      const result = authService.validateRegistration(
        '',
        'password123',
        'Test User'
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Email, password, and display name are required')
    })

    it('should reject missing password', () => {
      const result = authService.validateRegistration(
        'test@example.com',
        '',
        'Test User'
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Email, password, and display name are required')
    })

    it('should reject missing display name', () => {
      const result = authService.validateRegistration(
        'test@example.com',
        'password123',
        ''
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Email, password, and display name are required')
    })

    it('should reject short password', () => {
      const result = authService.validateRegistration(
        'test@example.com',
        'pass',
        'Test User'
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Password must be at least 6 characters long')
    })
  })

  describe('registerUser', () => {
    it('should create a new user when email is available', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User'
      }

      ;(userModel.findByEmail as jest.Mock).mockResolvedValue(null)
      ;(userModel.create as jest.Mock).mockResolvedValue(mockUser)

      const result = await authService.registerUser({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      })

      expect(result).toEqual(mockUser)
      expect(userModel.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(userModel.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      })
    })

    it('should throw error when email already exists', async () => {
      const existingUser = {
        id: '123',
        email: 'test@example.com',
        displayName: 'Existing User'
      }

      ;(userModel.findByEmail as jest.Mock).mockResolvedValue(existingUser)

      await expect(
        authService.registerUser({
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        })
      ).rejects.toThrow('An account with this email already exists')

      expect(userModel.create).not.toHaveBeenCalled()
    })
  })
})
