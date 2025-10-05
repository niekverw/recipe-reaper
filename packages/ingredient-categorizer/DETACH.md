# Detaching as Standalone Repository

This document explains how to extract the `@ingredient-categorizer/core` package into its own repository when ready.

## Prerequisites

- Git installed
- npm account (for publishing to npm registry)
- GitHub account (or other git hosting)

## Steps to Detach

### 1. Create New Repository

```bash
# Create new directory for standalone repo
mkdir ingredient-categorizer
cd ingredient-categorizer

# Initialize git
git init
```

### 2. Copy Package Contents

```bash
# Copy entire package directory (excluding node_modules)
cp -r /path/to/recipeapp/packages/ingredient-categorizer/* .
cp /path/to/recipeapp/packages/ingredient-categorizer/.* . 2>/dev/null || true

# Remove any workspace-specific files
rm -rf node_modules
```

### 3. Update package.json

Remove the `"private": true` flag and update repository URL:

```json
{
  "name": "@ingredient-categorizer/core",
  "version": "1.0.0",
  "private": false,  // Remove or set to false
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/ingredient-categorizer.git"
  }
}
```

### 4. Set Up GitHub Actions (Optional)

Create `.github/workflows/test.yml`:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

Create `.github/workflows/publish.yml`:

```yaml
name: Publish

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 5. Commit and Push

```bash
git add .
git commit -m "Initial commit: Extract ingredient-categorizer from monorepo"
git remote add origin git@github.com:yourusername/ingredient-categorizer.git
git push -u origin main
```

### 6. Publish to npm

```bash
# Login to npm (one time)
npm login

# Publish package
npm publish --access public
```

### 7. Update Recipe App to Use Published Package

In the recipe app's `backend/package.json`:

```json
{
  "dependencies": {
    "@ingredient-categorizer/core": "^1.0.0"  // Use published version instead of file:
  }
}
```

Then run:
```bash
cd /path/to/recipeapp
npm install
```

## Versioning Strategy

Use semantic versioning:
- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features, backwards compatible
- **Patch (1.0.0 → 1.0.1)**: Bug fixes

## Maintenance After Detach

### Adding New Ingredients

1. Edit `src/data/ingredients.json` in the standalone repo
2. Run tests: `npm test`
3. Bump version: `npm version patch` (or minor/major)
4. Create git tag: `git push --tags`
5. Publish: `npm publish`
6. Update recipe app: `npm update @ingredient-categorizer/core`

### Development Workflow

For local development with the recipe app:

```bash
# In ingredient-categorizer repo
npm link

# In recipe app backend
npm link @ingredient-categorizer/core
```

When done:
```bash
# In recipe app backend
npm unlink @ingredient-categorizer/core
npm install
```

## Benefits of Standalone Repository

- ✅ Independent versioning and releases
- ✅ Can be used in other projects
- ✅ Easier to accept community contributions
- ✅ Dedicated issue tracking
- ✅ Cleaner git history
- ✅ Potential for open source community growth

## Keeping in Monorepo

If you decide to keep it in the monorepo:
- Already set up as workspace package
- Easy to develop alongside recipe app
- Shared tooling and CI
- Single `npm install` for everything
