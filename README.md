<div align="center">
  <img src="frontend/public/icon-white.svg" alt="Recipe Reaper Icon" width="80" height="80" />
</div>

# Recipe Reaper

*The reaper of recipes, not souls... usually.*

**An intelligent, open-source recipe management app that makes managing household recipes easier (http://recipereaper.app)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node.js-20%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.9-blue)](https://www.typescriptlang.org/)

<div align="center">

[![Recipe Reaper](https://img.shields.io/badge/Recipe_Reaper-🍳-brightgreen?style=for-the-badge&logo=cookpad)](http://recipereaper.app)

<img width="60%" alt="Recipe Reaper App Screenshot" src="https://github.com/user-attachments/assets/28ba2f3f-feeb-4e38-8c37-616828375b6a" />

</div>

## Why Recipe Reaper?
I made this app because most recipe apps I tried were overloaded with features, lacked user-friendliness (too many clicks just to add a recipe), and struggled with parsing recipe descriptions. I wanted something simple, intuitive, and fun—an app that works the way I want. Of course, contributions are always welcome!

Features:
- ** Smart Import ** - From photo's, raw-text, urls (using recipe-scraper,which omits some descriptsions sometimes btw)
- ** Household Sharing** - Share and collaborate on recipes with family members.
- ** Translate recipes** - Translate any recipe upon import.
- ** Easy Editing** - Simple copy/paste functionality and intuitive user-friendly editing!

*your souls, ehhh recipes, are mine.*

## Quick Start

### Prerequisites

- **Node.js 20.19+ or 22.12+** (Required for Vite 7.x)
- **PostgreSQL 12+** (for database)
- Python 3.12+
- npm
- **Gemini API Key** (for AI recipe parsing and image processing)

**Important**: If you have Node.js 18.x, you'll need to upgrade to run the frontend. The backend works fine with Node 18.x.

### Installation & Setup

1. **Install PostgreSQL:**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install postgresql postgresql-contrib

   # macOS (using Homebrew)
   brew install postgresql
   brew services start postgresql

   # Or use Docker
   docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
   ```

2. **Set up PostgreSQL database and tables:**
   ```bash
   cd backend
   sudo ./setup-postgres.sh
   ```
   This creates:
   - Database: `recipeapp`
   - User: `recipeapp_user`
   - Password: `recipeapp123`
   - All required tables and indexes
   ```bash
   # for ubuntu: sudo apt-get install -y libheif-dev libde265-dev libx265-dev
   # Backend dependencies
   cd backend
   npm install

   # Python virtual environment and scraping tools
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Frontend dependencies
   cd ../frontend
   npm install
   ```

4. **Set up environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your API keys and database settings:
   # GEMINI_API_KEY=your_gemini_api_key_here (required)
   # SESSION_SECRET=your-secret-key-change-this-in-production (important!)
   # Database settings are already configured for local PostgreSQL
   ```


### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ | - | Google Gemini API key for AI recipe parsing and image processing |
| `DB_HOST` | ❌ | localhost | PostgreSQL database host |
| `DB_PORT` | ❌ | 5432 | PostgreSQL database port |
| `DB_NAME` | ❌ | recipeapp | PostgreSQL database name |
| `DB_USER` | ❌ | recipeapp_user | PostgreSQL database user |
| `DB_PASSWORD` | ❌ | recipeapp123 | PostgreSQL database password |
| `PORT` | ❌ | 3001 | Server port |
| `FRONTEND_URL` | ❌ | http://localhost:5173 | Frontend URL(s) for CORS (comma-separated for multiple origins) |
| `SESSION_SECRET` | ❌ | random | Secret key for session encryption (change in production!) |
| `ALLOW_PUBLIC_API` | ❌ | false | Allow public access to recipe browsing (`true`/`false`) |
| `NODE_ENV` | ❌ | development | Environment mode (`development`/`production`) |

### Running the Application

**Option 1: Development (Separate Servers - Recommended for Development)**

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd backend
source venv/bin/activate  # Activate Python environment
npm run dev
```
✅ Backend API on: http://localhost:3001

**Terminal 2 - Frontend Server:**
```bash
cd frontend
npm run dev
```
✅ Frontend on: http://localhost:5173

**Option 2: Production (Single Server)**

For production deployment with everything served from one port:
```bash
cd backend
npm run serve
```
✅ Everything served on: http://localhost:3001

This builds the frontend and serves both the API and static files from the same server.

**Development Setup:**
- **Frontend**: Open http://localhost:5173 in your browser
- **Backend API**: Visit http://localhost:3001/health for health check
- **Recipe Scraping**: Test with Python scraper: `cd backend && python scraper.py "https://cooking.nytimes.com/recipes/1027165-eggplant-chickpea-and-tomato-curry"`

**Production Setup:**
- **Everything**: Open http://localhost:3001 in your browser
- **API Health**: Visit http://localhost:3001/health
- **PWA Manifest**: Check http://localhost:3001/manifest.webmanifest
- **API Security**: Try accessing http://localhost:3001/api/recipes (should require auth if ALLOW_PUBLIC_API=false)

## 🏗️ Architecture

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL + TypeScript
- **Authentication**: Passport.js with session-based auth
- **Database**: PostgreSQL with connection pooling
- **Scraping**: Python + recipe-scrapers library (supports 530+ cooking websites)
- **AI Processing**: Google Gemini for text parsing and image recognition

## � Security Features

### API Protection
- **Rate Limiting**: Different limits for authenticated vs anonymous users
  - Authenticated: 2,000 requests/15min (production), 10,000 (development)
  - Anonymous: 500 requests/15min (production), 2,000 (development)
- **CORS Protection**: Only allowed origins can access the API
- **Session-Based Auth**: Secure cookie authentication with httpOnly flags
- **Configurable Public Access**: Control public API access with `ALLOW_PUBLIC_API`

### Expensive Operations Protection
- **AI Parsing**: 50 requests/hour for authenticated users, 5 for anonymous
- **Recipe Scraping**: Same limits as AI parsing to prevent abuse
- **Cost Protection**: Prevents excessive API usage and associated costs

### Environment-Based Security
- **Production Mode**: Stricter CORS, higher rate limits for authenticated users
- **Development Mode**: More permissive for easier testing
- **Configurable Origins**: Set allowed domains via `FRONTEND_URL`

## �🔐 Authentication Features

### User Management
- Email/password registration and login
- Secure password hashing with bcrypt
- Session-based authentication with cookies
- Google OAuth integration

### Household System
- Single household per user (extensible to multiple)
- Create household with unique invite codes
- Join household using invite code
- Leave household functionality

### Recipe Privacy Levels
1. **Private**: Recipes shared within your household (if you have one) or kept personal (if you don't have a household)
2. **Public**: Everyone can see your recipes

### Smart Features
- **Smart Privacy Defaults**: Recipes default to public unless name already exists
- **Name Uniqueness**: No duplicate public recipe names allowed
- **Household Sharing**: If you're in a household, private recipes are automatically shared with household members
- **Recipe Copying**: Copy public recipes to your private collection
- **Unified Collection**: "Recipes" shows your private recipes (personal + household)

## 📁 Project Structure

```
recipeapp/
├── frontend/          # React application
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Express API server
│   ├── src/
│   ├── venv/          # Python virtual environment
│   ├── scraper.py     # Python recipe scraper
│   ├── package.json
│   └── data/          # PostgreSQL data directory
└── README.md          # This file
```

## 🔧 Development

### Backend Scripts
```bash
cd backend
npm run dev      # Development server with auto-reload
npm run build    # TypeScript compilation
npm run start    # Production server
npm test         # Run tests
```

### Frontend Scripts
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
npm test         # Run tests
```

### Environment Setup Notes

- **Node.js Version**: Frontend requires Node 20.19+. Backend works with Node 18.x
- **Python Environment**: Recipe scraping requires a Python virtual environment with the `recipe-scrapers` library
- **Database**: PostgreSQL database needs to be initialized with `npm run init-postgres`

## � Deployment

### Production Deployment

1. **Build and run with single server:**
   ```bash
   cd backend
   npm run serve
   ```

2. **Environment variables for production:**
   ```bash
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   ALLOW_PUBLIC_API=false  # or true based on your preference
   SESSION_SECRET=your-secure-random-secret-here
   ```

3. **Using a reverse proxy (nginx example):**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **SSL/HTTPS**: Configure SSL certificates for PWA installation and security

## �🐛 Troubleshooting

### Common Issues

1. **Python virtual environment errors:**
   - Ensure `python3.12-venv` is installed: `sudo apt install python3.12-venv`
   - Recreate environment: `rm -rf backend/venv && cd backend && python3 -m venv venv`

2. **Node.js engine warnings:**
   - These are warnings about preferred Node versions but the app should still work
   - Consider upgrading to Node 20+ for optimal compatibility

3. **Port conflicts:**
   - Backend: Change `PORT` in backend/.env file
   - Frontend: Vite will automatically try alternative ports (5174, 5175, etc.)

### Getting Help

- Check individual README files in `backend/` and `frontend/` directories for detailed information
- Backend API documentation available in `backend/README.md`

---

*Recipe Reaper: Making cooking less grim, one recipe at a time.*
