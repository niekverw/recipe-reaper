import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import { join } from 'path'
import { Database } from './models/database'
import { recipeRoutes } from './routes/recipes'
import { ingredientRoutes } from './routes/ingredients'
import { authRoutes } from './routes/auth'
import { householdRoutes } from './routes/households'
import { errorHandler } from './middleware/errorHandler'
import passport from './config/passport'

// Import connect-sqlite3 and create session store
const connectSqlite3 = require('connect-sqlite3')
const SQLiteStore = connectSqlite3(session)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests, Postman)
    if (!origin) return callback(null, true)

    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [
          // Parse comma-separated FRONTEND_URL values
          ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : ['https://yourdomain.com']),
          // Also allow localhost origins in production for development
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:3001' // Allow same-origin requests
        ]
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    console.log(`CORS blocked origin: ${origin}`)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

// Rate limiting - different limits for authenticated vs anonymous users
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Authenticated users get much higher limits
    if (req.user) {
      return process.env.NODE_ENV === 'production' ? 2000 : 10000
    }
    // Anonymous users get reasonable limits
    return process.env.NODE_ENV === 'production' ? 500 : 2000
  },
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
})
app.use('/api/', limiter)

// Stricter rate limiting for expensive operations (AI, scraping)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    // Authenticated users get higher limits for expensive operations
    if (req.user) {
      return process.env.NODE_ENV === 'production' ? 50 : 200
    }
    // Anonymous users get very limited access to expensive operations
    return process.env.NODE_ENV === 'production' ? 5 : 20
  },
  message: 'Too many requests for this operation, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/recipes/scrape', strictLimiter)
app.use('/api/recipes/parse-text', strictLimiter)
app.use('/api/recipes/parse-text-gemini', strictLimiter)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Session configuration
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './data'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true', // Only secure in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Serve uploaded images statically
app.use('/uploads', express.static(join(process.cwd(), 'data', 'uploads')))

// Serve built frontend statically (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(process.cwd(), '../frontend/dist')))
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/recipes', recipeRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use('/api/households', householdRoutes)

// Only serve public API routes if explicitly enabled
if (process.env.ALLOW_PUBLIC_API === 'true') {
  console.log('Public API access enabled')
} else {
  console.log('Public API access restricted - authentication required for most endpoints')
}

// Error handling
app.use(errorHandler)

// Serve React app for all non-API routes (SPA fallback) - must be last
if (process.env.NODE_ENV === 'production') {
  app.get(/^\/(?!api|uploads).*/, (req, res) => {
    res.sendFile(join(process.cwd(), '../frontend/dist/index.html'))
  })
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Initialize database and start server
async function startServer() {
  try {
    await Database.getInstance().initialize()

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Health check available at http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...')
  await Database.getInstance().close()
  process.exit(0)
})

if (require.main === module) {
  startServer()
}

export { app }