# Recipe App Backend

A comprehensive Node.js/Express API for recipe management, web scraping, AI-powered recipe parsing, and intelligent ingredient categorization with 377+ ingredients across grocery store sections.

## Quick Run: 
```bash
cd /home/tafelplankje/repos/recipeapp/backend && npm run serve:tunnel
```

## Quick Setup

**1. Install Node.js dependencies:**
```bash
npm install
```

**2. Set up Python scraper:**
```bash
python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

**3. Set up ingredient categorizer (optional - for development):**
```bash
cd ../packages/ingredient-categorizer && npm install
```

**4. Start the server:**
```bash
cd ../backend  # Return to backend directory
npm run dev    # Development with auto-reload
# or
npm start      # Production build
```

**Test scraping:**
```bash
python scraper.py "https://cooking.nytimes.com/recipes/1027165-eggplant-chickpea-and-tomato-curry"
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile
- `GET /api/auth/status` - Check authentication status
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `PATCH /api/auth/translation-preference` - Update user's default translation language

### Recipes
- `GET /api/recipes` - List recipes (with filtering)
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/:id` - Get recipe by ID
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/scrape` - Scrape recipe from URL
- `GET /api/recipes/tags` - Get all unique tags
- `GET /api/recipes/check-name` - Check if recipe name exists
- `POST /api/recipes/parse-text-gemini` - Parse recipe from text (Gemini)
- `POST /api/recipes/parse-image` - Parse recipe from image
- `POST /api/recipes/upload-image` - Upload recipe image
- `DELETE /api/recipes/delete-image/:filename` - Delete uploaded image
- `POST /api/recipes/:id/copy` - Copy a recipe
- `POST /api/recipes/:id/enhance` - Enhance recipe with AI

### Ingredients
- `POST /api/ingredients/parse` - Parse ingredient strings
- `POST /api/ingredients/scale` - Scale ingredient quantities
- `POST /api/ingredients/parse-text` - Parse from multiline text

### Households
- `POST /api/households` - Create new household
- `POST /api/households/join` - Join household by invite code
- `POST /api/households/leave` - Leave current household
- `GET /api/households/current` - Get current user's household
- `POST /api/households/regenerate-invite` - Regenerate invite code

### Shopping List
- `GET /api/shopping-list` - Get user's shopping list
- `POST /api/shopping-list` - Add ingredients to shopping list
- `PUT /api/shopping-list/:id` - Update shopping list item
- `DELETE /api/shopping-list/:id` - Remove item from shopping list
- `DELETE /api/shopping-list/completed` - Clear completed items
- `DELETE /api/shopping-list` - Clear all items

### Health
- `GET /health` - Server health check

## Features

### Recipe Management
- Full CRUD operations for recipes
- PostgreSQL database with proper schema
- Filtering and search capabilities
- Public/private recipe visibility

### Performance & Delivery
- Gzip/deflate compression for API responses and static assets
- Optimized image handling with Sharp for recipe uploads

### Web Scraping
- Scrape recipes from 530+ cooking websites
- Uses Python `recipe-scrapers` library
- Extracts: ingredients, instructions, times, ratings, nutrients
- Supports AllRecipes, NYT Cooking, BBC Good Food, etc.

### Ingredient Processing
- Parse ingredient strings into structured data
- Scale recipes up/down
- Handle various measurement formats
- **Smart ingredient categorization** for grocery shopping
- Support for 377+ ingredient types across categories (produce, dairy, meats, pantry items, etc.)

### AI-Powered Features
- **Recipe parsing** from text and images using Google Gemini 2.5-flash-lite
- **Recipe enhancement** with AI-generated improvements and suggestions
- **Translation and language detection** 
- **Intelligent ingredient extraction** from natural language descriptions

### AI Services Integration

The backend uses Google Gemini for intelligent recipe processing:

#### Google Gemini 2.5-flash-lite (`geminiService.ts`, `recipeEnhancementService.ts`)
- **Primary use**: Recipe parsing from text and images, recipe enhancement
- **Advanced features**: Can process both text and image inputs for recipes
- **Configuration**: Requires `GEMINI_API_KEY` environment variable

#### Error Handling
- Comprehensive error logging and user feedback
- Rate limiting and retry logic for API calls

### Ingredient Categorization
- Automatic categorization of ingredients for shopping lists
- Grocery store section mapping (produce, dairy, meats, pantry, etc.)
- Extensible ingredient database with keyword matching
- Supports plant-based alternatives and international ingredients

## Development

### Scripts
```bash
npm run dev      # Development server with nodemon
npm run build    # TypeScript compilation
npm run start    # Production server
npm test         # Run tests
npm run test:watch    # Watch mode tests
npm run test:coverage # Test coverage
```

### Database
- PostgreSQL database with connection pooling
- Initialized with `npm run init-postgres`
- Tables: recipes, users, households (with full metadata)

### Architecture
```
Express API → Controllers → Models → PostgreSQL Database
                    ↓                    ↓
            Python Scraper     Ingredient Categorizer
            (web scraping)     (shopping categorization)
```

### Environment
- **Port:** 3001 (configurable via `PORT`)
- **Frontend URLs:** localhost:5173-5175 (configurable via `FRONTEND_URL`)
- **Database:** PostgreSQL (configured via environment variables)

## Python Scraper Details

### Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### Updating
```bash
source venv/bin/activate
pip install --upgrade recipe-scrapers
```

### Testing
```bash
python scraper.py "https://example.com/recipe-url"
```

## Project Structure
```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── scraper.py          # Python scraping script
├── requirements.txt    # Python dependencies
├── package.json        # Node.js dependencies
└── README.md          # This file

packages/
└── ingredient-categorizer/  # Ingredient categorization package
    ├── src/
    │   ├── data/           # Ingredient database (ingredients.json)
    │   ├── index.ts        # Main categorization logic
    │   └── types.ts        # Type definitions
    ├── tests/              # Unit tests
    ├── package.json        # Package configuration
    └── README.md          # Package documentation
```

## Overview

The recipe scraping functionality uses the [`recipe-scrapers`](https://github.com/hhursev/recipe-scrapers) Python library, which supports over 530 cooking websites including AllRecipes, BBC Good Food, NYT Cooking, and many more.

### What It Does

- **Extracts structured recipe data** from cooking websites
- **Returns consistent JSON format** regardless of source website
- **Handles website parsing** automatically (HTML, Schema.org, OpenGraph)
- **Provides rich metadata** (ingredients, instructions, times, ratings, nutrients)

### Why Python?

- The `recipe-scrapers` library is the most comprehensive recipe scraping solution
- It supports 530+ websites with a single API
- Better at handling complex website structures than JavaScript alternatives
- Actively maintained with regular updates for new websites

### Architecture

```
Node.js API → Python scraper.py → recipe-scrapers library → Website → JSON response
```

The Node.js backend calls the Python script via `child_process.spawn()`, which returns JSON data that gets transformed and sent to the frontend.

## Python Scraper Setup

### Initial Setup

1. **Create Python Virtual Environment**
   ```bash
   cd backend
   python3 -m venv venv
   ```

2. **Activate Virtual Environment**
   ```bash
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

   Or install directly:
   ```bash
   pip install recipe-scrapers
   ```

### Quick Setup (One Command)

For new developers, you can set up the entire Python environment with:

```bash
cd backend
python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

### Verifying Installation

Test the scraper with a sample recipe URL:
```bash
python scraper.py "https://cooking.nytimes.com/recipes/1027165-eggplant-chickpea-and-tomato-curry"
```

You should see JSON output with recipe data.

### Package Updates

The `recipe-scrapers` package is actively maintained and regularly updated with support for new websites and bug fixes.

#### Checking for Updates

1. **Check current version:**
   ```bash
   source venv/bin/activate
   pip show recipe-scrapers
   ```

2. **Check for available updates:**
   ```bash
   pip list --outdated
   ```

#### Updating the Package

1. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

2. **Update using pip:**
   ```bash
   pip install --upgrade recipe-scrapers
   ```

   Or update requirements.txt and reinstall:
   ```bash
   # Edit requirements.txt to update version
   pip install -r requirements.txt
   ```

3. **Verify the update:**
   ```bash
   pip show recipe-scrapers
   ```

4. **Test functionality:**
   ```bash
   python scraper.py "https://cooking.nytimes.com/recipes/1027165-eggplant-chickpea-and-tomato-curry"
   ```

#### Breaking Changes

- **Major version updates** (e.g., 14.x → 15.x) may include breaking changes
- Always check the [changelog](https://github.com/hhursev/recipe-scrapers/blob/main/CHANGELOG.md) before updating
- Test thoroughly after major updates, especially if the API has changed

### Development Workflow

**Daily development:**
```bash
# Activate environment (do this whenever you start working)
source venv/bin/activate

# Test scraper with any recipe URL
python scraper.py "https://www.allrecipes.com/recipe/12345/some-recipe/"

# Run backend normally
npm run dev
```

**When pulling latest changes:**
```bash
git pull
source venv/bin/activate
pip install -r requirements.txt  # In case dependencies changed
```

**When switching projects:**
```bash
deactivate  # Exit virtual environment
```

### Supported Websites

The scraper supports over 530 cooking websites. Check the [full list](https://docs.recipe-scrapers.com/getting-started/supported-sites/) for supported sites.

Popular supported sites include:
- AllRecipes
- BBC Good Food
- Bon Appétit
- Epicurious
- Food Network
- NYT Cooking
- Serious Eats
- And many more...

### Troubleshooting

#### Common Issues

1. **"ModuleNotFoundError" when running scraper:**
   - Ensure virtual environment is activated
   - Reinstall dependencies: `pip install -r requirements.txt` (if you create one)

2. **Scraper fails on certain websites:**
   - Some websites may have changed their structure
   - Check if `recipe-scrapers` has been updated to support the site
   - Verify the URL is correct and accessible

3. **Python process hangs or times out:**
   - Some websites may be slow to respond
   - The scraper has built-in timeouts, but very slow sites may cause issues

#### Virtual Environment Issues

If you encounter issues with the virtual environment:

1. **Recreate the environment:**
   ```bash
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install recipe-scrapers
   ```

2. **Different Python versions:**
   - Ensure you're using Python 3.8+ (check with `python --version`)
   - The virtual environment should inherit the correct Python version

### Development Notes

- The Python scraper (`scraper.py`) is called from Node.js using `child_process.spawn()`
- The scraper returns JSON data that gets transformed by the TypeScript controller
- Error handling is implemented both in Python and Node.js layers
- The scraper respects website terms of service and doesn't circumvent bot protection

## Ingredient Categorizer Package

The ingredient categorization functionality is implemented as a separate TypeScript package that provides intelligent categorization of ingredients for grocery shopping lists.

### What It Does

- **Categorizes ingredients** into grocery store sections (produce, dairy, meats, pantry, etc.)
- **Keyword-based matching** against a comprehensive ingredient database
- **Extensible design** - easy to add new ingredients and categories
- **Supports multiple variations** of ingredient names (e.g., "scallions" = "green onions")
- **Recently updated** with plant-based proteins, fermented foods, and specialty greens

### Database Structure

The ingredient database (`packages/ingredient-categorizer/src/data/ingredients.json`) contains 377+ ingredients with the following structure:

```json
{
  "displayName": "Tomatoes",
  "category": "PRODUCE",
  "keywords": ["tomato", "cherry tomato", "roma tomato", "fresh tomato"],
  "excludeKeywords": ["canned", "paste", "sauce"]
}
```

**Categories include:**
- **PRODUCE** (fruits, vegetables, herbs, specialty greens)
- **DAIRY_EGGS** (milk, cheese, eggs, yogurt, fermented dairy)
- **MEAT_SEAFOOD** (beef, chicken, fish, pork, plant-based alternatives)
- **GRAINS_PASTA** (rice, pasta, grains, legumes, pseudocereals)
- **PANTRY** (oils, spices, canned goods, condiments, baking essentials)
- **SNACKS_BEVERAGES** (nuts, seeds, snacks, drinks, specialty items)

### Usage

The categorizer is used by the backend API to automatically organize shopping lists by grocery store sections, making shopping more efficient.

### Adding New Ingredients

To add new ingredients to the database:

1. Edit `packages/ingredient-categorizer/src/data/ingredients.json`
2. Add a new object with `displayName`, `category`, and `keywords` array
3. Optionally add `excludeKeywords` to prevent false matches
4. Run tests to ensure JSON validity

### Dependencies

**Python Dependencies:**
- `recipe-scrapers` - Main scraping library (see `requirements.txt`)
- Dependencies are automatically installed via pip

**Node.js Dependencies:**
- Standard Node.js packages (see `package.json`)
- No additional Python-related packages needed

**Ingredient Categorizer:**
- TypeScript package with comprehensive ingredient database
- No external runtime dependencies
- Uses JSON data file for ingredient definitions

### Environment Variables

No environment variables are required for the Python scraper functionality. The virtual environment path is resolved relative to the backend directory.

### API Configuration

The backend integrates with several external APIs for enhanced functionality:

#### Required Environment Variables
```bash
# AI Services (required for recipe parsing)
GEMINI_API_KEY=your_gemini_api_key_here          # Required - gemini-2.5-flash-lite

# Google OAuth (required for user authentication)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Database (required)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recipeapp
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Security (required)
SESSION_SECRET=your-secure-random-session-secret-here
```

#### Optional Environment Variables
```bash
PORT=3001                                      # Server port
NODE_ENV=development                           # Environment mode
FRONTEND_URL=http://localhost:5173             # CORS allowed origins
ALLOW_PUBLIC_API=false                         # Public API access control
```

### Version Control

- **Commit these files:**
  - `requirements.txt` - Python dependencies
  - `scraper.py` - Python scraper script
  - `packages/ingredient-categorizer/src/data/ingredients.json` - Ingredient database
  - `packages/ingredient-categorizer/package.json` - Package configuration
  - This README

- **Do not commit:**
  - `venv/` directory (should be in `.gitignore`)
  - Any `__pycache__/` directories
  - `packages/ingredient-categorizer/node_modules/` (if present)

The virtual environment should be recreated locally using the setup instructions above.