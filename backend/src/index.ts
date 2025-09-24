import { config } from 'dotenv'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

// Load .env from the root directory (parent of backend)
config({ path: join(__dirname, '../../.env') })

import express from 'express'
import cors from 'cors'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import { PostgreSQLDatabase } from './models/database-pg'
import { recipeRoutes } from './routes/recipes'
import { ingredientRoutes } from './routes/ingredients'
import { authRoutes } from './routes/auth'
import { householdRoutes } from './routes/households'
import { shoppingListRoutes } from './routes/shoppingList'
import { errorHandler } from './middleware/errorHandler'
import { ipBlocker } from './middleware/ipBlocker'
import passport from './config/passport'

// Import connect-pg-simple and create session store
const connectPgSimple = require('connect-pg-simple')
const PgStore = connectPgSimple(session)

const app = express()
const PORT = process.env.PORT || 3001

// Trust proxy for accurate IP detection (important for rate limiting and security)
// This tells Express to trust the X-Forwarded-* headers from the specified proxy
// - 'loopback': Trust requests from localhost/loopback interface
// - Set to true to trust all proxies (less secure)
// - Set to IP addresses to trust specific proxies
// - Set to number (e.g., 1) to trust that many hops of proxies
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])

// IP blocking middleware (must be first)
app.use(ipBlocker)

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

// Rate limiting for 404 responses (prevents abuse from unauthorized requests)
const notFoundLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 50, // Very restrictive limits
  message: 'Too many invalid requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware to apply rate limiting only for unauthorized requests
const conditionalNotFoundLimiter = (req: any, res: any, next: any) => {
  // Define allowed paths (same as in the route handler below)
  const allowedPaths = [
    // React app routes
    '/',
    '/login',
    '/dashboard',
    '/auth/callback',
    '/share-target',
    '/recipe/',           // Covers /recipe/:id and /recipe/:id/edit
    '/add-recipe',
    '/settings',

    // Static assets and PWA files
    '/assets/',           // Bundled JS/CSS files
    '/manifest.webmanifest',
    '/sw.js',
    '/registerSW.js',
    '/workbox-',          // Workbox files (starts with)

    // Icons and favicons
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/icon-192.png',
    '/icon-512.png',
    '/icon.svg',

    // Netlify config files
    '/_headers',
    '/_redirects'
  ]

  // Check if path is allowed
  const isAllowed = allowedPaths.some(allowedPath => {
    if (allowedPath.endsWith('/')) {
      // For directory-like paths, allow startsWith (e.g., /recipe/ matches /recipe/123)
      return req.path.startsWith(allowedPath)
    }
    // For specific files, require exact match to prevent path traversal
    return req.path === allowedPath
  })

  // Only apply rate limiting for unauthorized requests
  if (!isAllowed) {
    return notFoundLimiter(req, res, next)
  }

  // For allowed requests, continue normally
  next()
}

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
// NOTE: Removed express.static middleware - frontend serving is now handled by the whitelist check below
// to prevent serving index.html for unauthorized paths

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/recipes', recipeRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use('/api/households', householdRoutes)
app.use('/api/shopping-list', shoppingListRoutes)

// Only serve public API routes if explicitly enabled
if (process.env.ALLOW_PUBLIC_API === 'true') {
  console.log('Public API access enabled')
} else {
  console.log('Public API access restricted - authentication required for most endpoints')
}

// Error handling
app.use(errorHandler)

// Serve React app ONLY for legitimate app routes (whitelist approach)
// Apply security whitelist in all environments for better security
if (true) { // Always apply whitelist - was: process.env.NODE_ENV === 'production'
  app.get(/^\/(?!api|uploads).*/, conditionalNotFoundLimiter, (req, res) => {
    // Only allow legitimate React app routes and static assets
    const allowedPaths = [
      // React app routes
      '/',
      '/login',
      '/dashboard',
      '/auth/callback',
      '/share-target',
      '/recipe/',           // Covers /recipe/:id and /recipe/:id/edit
      '/add-recipe',
      '/settings',

      // Static assets and PWA files
      '/assets/',           // Bundled JS/CSS files
      '/manifest.webmanifest',
      '/sw.js',
      '/registerSW.js',
      '/workbox-',          // Workbox files (starts with)

      // Icons and favicons
      '/favicon-16x16.png',
      '/favicon-32x32.png',
      '/icon-192.png',
      '/icon-512.png',
      '/icon.svg',

      // Netlify config files
      '/_headers',
      '/_redirects'
    ]

    // Check if path matches any allowed pattern
    const isAllowed = allowedPaths.some(allowedPath => {
      let matches = false

      // Special case: root path "/" should only match exactly "/"
      if (allowedPath === '/') {
        matches = req.path === '/'
      } else if (allowedPath.endsWith('/')) {
        // For directory-like paths, allow startsWith (e.g., /recipe/ matches /recipe/123)
        matches = req.path.startsWith(allowedPath)
      } else {
        // For specific files, require exact match to prevent path traversal
        matches = req.path === allowedPath
      }

      return matches
    })

    if (!isAllowed) {
      console.log('Blocked unauthorized path:', req.path)
      return res.status(404).send('Not Found')
    }

    // Check if this is a request for an actual file
    const distPath = join(process.cwd(), '../frontend/dist')
    const filePath = join(distPath, req.path)
    
    // For security, ensure the resolved path is still within the dist directory
    const resolvedPath = resolve(filePath)
    const distResolved = resolve(distPath)
    
    if (resolvedPath.startsWith(distResolved) && existsSync(filePath)) {
      // Serve the actual file
      console.log('Serving static file:', req.path)
      return res.sendFile(filePath)
    }

    // For SPA routes, serve index.html
    console.log('Serving React app for path:', req.path)
    res.sendFile(join(distPath, 'index.html'))
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