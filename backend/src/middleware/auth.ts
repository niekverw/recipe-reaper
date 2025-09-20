import { Request, Response, NextFunction } from 'express'
import { User } from '../types/user'

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: { message: 'Authentication required' }
    })
  }
  next()
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // This middleware allows both authenticated and unauthenticated users
  // The route handler can check req.user to determine if user is authenticated
  next()
}