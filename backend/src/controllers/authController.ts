import { Request, Response } from 'express'
import passport from 'passport'
import { userModel } from '../models/userModel'
import { CreateUserRequest, LoginRequest } from '../types/user'

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, displayName }: CreateUserRequest = req.body

      // Validation
      if (!email || !password || !displayName) {
        return res.status(400).json({
          error: { message: 'Email, password, and display name are required' }
        })
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: { message: 'Password must be at least 6 characters long' }
        })
      }

      // Check if user already exists
      const existingUser = await userModel.findByEmail(email)
      if (existingUser) {
        return res.status(400).json({
          error: { message: 'An account with this email already exists' }
        })
      }

      // Create user
      const user = await userModel.create({ email, password, displayName })

      // Log the user in automatically
      req.login(user, (err) => {
        if (err) {
          console.error('Auto-login failed after registration:', err)
          return res.status(201).json({
            message: 'User created successfully. Please log in.',
            user: { id: user.id, email: user.email, displayName: user.displayName }
          })
        }

        res.status(201).json({
          message: 'User created and logged in successfully',
          user: user
        })
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({
        error: { message: 'Failed to create user' }
      })
    }
  },

  // Login user
  async login(req: Request, res: Response) {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login error:', err)
        return res.status(500).json({
          error: { message: 'Login failed' }
        })
      }

      if (!user) {
        return res.status(401).json({
          error: { message: info?.message || 'Invalid credentials' }
        })
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Session creation error:', loginErr)
          return res.status(500).json({
            error: { message: 'Failed to create session' }
          })
        }

        res.json({
          message: 'Login successful',
          user: user
        })
      })
    })(req, res)
  },

  // Logout user
  logout(req: Request, res: Response) {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err)
        return res.status(500).json({
          error: { message: 'Logout failed' }
        })
      }

      res.json({ message: 'Logout successful' })
    })
  },

  // Get current user
  profile(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Not authenticated' }
      })
    }

    res.json({ user: req.user })
  },

  // Check authentication status
  status(req: Request, res: Response) {
    res.json({
      authenticated: !!req.user,
      user: req.user || null
    })
  },

  // Initiate Google OAuth
  googleAuth(req: Request, res: Response, next: any) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
  },

  // Handle Google OAuth callback
  googleAuthCallback(req: Request, res: Response, next: any) {
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://recipereaper.app'
      : 'http://localhost:5173'

    console.log('=== GOOGLE CALLBACK DEBUG ===')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL)
    console.log('Computed Frontend URL:', frontendUrl)
    console.log('Request URL:', req.url)
    console.log('Request query:', req.query)
    console.log('==============================')

    passport.authenticate('google', {
      failureRedirect: `${frontendUrl}/login?error=auth_failed`
    }, (err: any, user: any) => {
      console.log('=== PASSPORT CALLBACK DEBUG ===')
      console.log('Error:', err)
      console.log('User:', user ? `${user.email} (${user.id})` : 'null')
      console.log('================================')

      if (err) {
        console.error('Google auth error:', err)
        return res.redirect(`${frontendUrl}/login?error=auth_failed`)
      }
      if (!user) {
        console.log('No user returned from passport')
        return res.redirect(`${frontendUrl}/login?error=auth_failed`)
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error('Google login error:', loginErr)
          return res.redirect(`${frontendUrl}/login?error=login_failed`)
        }
        console.log('Login successful, redirecting to:', `${frontendUrl}/dashboard`)
        res.redirect(`${frontendUrl}/dashboard`)
      })
    })(req, res, next)
  }
}