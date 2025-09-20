import { Router } from 'express'
import { householdController } from '../controllers/householdController'

export const householdRoutes = Router()

// POST /api/households - Create new household
householdRoutes.post('/', householdController.create)

// POST /api/households/join - Join household by invite code
householdRoutes.post('/join', householdController.join)

// POST /api/households/leave - Leave current household
householdRoutes.post('/leave', householdController.leave)

// GET /api/households/current - Get current user's household
householdRoutes.get('/current', householdController.getCurrent)

// POST /api/households/regenerate-invite - Regenerate invite code
householdRoutes.post('/regenerate-invite', householdController.regenerateInviteCode)