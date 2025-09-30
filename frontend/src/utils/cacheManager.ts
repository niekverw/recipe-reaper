// IndexedDB-based caching utility for offline functionality
import packageJson from '../../package.json'

interface CacheEntry<T = any> {
  key: string
  data: T
  timestamp: number
  expiresAt?: number
  version: string
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  version?: string // Cache version for invalidation
}

class CacheDB {
  private db: IDBDatabase | null = null
  private readonly dbName = 'RecipeAppCache'
  private readonly version = 1
  readonly stores = {
    recipes: 'recipes',
    apiResponses: 'apiResponses'
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Recipes store
        if (!db.objectStoreNames.contains(this.stores.recipes)) {
          const recipesStore = db.createObjectStore(this.stores.recipes, { keyPath: 'key' })
          recipesStore.createIndex('timestamp', 'timestamp')
          recipesStore.createIndex('expiresAt', 'expiresAt')
        }

        // API responses store
        if (!db.objectStoreNames.contains(this.stores.apiResponses)) {
          const apiStore = db.createObjectStore(this.stores.apiResponses, { keyPath: 'key' })
          apiStore.createIndex('timestamp', 'timestamp')
          apiStore.createIndex('expiresAt', 'expiresAt')
        }
      }
    })
  }

  private ensureDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('CacheDB not initialized. Call init() first.')
    }
    return this.db
  }

  async set<T>(storeName: string, key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const db = this.ensureDB()
    const { ttl, version = packageJson.version } = options

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
      version
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(entry)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = request.result

        if (!entry) {
          resolve(null)
          return
        }

        // Check if entry has expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          // Remove expired entry
          this.delete(storeName, key).catch(console.error)
          resolve(null)
          return
        }

        resolve(entry.data)
      }
    })
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clear(storeName: string): Promise<void> {
    const db = this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async keys(storeName: string): Promise<string[]> {
    const db = this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAllKeys()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result as string[])
    })
  }

  // Clean up expired entries
  async cleanup(storeName: string): Promise<void> {
    const db = this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const index = store.index('expiresAt')
      const range = IDBKeyRange.upperBound(Date.now())
      const request = index.openCursor(range)

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }
}

class CacheManager {
  private db: CacheDB
  private initialized = false

  constructor() {
    this.db = new CacheDB()
  }

  async init(): Promise<void> {
    if (this.initialized) return
    await this.db.init()
    
    // Check and invalidate old caches on version change
    await this.checkAndInvalidateOldCaches()
    
    this.initialized = true
  }

  private async checkAndInvalidateOldCaches(): Promise<void> {
    try {
      // Check if we have a stored app version
      const storedVersion = localStorage.getItem('app-cache-version')
      const currentVersion = packageJson.version

      if (storedVersion && storedVersion !== currentVersion) {
        console.log(`App version changed from ${storedVersion} to ${currentVersion}, clearing old caches`)
        await this.clearAll()
      }

      // Clean up old cache format (recipes-{scope} without query string)
      // New format is recipes-{scope}-{queryString}
      await this.cleanupLegacyCacheKeys()

      // Store current version
      localStorage.setItem('app-cache-version', currentVersion)
    } catch (error) {
      console.error('Failed to check cache version:', error)
    }
  }

  private async cleanupLegacyCacheKeys(): Promise<void> {
    try {
      const keys = await this.db.keys(this.db.stores.apiResponses)
      // Old format: recipes-my, recipes-public, recipes-all
      // New format: recipes-my-default, recipes-my-sortBy=name, etc
      const legacyKeys = keys.filter((key) => {
        // Match keys like "recipes-my" or "recipes-public" or "recipes-all" (no third part)
        const parts = key.split('-')
        return parts.length === 2 && key.startsWith('recipes-')
      })

      if (legacyKeys.length > 0) {
        console.log(`Cleaning up ${legacyKeys.length} legacy cache keys`)
        await Promise.all(
          legacyKeys.map((key) => this.db.delete(this.db.stores.apiResponses, key))
        )
      }
    } catch (error) {
      console.warn('Failed to cleanup legacy cache keys:', error)
    }
  }

  // Recipe-specific caching methods
  async cacheRecipes(recipes: any[], scope: string = 'all'): Promise<void> {
    await this.init()
    const cacheKey = `recipes-${scope}`
    await this.db.set(this.db.stores.apiResponses, cacheKey, recipes, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      version: packageJson.version
    })
  }

  async getCachedRecipes(scope: string = 'all'): Promise<any[] | null> {
    await this.init()
    const cacheKey = `recipes-${scope}`
    return this.db.get(this.db.stores.apiResponses, cacheKey)
  }

  async cacheRecipe(recipe: any): Promise<void> {
    await this.init()
    const cacheKey = `recipe-${recipe.id}`
    await this.db.set(this.db.stores.recipes, cacheKey, recipe, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      version: packageJson.version
    })
  }

  async getCachedRecipe(id: string): Promise<any | null> {
    await this.init()
    const cacheKey = `recipe-${id}`
    return this.db.get(this.db.stores.recipes, cacheKey)
  }

  async removeCachedRecipe(id: string): Promise<void> {
    await this.init()
    const cacheKey = `recipe-${id}`
    await this.db.delete(this.db.stores.recipes, cacheKey)
  }

  // Shopping list-specific caching methods
  async cacheShoppingList(shoppingList: any[]): Promise<void> {
    await this.init()
    const cacheKey = 'shopping-list'
    await this.db.set(this.db.stores.apiResponses, cacheKey, shoppingList, {
      ttl: 60 * 60 * 1000, // 1 hour - shopping lists change more frequently
      version: packageJson.version
    })
  }

  async getCachedShoppingList(): Promise<any[] | null> {
    await this.init()
    const cacheKey = 'shopping-list'
    return this.db.get(this.db.stores.apiResponses, cacheKey)
  }

  async invalidateShoppingListCache(): Promise<void> {
    await this.init()
    const cacheKey = 'shopping-list'
    await this.db.delete(this.db.stores.apiResponses, cacheKey)
  }

  // Generic API response caching
  async cacheApiResponse(key: string, data: any, ttl?: number): Promise<void> {
    await this.init()
    await this.db.set(this.db.stores.apiResponses, key, data, {
      ttl: ttl || 60 * 60 * 1000, // 1 hour default
      version: packageJson.version
    })
  }

  async getCachedApiResponse(key: string): Promise<any | null> {
    await this.init()
    return this.db.get(this.db.stores.apiResponses, key)
  }

  // Cleanup methods
  async clearAll(): Promise<void> {
    await this.init()
    await Promise.all([
      this.db.clear(this.db.stores.recipes),
      this.db.clear(this.db.stores.apiResponses)
    ])
  }

  async cleanupExpired(): Promise<void> {
    await this.init()
    await Promise.all([
      this.db.cleanup(this.db.stores.recipes),
      this.db.cleanup(this.db.stores.apiResponses)
    ])
  }

  async invalidateRecipeListCaches(): Promise<void> {
    await this.init()
    const keys = await this.db.keys(this.db.stores.apiResponses)
    await Promise.all(
      keys
        .filter((key) => key.startsWith('recipes-'))
        .map((key) => this.db.delete(this.db.stores.apiResponses, key))
    )
  }

  // Direct cache update methods for optimistic updates
  async addRecipeToCaches(recipe: any, userScope: 'my' | 'public' | 'all' = 'my'): Promise<void> {
    await this.init()

    console.log(`[Cache] Adding recipe ${recipe.id} to caches (scope: ${userScope})`)

    // Cache the individual recipe
    await this.cacheRecipe(recipe)

    // Update recipe list caches
    const keys = await this.db.keys(this.db.stores.apiResponses)
    const recipeListKeys = keys.filter((key) => key.startsWith('recipes-'))

    console.log(`[Cache] Found ${recipeListKeys.length} recipe list caches:`, recipeListKeys)

    for (const key of recipeListKeys) {
      const cachedRecipes = await this.db.get(this.db.stores.apiResponses, key)
      if (cachedRecipes && Array.isArray(cachedRecipes)) {
        // Extract scope from key like 'recipes-my-default' or 'recipes-public-sortBy=name'
        // Key format: recipes-{scope}-{queryString}
        const parts = key.split('-')
        const keyScope = parts[1] // 'my', 'public', or 'all'

        // Add to appropriate caches based on scope
        // Add to 'my' scope if recipe is for current user
        // Add to 'public' scope if recipe is public
        // Add to 'all' scope always
        const shouldAddToCache =
          keyScope === 'all' ||
          (keyScope === 'my' && userScope === 'my') ||
          (keyScope === 'public' && userScope === 'public')

        if (shouldAddToCache) {
          // Check if recipe already exists (avoid duplicates)
          const existingIndex = cachedRecipes.findIndex((r: any) => r.id === recipe.id)
          if (existingIndex === -1) {
            // Add to beginning of list (most recent first)
            const updatedRecipes = [recipe, ...cachedRecipes]
            await this.db.set(this.db.stores.apiResponses, key, updatedRecipes, {
              ttl: 24 * 60 * 60 * 1000,
              version: packageJson.version
            })
            console.log(`[Cache] ✓ Added recipe to cache: ${key}`)
          } else {
            console.log(`[Cache] ⊘ Recipe already exists in cache: ${key}`)
          }
        } else {
          console.log(`[Cache] ⊗ Skipped cache (scope mismatch): ${key}`)
        }
      }
    }

    console.log(`[Cache] Finished adding recipe to all caches`)
  }

  async updateRecipeInCaches(recipe: any): Promise<void> {
    await this.init()

    // Update the individual recipe cache
    await this.cacheRecipe(recipe)

    // Update in all recipe list caches
    const keys = await this.db.keys(this.db.stores.apiResponses)
    const recipeListKeys = keys.filter((key) => key.startsWith('recipes-'))

    for (const key of recipeListKeys) {
      const cachedRecipes = await this.db.get(this.db.stores.apiResponses, key)
      if (cachedRecipes && Array.isArray(cachedRecipes)) {
        const index = cachedRecipes.findIndex((r: any) => r.id === recipe.id)
        if (index !== -1) {
          // Recipe exists in this cache, update it
          const updatedRecipes = [...cachedRecipes]
          updatedRecipes[index] = recipe
          await this.db.set(this.db.stores.apiResponses, key, updatedRecipes, {
            ttl: 24 * 60 * 60 * 1000,
            version: packageJson.version
          })
        }
      }
    }
  }

  async removeRecipeFromCaches(recipeId: string): Promise<void> {
    await this.init()

    // Remove the individual recipe cache
    await this.removeCachedRecipe(recipeId)

    // Remove from all recipe list caches
    const keys = await this.db.keys(this.db.stores.apiResponses)
    const recipeListKeys = keys.filter((key) => key.startsWith('recipes-'))

    for (const key of recipeListKeys) {
      const cachedRecipes = await this.db.get(this.db.stores.apiResponses, key)
      if (cachedRecipes && Array.isArray(cachedRecipes)) {
        const filtered = cachedRecipes.filter((r: any) => r.id !== recipeId)
        if (filtered.length !== cachedRecipes.length) {
          // Recipe was in this cache, update it
          await this.db.set(this.db.stores.apiResponses, key, filtered, {
            ttl: 24 * 60 * 60 * 1000,
            version: packageJson.version
          })
        }
      }
    }
  }
}

export const cacheManager = new CacheManager()