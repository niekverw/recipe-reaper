import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err)

  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  })
}

export function createError(message: string, statusCode = 500): AppError {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.isOperational = true
  return error
}