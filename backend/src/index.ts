import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
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
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}))
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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Serve uploaded images statically
app.use('/uploads', express.static(join(process.cwd(), 'data', 'uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/recipes', recipeRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use('/api/households', householdRoutes)

// Error handling
app.use(errorHandler)

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