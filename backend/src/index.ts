import { config } from 'dotenv'
import { join, resolve } from 'path'
import { existsSync } from 'fs'

// Load .env from the root directory (parent of backend)
config({ path: join(__dirname, '../../.env') })

import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import session from 'express-session'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import compression from 'compression'
import { PostgreSQLDatabase } from './models/database-pg'
import { recipeRoutes } from './routes/recipes'
import { ingredientRoutes } from './routes/ingredients'
import { authRoutes } from './routes/auth'
import { householdRoutes } from './routes/households'
import { shoppingListRoutes } from './routes/shoppingList'
import { errorHandler } from './middleware/errorHandler'
import { ipBlocker } from './middleware/ipBlocker'
import { User } from './types/user'
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
const compressionMiddleware = compression({
  threshold: 1024, // Only compress responses over 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }

    return compression.filter(req, res)
  }
})
app.use(compressionMiddleware)

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const isProduction = process.env.NODE_ENV === 'production'

const apiRateLimitWindowMs = parsePositiveInt(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000)
const apiRateLimitMaxRequests = parsePositiveInt(
  process.env.API_RATE_LIMIT_MAX_REQUESTS,
  isProduction ? 2000 : 10000
)

console.log(`API Rate Limit Config: ${apiRateLimitMaxRequests} requests per ${apiRateLimitWindowMs / 1000 / 60} minutes (${isProduction ? 'production' : 'development'} mode)`)

const notFoundRateLimitWindowMs = parsePositiveInt(
  process.env.NOT_FOUND_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000
)
const notFoundRateLimitMax = parsePositiveInt(
  process.env.NOT_FOUND_RATE_LIMIT_MAX,
  isProduction ? 10 : 50
)

const sessionMaxAgeDays = parsePositiveInt(process.env.SESSION_MAX_AGE_DAYS, 30)
const sessionMaxAgeMs = sessionMaxAgeDays * 24 * 60 * 60 * 1000
const sessionMaxAgeSeconds = Math.floor(sessionMaxAgeMs / 1000)

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

// Rate limiting for 404 responses (prevents abuse from unauthorized requests)
const notFoundLimiter = rateLimit({
  windowMs: notFoundRateLimitWindowMs,
  max: notFoundRateLimitMax,
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
    createTableIfMissing: true,
    ttl: sessionMaxAgeSeconds
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure cookies in production (assumes HTTPS)
    httpOnly: true,
    maxAge: sessionMaxAgeMs,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Allow cross-site cookies for OAuth in production
  }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

const requireSignedInForApi = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/auth')) {
    return next()
  }

  const isAuthenticated = typeof req.isAuthenticated === 'function'
    ? req.isAuthenticated()
    : Boolean(req.user)

  if (isAuthenticated) {
    return next()
  }

  return res.status(401).json({
    error: {
      message: 'Authentication required. Please sign in and try again.'
    }
  })
}

const apiRateLimiter = rateLimit({
  windowMs: apiRateLimitWindowMs,
  max: apiRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = req.user as User | undefined
    if (user) {
      const key = `user:${user.id}`
      console.log(`Rate limit key for ${req.method} ${req.path}: ${key} (${user.displayName})`)
      return key
    }
    // For non-authenticated requests, use IP as fallback
    const rawIp = req.ip || req.socket.remoteAddress
    const generatedIpKey = rawIp ? ipKeyGenerator(rawIp) : 'unknown'
    console.log(`Rate limit key for ${req.method} ${req.path}: ip:${generatedIpKey}`)
    return `ip:${generatedIpKey}`
  },
  skip: (req) => req.path === '/health' || req.path.startsWith('/auth'),
  message: 'Too many requests. Please slow down and try again later.',
  handler: (req, res) => {
    const user = req.user as User | undefined
    const identifier = user?.id
    const displayName = user?.displayName
    console.log(`RATE LIMIT HIT for ${identifier ? `user:${identifier}${displayName ? ` (${displayName})` : ''}` : req.ip} on ${req.method} ${req.path}`)
    res.status(429).json({
      error: {
        message: 'Too many requests. Please slow down and try again later.'
      }
    })
  }
})

// Serve uploaded images statically
app.use('/uploads', express.static(join(process.cwd(), 'data', 'uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})


// Routes
app.use('/api/auth', authRoutes)
app.use('/api', requireSignedInForApi)
app.use('/api', apiRateLimiter)
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
      '/shopping-list',
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
      '/_redirects',

      // Extension downloads and other static bundles
      '/extensions/',
      '/about',
      '/dashboard'
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

    // For SPA routes, serve index.html without additional cache headers
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