# Recipe App Feature Documentation

## Overview
Comprehensive React-based recipe management application with Node.js/PostgreSQL backend. Features AI-powered recipe parsing, household sharing, shopping list management, and Progressive Web App capabilities.

## Backend Features

### [Recipe Management](./DOCUMENTATION/RECIPE_MANAGEMENT.md)
Core CRUD operations with AI-powered recipe parsing from URLs, text, and images. Supports recipe enhancement, copying, and public/private sharing.

### [Authentication System](./DOCUMENTATION/AUTHENTICATION_SYSTEM.md)
User registration, login, and Google OAuth integration with secure session management and persistent authentication state.

### [Household Management](./DOCUMENTATION/HOUSEHOLD_MANAGEMENT.md)
Multi-user household system for sharing recipes and shopping lists. Features invite codes and household-scoped data access.

### [Shopping List Management](./DOCUMENTATION/SHOPPING_LIST_MANAGEMENT.md)
Categorized shopping lists with smart ingredient combining, completion tracking, and household sharing capabilities.

### [Ingredient Processing](./DOCUMENTATION/INGREDIENT_PROCESSING.md)
Advanced parsing system that converts natural language ingredients into structured data with quantity scaling and unit conversion.

### [AI Services](./DOCUMENTATION/AI_SERVICES.md)
OpenAI GPT and Google Gemini integration for recipe parsing from text/images, recipe enhancement, and structured data extraction.

### [Image Processing](./DOCUMENTATION/IMAGE_PROCESSING.md)
Multi-format image support with HEIC conversion, optimization, and UUID-based secure storage for recipe photos.

### [Security & Middleware](./DOCUMENTATION/SECURITY_MIDDLEWARE.md)
IP blocking, centralized error handling, authentication middleware, and comprehensive security features.

## Frontend Features

### [React Architecture](./DOCUMENTATION/REACT_ARCHITECTURE.md)
Modern React 19 application with TypeScript, Vite build system, and context-based state management for scalable development.

### [Authentication UI](./DOCUMENTATION/AUTHENTICATION_UI.md)
Modal-based login/registration with Google OAuth integration and seamless session management across the application.

### [Recipe Management UI](./DOCUMENTATION/RECIPE_MANAGEMENT_UI.md)
Comprehensive recipe interface with browsing, creation, editing, AI parsing, and image upload capabilities.

### [Shopping List UI](./DOCUMENTATION/SHOPPING_LIST_UI.md)
Category-organized shopping interface with completion tracking, household sharing, and mobile-optimized grocery shopping.

### [Progressive Web App](./DOCUMENTATION/PROGRESSIVE_WEB_APP.md)
Full PWA implementation with offline functionality, app installation, share targets, and native-like mobile experience.

### [Theme System](./DOCUMENTATION/THEME_SYSTEM.md)
Dark/light mode with system preference detection, smooth transitions, and persistent user preferences.

### [Performance Monitoring](./DOCUMENTATION/PERFORMANCE_MONITORING.md)
Real-time performance tracking with Web Vitals monitoring, development dashboard, and console debugging tools.

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware architecture
- **Database**: PostgreSQL with custom query builder
- **Authentication**: Passport.js with local and Google OAuth strategies
- **AI Integration**: OpenAI GPT-4 and Google Gemini APIs
- **Image Processing**: Sharp library with HEIC conversion support
- **Testing**: Jest with supertest for integration testing

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **Routing**: React Router v7 with client-side navigation
- **Styling**: Tailwind CSS v4 with dark mode support
- **State Management**: React Context for global state
- **PWA**: vite-plugin-pwa with service worker generation
- **Testing**: Vitest with Testing Library

## Key Features Summary

### Recipe Management
- URL scraping from recipe websites
- AI-powered text and image parsing
- Recipe enhancement and improvement suggestions
- Public/private recipe sharing
- Tag-based organization and filtering
- Image upload with format conversion

### User Experience
- Progressive Web App with offline support
- Dark/light theme system with smooth transitions
- Mobile-optimized responsive design
- Real-time performance monitoring
- Google OAuth and local authentication
- Household sharing and collaboration

### Shopping Lists
- Automatic ingredient categorization by grocery sections
- Smart quantity combining for duplicate items
- Recipe-to-shopping-list integration
- Household-shared shopping lists
- Mobile-optimized interface for in-store use
- Completion tracking with visual feedback

### Technical Excellence
- Comprehensive TypeScript coverage
- Extensive test suites for backend and frontend
- Modern React patterns with hooks and context
- Security-first middleware architecture
- Performance optimization and monitoring
- Production-ready deployment configuration

## Development Commands

### Backend
```bash
npm run dev          # Development server with hot reload
npm run build        # TypeScript compilation
npm run test         # Run test suite
npm run start:prod   # Production server
```

### Frontend
```bash
npm run dev          # Vite development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run Vitest tests
```

## Environment Configuration
- **Development**: Hot reload, performance dashboard, debug logging
- **Production**: Optimized builds, security headers, error tracking
- **Testing**: Mock services, isolated test database, fast execution