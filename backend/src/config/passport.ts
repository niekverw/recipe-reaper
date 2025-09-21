import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20'
import bcrypt from 'bcryptjs'
import { userModel } from '../models/userModel'
import { User } from '../types/user'

// Configure Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email: string, password: string, done) => {
    try {
      // Find user by email
      const user = await userModel.findByEmail(email)
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' })
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) {
        return done(null, false, { message: 'Invalid email or password' })
      }

      // Convert user row to user object
      const userObj: User = {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        householdId: user.household_id || undefined,
        googleId: user.google_id || undefined,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }

      return done(null, userObj)
    } catch (error) {
      return done(error)
    }
  }
))

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://recipereaper.app/api/auth/google/callback'
      : 'http://localhost:3001/api/auth/google/callback')
}, async (accessToken: string, refreshToken: string, profile: Profile, done: (error: any, user?: any) => void) => {
  try {
    const email = profile.emails?.[0]?.value
    const googleId = profile.id
    const displayName = profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName || 'Google User'

    if (!email) {
      return done(new Error('No email found in Google profile'), null)
    }

    let user = await userModel.findByEmail(email)

    if (user) {
      // User exists - link Google account if not already linked
      if (!user.google_id) {
        await userModel.linkGoogleAccount(user.id, googleId)
        user.google_id = googleId
      }
    } else {
      // Create new user with Google OAuth
      const newUser = await userModel.createGoogleUser({
        email,
        displayName,
        googleId
      })
      user = {
        id: newUser.id,
        email: newUser.email,
        display_name: newUser.displayName,
        google_id: googleId,
        password_hash: '',
        household_id: null,
        created_at: newUser.createdAt,
        updated_at: newUser.updatedAt
      }
    }

    // Convert to User object for session
    const userObj: User = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      householdId: user.household_id || undefined,
      googleId: user.google_id || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }

    done(null, userObj)
  } catch (error) {
    done(error, null)
  }
}))

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await userModel.findById(id)
    if (!user) {
      return done(null, false)
    }

    const userObj: User = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      householdId: user.household_id || undefined,
      googleId: user.google_id || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }

    done(null, userObj)
  } catch (error) {
    done(error)
  }
})

export default passport