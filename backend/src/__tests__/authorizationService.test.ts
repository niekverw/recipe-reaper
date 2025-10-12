import { authorizationService } from '../services/authorizationService'
import { userModel } from '../models/userModel'
import { User } from '../types/user'

// Mock the userModel
jest.mock('../models/userModel', () => ({
  userModel: {
    findById: jest.fn()
  }
}))

describe('AuthorizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('userHasHouseholdAccess', () => {
    it('should return false when user has no household', async () => {
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        householdId: undefined,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const result = await authorizationService.userHasHouseholdAccess(
        user,
        'owner1',
        'household1'
      )

      expect(result).toBe(false)
    })

    it('should return true when recipe is in user household', async () => {
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        householdId: 'household1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const result = await authorizationService.userHasHouseholdAccess(
        user,
        'owner1',
        'household1'
      )

      expect(result).toBe(true)
    })

    it('should return true when recipe owner is in user household', async () => {
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        householdId: 'household1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const owner = {
        id: 'owner1',
        email: 'owner@example.com',
        displayName: 'Owner',
        household_id: 'household1'
      }

      ;(userModel.findById as jest.Mock).mockResolvedValue(owner)

      const result = await authorizationService.userHasHouseholdAccess(
        user,
        'owner1',
        undefined
      )

      expect(result).toBe(true)
      expect(userModel.findById).toHaveBeenCalledWith('owner1')
    })

    it('should return false when owner is in different household', async () => {
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        householdId: 'household1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const owner = {
        id: 'owner1',
        email: 'owner@example.com',
        displayName: 'Owner',
        household_id: 'household2'
      }

      ;(userModel.findById as jest.Mock).mockResolvedValue(owner)

      const result = await authorizationService.userHasHouseholdAccess(
        user,
        'owner1',
        undefined
      )

      expect(result).toBe(false)
    })
  })

  describe('canEditRecipe', () => {
    it('should return true when user owns the recipe', async () => {
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        householdId: 'household1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const result = await authorizationService.canEditRecipe(
        user,
        'user1',
        undefined
      )

      expect(result).toBe(true)
    })

    it('should return true when user has household access', async () => {
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        householdId: 'household1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const result = await authorizationService.canEditRecipe(
        user,
        'owner1',
        'household1'
      )

      expect(result).toBe(true)
    })

    it('should return false when user does not own recipe and has no household access', async () => {
      const user: User = {
        id: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        householdId: 'household1',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }

      const owner = {
        id: 'owner1',
        email: 'owner@example.com',
        displayName: 'Owner',
        household_id: 'household2'
      }

      ;(userModel.findById as jest.Mock).mockResolvedValue(owner)

      const result = await authorizationService.canEditRecipe(
        user,
        'owner1',
        'household2'
      )

      expect(result).toBe(false)
    })
  })
})
