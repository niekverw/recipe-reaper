import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
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