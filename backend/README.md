# Recipe App Backend

A Node.js/Express API for managing recipes with web scraping capabilities.

## Quick Setup

**1. Install Node.js dependencies:**
```bash
npm install
```

**2. Set up Python scraper:**
```bash
python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt
```

**3. Start the server:**
```bash
npm run dev  # Development with auto-reload
# or
npm start    # Production build
```

**Test scraping:**
```bash
python scraper.py "https://cooking.nytimes.com/recipes/1027165-eggplant-chickpea-and-tomato-curry"
```

## API Endpoints

### Recipes
- `GET /api/recipes` - List recipes (with filtering)
- `POST /api/recipes` - Create recipe
- `GET /api/recipes/:id` - Get recipe by ID
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `POST /api/recipes/scrape` - Scrape recipe from URL

### Ingredients
- `POST /api/ingredients/parse` - Parse ingredient strings
- `POST /api/ingredients/scale` - Scale ingredient quantities
- `POST /api/ingredients/parse-text` - Parse from multiline text

### Health
- `GET /health` - Server health check

## Features

### Recipe Management
- Full CRUD operations for recipes
- SQLite database with proper schema
- Filtering and search capabilities
- Public/private recipe visibility

### Web Scraping
- Scrape recipes from 530+ cooking websites
- Uses Python `recipe-scrapers` library
- Extracts: ingredients, instructions, times, ratings, nutrients
- Supports AllRecipes, NYT Cooking, BBC Good Food, etc.

### Ingredient Processing
- Parse ingredient strings into structured data
- Scale recipes up/down
- Handle various measurement formats

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
- SQLite database (`recipes.db`)
- Auto-initialized on server start
- Tables: recipes (with full metadata)

### Architecture
```
Express API → Controllers → Models → SQLite Database
                    ↓
            Python Scraper (for web scraping)
```

### Environment
- **Port:** 3001 (configurable via `PORT`)
- **Frontend URLs:** localhost:5173-5175 (configurable via `FRONTEND_URL`)
- **Database:** `./recipes.db`

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

### Dependencies

**Python Dependencies:**
- `recipe-scrapers` - Main scraping library (see `requirements.txt`)
- Dependencies are automatically installed via pip

**Node.js Dependencies:**
- Standard Node.js packages (see `package.json`)
- No additional Python-related packages needed

### Environment Variables

No environment variables are required for the Python scraper functionality. The virtual environment path is resolved relative to the backend directory.

### Version Control

- **Commit these files:**
  - `requirements.txt` - Python dependencies
  - `scraper.py` - Python scraper script
  - This README

- **Do not commit:**
  - `venv/` directory (should be in `.gitignore`)
  - Any `__pycache__/` directories

The virtual environment should be recreated locally using the setup instructions above.