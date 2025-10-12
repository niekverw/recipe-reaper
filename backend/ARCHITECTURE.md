# Backend Architecture

## Layer Separation

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP/Express Routes                   │
│                   (routes/*.ts)                          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                     Controllers                          │
│          (controllers/*.ts)                              │
│  - Handle HTTP requests/responses                        │
│  - Input validation                                      │
│  - Delegate to services                                  │
│                                                           │
│  Examples:                                               │
│  • recipeController (667 lines)                          │
│  • authController (274 lines)                            │
└──────────┬─────────────────────────┬────────────────────┘
           │                         │
           ▼                         ▼
┌──────────────────────┐   ┌──────────────────────┐
│    Services Layer    │   │   Utilities Layer    │
│  (services/*.ts)     │   │   (utils/*.ts)       │
│                      │   │                      │
│ Business Logic:      │   │ Pure Functions:      │
│ • authService        │   │ • recipeHelpers      │
│ • authorizationSvc   │   │ • ingredientParser   │
│ • scraperService     │   │ • languageHelper     │
│ • geminiService      │   │ • tagHelper          │
│ • imageService       │   │                      │
│ • recipeEnhancement  │   │ No side effects      │
│                      │   │ Easy to test         │
└──────────┬───────────┘   └──────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│                      Models Layer                        │
│                   (models/*.ts)                          │
│  - Data access                                           │
│  - Database operations                                   │
│  - Data transformation                                   │
│                                                           │
│  Examples:                                               │
│  • recipeModel - Recipe CRUD                             │
│  • userModel - User management                           │
│  • householdModel - Household operations                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Database Layer                        │
│              PostgreSQL (database-pg.ts)                 │
│  - Connection pooling                                    │
│  - Query execution                                       │
│  - Transaction management                                │
└─────────────────────────────────────────────────────────┘
```

## Module Dependencies

### Controllers depend on:
- Services (business logic)
- Models (data access)
- Utilities (helpers)
- Middleware (auth, error handling)

### Services depend on:
- Other services (composition)
- Models (data access)
- External APIs (Gemini, image processing)
- Utilities (helpers)

### Utilities depend on:
- Nothing (pure functions)
- May use constants/configs

### Models depend on:
- Database layer
- Type definitions

## Request Flow Example

### Recipe Creation Flow

```
1. POST /api/recipes
   │
   ▼
2. recipeRoutes
   │ - Authentication middleware
   │ - Request validation
   │
   ▼
3. recipeController.createRecipe()
   │ - Extract request data
   │ - Validate language (using languageHelper)
   │ - Check authorization
   │
   ▼
4. recipeModel.create()
   │ - Parse ingredients (using ingredientParser)
   │ - Categorize (using IngredientCategoryParser)
   │ - Insert to database
   │
   ▼
5. PostgreSQL Database
   │ - Store recipe data
   │ - Return created recipe
   │
   ▼
6. Response to client
   - JSON with recipe data
```

### Recipe Scraping Flow

```
1. POST /api/recipes/scrape
   │
   ▼
2. recipeController.scrapeRecipe()
   │ - Validate URL
   │
   ▼
3. scraperService.scrapeRecipe()
   │ - Spawn Python process
   │ - Parse recipe-scrapers output
   │
   ▼
4. geminiService.parseRecipeText()
   │ - Enhance with AI
   │ - Translate if needed
   │
   ▼
5. imageService.downloadAndStoreImageFromUrl()
   │ - Download external image
   │ - Optimize and resize
   │ - Generate blur placeholder
   │
   ▼
6. Recipe data transformation
   │ - Use recipeHelpers.normalizeArray()
   │ - Use recipeHelpers.parseServings()
   │
   ▼
7. Return formatted recipe data
```

## Service Interaction Patterns

### Singleton Services

All services are exported as singletons:

```typescript
export class MyService {
  // Service implementation
}

export const myService = new MyService()
```

**Benefits:**
- Consistent instance across app
- Easy to mock in tests
- Simple dependency management

### Service Composition

Services can use other services:

```typescript
class RecipeController {
  async updateRecipe(req, res) {
    // Use authorization service
    const canEdit = await authorizationService.canEditRecipe(...)
    
    // Use image service
    if (imageUrl) {
      const image = await imageService.downloadAndStoreImageFromUrl(...)
    }
    
    // Use model
    const recipe = await recipeModel.update(...)
  }
}
```

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock dependencies
- Fast execution
- No database required

```typescript
// Example: Testing authService
jest.mock('../models/userModel')
test('should validate email', () => {
  const result = authService.validateRegistration(...)
  expect(result.valid).toBe(true)
})
```

### Integration Tests
- Test full request/response cycle
- Real services (mocked external APIs)
- Database required
- Test controller + service + model

```typescript
// Example: Testing recipe creation
test('POST /api/recipes', async () => {
  const response = await request(app)
    .post('/api/recipes')
    .send(recipeData)
  expect(response.status).toBe(201)
})
```

## Error Handling

Errors flow through middleware:

```
Controller → Service → throws Error
              │
              ▼
     errorHandler middleware
              │
              ▼
        JSON response
```

## Best Practices

### Controllers
✅ Thin - delegate to services
✅ Handle HTTP concerns only
✅ No business logic
✅ No direct database access

### Services
✅ Contain business logic
✅ Reusable across controllers
✅ Testable independently
✅ Single responsibility

### Utilities
✅ Pure functions
✅ No side effects
✅ No dependencies
✅ Easily testable

### Models
✅ Data access only
✅ SQL queries
✅ Data transformation
✅ No business logic

## Key Design Principles

1. **Separation of Concerns**
   - Each layer has distinct responsibility
   - Clear boundaries between layers

2. **Single Responsibility**
   - Each module does one thing well
   - Easy to understand and maintain

3. **Dependency Injection**
   - Services can be mocked
   - Flexible architecture

4. **DRY (Don't Repeat Yourself)**
   - Reusable services
   - Shared utilities

5. **SOLID Principles**
   - Open for extension
   - Closed for modification
   - Interface segregation
