import { Request, Response } from 'express'
import { householdModel } from '../models/householdModel'
import { CreateHouseholdRequest, JoinHouseholdRequest } from '../types/household'
import { User } from '../types/user'

export const householdController = {
  // Create new household
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' }
        })
      }

      const user = req.user as User
      const { name }: CreateHouseholdRequest = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({
          error: { message: 'Household name is required' }
        })
      }

      // Check if user is already in a household
      if (user.householdId) {
        return res.status(400).json({
          error: { message: 'You are already a member of a household. Leave your current household first.' }
        })
      }

      const household = await householdModel.create({ name }, user.id)

      res.status(201).json({
        message: 'Household created successfully',
        household
      })
    } catch (error) {
      console.error('Create household error:', error)
      res.status(500).json({
        error: { message: 'Failed to create household' }
      })
    }
  },

  // Join household by invite code
  async join(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' }
        })
      }

      const user = req.user as User
      const { inviteCode }: JoinHouseholdRequest = req.body

      if (!inviteCode || !inviteCode.trim()) {
        return res.status(400).json({
          error: { message: 'Invite code is required' }
        })
      }

      // Check if user is already in a household
      if (user.householdId) {
        return res.status(400).json({
          error: { message: 'You are already a member of a household. Leave your current household first.' }
        })
      }

      // Find household by invite code
      const household = await householdModel.findByInviteCode(inviteCode.trim().toUpperCase())
      if (!household) {
        return res.status(404).json({
          error: { message: 'Invalid invite code' }
        })
      }

      // Add user to household
      await householdModel.addMember(household.id, user.id)

      // Get household with members
      const householdWithMembers = await householdModel.getWithMembers(household.id)

      res.json({
        message: 'Successfully joined household',
        household: householdWithMembers
      })
    } catch (error) {
      console.error('Join household error:', error)
      res.status(500).json({
        error: { message: 'Failed to join household' }
      })
    }
  },

  // Leave household
  async leave(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' }
        })
      }

      const user = req.user as User

      if (!user.householdId) {
        return res.status(400).json({
          error: { message: 'You are not a member of any household' }
        })
      }

      await householdModel.removeMember(user.id)

      res.json({
        message: 'Successfully left household'
      })
    } catch (error) {
      console.error('Leave household error:', error)
      res.status(500).json({
        error: { message: 'Failed to leave household' }
      })
    }
  },

  // Get current user's household info
  async getCurrent(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' }
        })
      }

      const user = req.user as User

      if (!user.householdId) {
        return res.json({ household: null })
      }

      const household = await householdModel.getWithMembers(user.householdId)

      res.json({ household })
    } catch (error) {
      console.error('Get household error:', error)
      res.status(500).json({
        error: { message: 'Failed to get household information' }
      })
    }
  },

  // Regenerate invite code (household owner only)
  async regenerateInviteCode(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Authentication required' }
        })
      }

      const user = req.user as User

      if (!user.householdId) {
        return res.status(400).json({
          error: { message: 'You are not a member of any household' }
        })
      }

      const household = await householdModel.findById(user.householdId)
      if (!household) {
        return res.status(404).json({
          error: { message: 'Household not found' }
        })
      }

      // Check if user is the owner
      if (household.created_by !== user.id) {
        return res.status(403).json({
          error: { message: 'Only the household owner can regenerate the invite code' }
        })
      }

      const newInviteCode = await householdModel.regenerateInviteCode(user.householdId)

      res.json({
        message: 'Invite code regenerated successfully',
        inviteCode: newInviteCode
      })
    } catch (error) {
      console.error('Regenerate invite code error:', error)
      res.status(500).json({
        error: { message: 'Failed to regenerate invite code' }
      })
    }
  }
}