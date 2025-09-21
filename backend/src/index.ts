import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import { join } from 'path'
import { PostgreSQLDatabase } from './models/database-pg'
import { recipeRoutes } from './routes/recipes'
import { ingredientRoutes } from './routes/ingredients'
import { authRoutes } from './routes/auth'
import { householdRoutes } from './routes/households'
import { errorHandler } from './middleware/errorHandler'
import passport from './config/passport'

// Import connect-pg-simple and create session store
const connectPgSimple = require('connect-pg-simple')
const PgStore = connectPgSimple(session)

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy for accurate IP detection (important for rate limiting and security)
app.set('trust proxy', true)

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
  store: new PgStore({
    conString: `postgresql://${process.env.DB_USER || 'recipeapp_user'}:${process.env.DB_PASSWORD || 'recipeapp123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'recipeapp'}`,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure cookies in production (assumes HTTPS)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Allow cross-site cookies for OAuth in production
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
    console.log('Serving React app for path:', req.path)
    res.sendFile(join(process.cwd(), '../frontend/dist/index.html'))
  })

  // Catch any API routes that weren't handled
  app.get(/^\/api\/.*/, (req, res) => {
    console.log('Unhandled API path:', req.path)
    res.status(404).json({ error: 'API route not found' })
  })
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Initialize database and start server
async function startServer() {
  try {
    await PostgreSQLDatabase.getInstance().initialize()

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
  await PostgreSQLDatabase.getInstance().close()
  process.exit(0)
})

if (require.main === module) {
  startServer()
}

export { app }