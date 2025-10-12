import { Request, Response } from 'express'
import crypto from 'crypto'
import passport from 'passport'
import { userModel, mapUserRowToUser } from '../models/userModel'
import { SUPPORTED_LANGUAGE_CODES } from '../config/languages'
import { CreateUserRequest, LoginRequest } from '../types/user'
import { authService } from '../services/authService'

// Extend Express session to include OAuth state and PKCE
declare module 'express-session' {
  interface SessionData {
    oauthState?: string
    codeVerifier?: string
  }
}

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { email, password, displayName }: CreateUserRequest = req.body

      // Validate registration data using auth service
      const validation = authService.validateRegistration(email, password, displayName)
      if (!validation.valid) {
        return res.status(400).json({
          error: { message: validation.error }
        })
      }

      // Register user using auth service
      const user = await authService.registerUser({ email, password, displayName })

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user'
      res.status(400).json({
        error: { message: errorMessage }
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
    // Generate cryptographically secure state parameter to prevent CSRF
    const state = crypto.randomBytes(32).toString('hex')
    req.session.oauthState = state

    // Handle PKCE parameters for enhanced security
    const { code_challenge, code_challenge_method, code_verifier } = req.query

    const options: any = {
      scope: ['profile', 'email'],
      state: state
    }

    // Add PKCE parameters if provided
    if (code_challenge && code_challenge_method === 'S256') {
      options.codeChallenge = code_challenge
      options.codeChallengeMethod = 'S256'

      // Store code verifier in session for token exchange
      if (code_verifier) {
        req.session.codeVerifier = code_verifier as string
      }
    }

    // Pass through query parameters like prompt=select_account
    if (req.query.prompt) {
      options.prompt = req.query.prompt
    }

    passport.authenticate('google', options)(req, res, next)
  },

  // Handle Google OAuth callback
  googleAuthCallback(req: Request, res: Response, next: any) {
    const frontendUrl = process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'https://recipereaper.app'
      : 'http://localhost:5173'

    // Validate OAuth state parameter to prevent CSRF attacks
    const { state } = req.query
    if (!state || state !== req.session.oauthState) {
      console.error('OAuth state validation failed - possible CSRF attack')
      return res.redirect(`${frontendUrl}/login?error=invalid_state`)
    }

    // Clear the used state to prevent replay attacks
    delete req.session.oauthState
    // Clear the used code verifier for security
    delete req.session.codeVerifier

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
  },

  // Update user's translation preference
  async updateTranslationPreference(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: { message: 'Not authenticated' }
        })
      }

        const { language } = req.body

        let normalizedLanguage: string | null = null

        if (language !== null && language !== undefined) {
          if (typeof language !== 'string') {
            return res.status(400).json({
              error: { message: 'Invalid language parameter' }
            })
          }

          const trimmed = language.trim().toLowerCase()

          if (trimmed.length === 0) {
            normalizedLanguage = null
          } else if (!SUPPORTED_LANGUAGE_CODES.has(trimmed)) {
            return res.status(400).json({
              error: { message: 'Unsupported language code' }
            })
          } else {
            normalizedLanguage = trimmed
          }
        }

        await userModel.updateTranslationPreference((req.user as any).id, normalizedLanguage)

        // Fetch updated user data
        const updatedUser = await userModel.findById((req.user as any).id)
      if (!updatedUser) {
        return res.status(404).json({
          error: { message: 'User not found' }
        })
      }

        const sessionUser = mapUserRowToUser(updatedUser)

        await new Promise<void>((resolve, reject) => {
          req.login(sessionUser, (loginErr) => {
            if (loginErr) {
              reject(loginErr)
            } else {
              resolve()
            }
          })
        })

      res.json({
        message: 'Translation preference updated successfully',
          user: sessionUser
      })
    } catch (error) {
      console.error('Update translation preference error:', error)
      res.status(500).json({
        error: { message: 'Failed to update translation preference' }
      })
    }
  }
}