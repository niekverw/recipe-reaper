# Recipe App Strategy

## Overview
A web recipe management app with import capabilities, ingredient scaling, and cross-platform compatibility.

## Core Features

### Recipe Import System
1. **Manual Import**
   - Traditional form-based recipe entry
   - Rich text editor for steps and descriptions
   - Multi-line textbox for ingredients (e.g., "1kg of potatoes\n1/2 cup of extra virgin olive oil\n2 cloves of garlic")
   - Parse ingredient text into structured format (quantity, unit, ingredient, notes)
   - Image upload for recipe photos
   - **Shared Components:** Recipe form validation, ingredient parser, image handling

2. **URL Import**
   - Web scraping with structured data (JSON-LD, microdata)
   - Target schema.org Recipe markup
   - Libraries: Cheerio (Node.js)
   - **Shared Components:** Pre-populate manual import form with scraped data

### Ingredient Management
1. **Scaling System**
   - Support scaling factors: 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4
   - Parse fractions (1½, 2/3) and convert to decimals
   - Handle edge cases: "a pinch", "to taste"

2. **Unit Conversion**
   - Pattern matching with regex for common units
   - Libraries: `convert-units` (JavaScript), `pint` (Python)
   - Database of ingredient-specific conversions
   - Support original, metric, and US customary units

### Nutrition Facts
- **Primary: USDA FoodData Central API (free, comprehensive)**
- Match ingredients to food database entries
- Calculate per serving based on recipe yield
- Handle ingredient substitutions

### Shopping List
- Aggregate ingredients from multiple recipes
- Smart grouping by store sections (produce, dairy, etc.)
- Check off functionality with device sync
- Future: Integration with grocery delivery APIs

### Multi-User System
1. **Authentication**
   - Google OAuth 2.0 via Firebase Auth
   - JWT tokens for session management

2. **Permissions & Sharing**
   - Recipe visibility: private/public/shared
   - User groups with invite system
   - Collaborative editing with conflict resolution
   - Version history for shared recipes

## Technical Architecture

### Recommended Stack (Web / PWA-first)
- **Frontend:** React (Vite or Create React App) with TypeScript, using a component library (Chakra UI, Material UI, or Tailwind + headless UI) and PWA tooling
- **Progressive Web App (PWA):** Service workers, offline caching, and web manifest for installability on iPhone and Android
- **Optional Native Packaging:** Capacitor or Ionic/Capacitor to wrap the PWA for App Store / Play Store distribution if needed
- **Backend:** Node.js + Express (or NestJS) + PostgreSQL (same API surface as mobile)
- **Authentication:** Firebase Auth (Google OAuth) or Auth0; support for token-based sessions
- **Hosting:** Static hosting for frontend (Netlify, Vercel, AWS S3+CloudFront) and managed backend hosting (Heroku, EC2, Render)
- **APIs:** USDA FoodData Central

## Development Plan

### Phase 1: Foundation (Weeks 1-3)
1. **Project Setup**
   - Initialize a React + TypeScript web app (Vite recommended) with PWA plugin
   - Create a single-page app structure and design system using the chosen UI library
   - Set up Node.js/Express backend with PostgreSQL and REST API endpoints
   - Configure Firebase Auth for web (Google OAuth) and protect API routes with JWTs
   - Establish development environment, CI/CD for frontend and backend, and preview deployments (Vercel/Netlify for frontend, Render/Heroku for backend)

2. **Core Recipe Management**
   - Basic recipe CRUD operations (frontend forms + backend API)
   - PostgreSQL schema for recipes, ingredients, users
   - Web recipe form with accessible inputs and mobile-optimized layouts
   - Basic ingredient parsing (quantity, unit, ingredient)
   - Image upload handling with client-side compression and CDN-backed storage (S3 or Cloudinary)

3. **Authentication System**
   - Google OAuth integration via Firebase Auth (web)
   - User registration/login flow with responsive UI and session handling
   - Protected routes and JWT session management for backend APIs

### Phase 2: Enhanced Features (Weeks 4-6)
1. **Ingredient Scaling System**
   - Implement scaling factors (0.25x - 4x)
   - Fraction parsing and conversion
   - Handle special cases ("pinch", "to taste")

2. **Unit Conversion**
   - Integrate `convert-units` library
   - Regex pattern matching for units
   - Basic metric/US customary conversions

3. **Recipe Import via URL**
   - Web scraping with server-side Cheerio or use headless scraping where needed
   - Schema.org Recipe markup parsing and graceful fallback parsing
   - Auto-populate manual form with scraped data

### Phase 3: Advanced Features (Weeks 7-9)
1. **Nutrition Integration**
   - USDA FoodData Central API integration
   - Ingredient-to-nutrition matching
   - Per-serving nutrition calculations

2. **Shopping List System**
   - Multi-recipe ingredient aggregation
   - Smart grouping by store sections (produce, dairy, etc.)
   - Check-off functionality with local IndexedDB and optional server sync
   - Native sharing via the Web Share API where supported

3. **Multi-User & Sharing**
   - Recipe visibility controls (private/public/shared)
   - Basic user groups and invites
   - Simple collaborative editing with optimistic updates and conflict resolution

### Phase 4: Polish & Deployment (Weeks 10-12)
1. **PWA Optimization & Mobile UX**
   - Robust offline behavior using service workers and IndexedDB
   - Web manifest, icons, and splash screen for “add to home screen” experience
   - Mobile-first UI polish, touch targets, and performance tuning for Safari on iOS and Chrome on Android
   - Address iOS PWA limitations (background tasks, push notifications) with clear UX fallbacks

2. **Testing & Quality**
   - Unit tests with Jest and React Testing Library
   - E2E tests with Playwright or Cypress (mobile viewport runs)
   - Performance audits with Lighthouse and device testing on iPhone/Android devices
   - Error handling, validation, and Sentry integration

3. **Distribution & Hosting**
   - Host frontend as a static PWA on Vercel/Netlify or S3+CloudFront
   - Deploy backend to Render, Heroku, or AWS (Docker optional)
   - Optional native builds via Capacitor for App Store / Play Store

## Deployment Strategy

### Docker Containerization
To enable easy deployment across different environments, the application will still support containerization for the backend and services:

1. **Backend Container**
   - Node.js + Express application
   - PostgreSQL database (separate container)
   - Environment variables for configuration
   - Health checks and graceful shutdown

2. **Docker Compose Setup**
   - Multi-container orchestration for local development (backend + db + optional redis)
   - Persistent volumes for database data 

3. **Container Registry**
   - Docker Hub or AWS ECR for image storage
   - Automated builds via CI/CD pipeline

4. **Deployment Options**
   - **Frontend (PWA):** Static hosting on Vercel/Netlify or CDN (no container required)
   - **Backend:** Docker on ECS/Cloud Run/Render or managed services
   - **Optional:** Kubernetes for larger scale deployments

5. **Configuration Management**
   - Environment variables for database connections, API keys
   - Docker secrets for sensitive data
   - Use platform-managed secrets where possible (Render secrets, AWS Secrets Manager)

## Security & Compliance Considerations

### Data Security
- **Encryption:** TLS/HTTPS for all communications
- **Database:** Encrypted at rest, secure connection strings
- **Authentication:** OAuth 2.0 with secure token storage
- **API Security:** Rate limiting, input validation, SQL injection prevention

### Privacy & Compliance
- **GDPR Compliance:** Data export, deletion, consent management
- **Data Retention:** Clear policies for user data lifecycle

## Performance & Scalability

### Backend Optimization
- **Database:** Indexing strategy, connection pooling, query optimization
- **Caching:** Redis for frequently accessed recipes and nutrition data
- **CDN:** Image and static asset delivery
- **Load Balancing:** Horizontal scaling with multiple backend instances

### Mobile App Performance
- **Offline Support:** Local SQLite database sync (user recipes only)
- **Image Optimization:** Multiple resolutions, lazy loading
- **Network Resilience:** Retry logic, offline queue
- **Memory Management:** Recipe list virtualization

## Monitoring & Operations

### Application Monitoring
- **Error Tracking:** Sentry or similar for crash reporting
- **Performance Monitoring:** APM tools (New Relic, DataDog)
- **Uptime Monitoring:** Health checks and alerting
- **User Analytics:** Usage patterns and feature adoption

### Logging & Debugging
- **Structured Logging:** JSON format with correlation IDs
- **Log Aggregation:** Centralized logging (ELK stack or cloud equivalent)
- **Debug Modes:** Development and staging environment tooling

## Business Considerations

### Legal & Compliance
- **Terms of Service:** Clear usage guidelines
- **Privacy Policy:** Transparent data handling
- **Content Licensing:** Recipe attribution and copyright considerations
- **App Store Guidelines:** Compliance with iOS/Android policies

### Future Enhancements
- Android app deployment
- Advanced collaborative editing with version history
- Grocery delivery API integration
- Recipe recommendations and meal planning
- Advanced nutrition tracking
- Apple Watch companion app


