import { Router } from 'express'
import { authController } from '../controllers/authController'

export const authRoutes = Router()


// POST /auth/register - Register new user
authRoutes.post('/register', authController.register)

// POST /auth/login - Login user
authRoutes.post('/login', authController.login)

// POST /auth/logout - Logout user
authRoutes.post('/logout', authController.logout)

// GET /auth/profile - Get current user profile
authRoutes.get('/profile', authController.profile)

// GET /auth/status - Check authentication status
authRoutes.get('/status', authController.status)

// GET /auth/google - Initiate Google OAuth
authRoutes.get('/google', authController.googleAuth)

// GET /auth/google/callback - Handle Google OAuth callback
authRoutes.get('/google/callback', authController.googleAuthCallback)