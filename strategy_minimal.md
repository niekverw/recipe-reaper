# Recipe App Strategy (Simple Version)

## Overview
A minimal recipe app for storing, viewing, and sharing recipes. Focus on ease of use, clean and modern UI, and quick development. The app should be designed with extensibility in mind, ensuring that future features like multi-user support, authentication, and advanced functionality can be added without major refactoring. 

## Core Features
- **Recipe CRUD:** Create, read, update, delete recipes
- **Manual Entry:** Simple form for recipe name, ingredients, steps, and optional image. Extend later to URL import (and other imports to autofill the manual entry fields.)
- **Ingredient List:** Basic parsing (one ingredient per line) - future phases include ingredient scaling, nutrition info, and shopping lists.
- **User Authentication (Future-Ready):** While initially single-user, the app should be structured to easily integrate Google OAuth (Firebase Auth) in the future.
- **Recipe Sharing:** Public/private toggle, shareable link
- **Responsive UI:** Works on desktop and particularly mobile browsers

## Technical Stack
- **Frontend:**  React, Vite
- **Backend:** Node.js + Express + SQLite, use this schema where relevant: https://schema.org/Recipe.
- **Auth (Future-Ready):** eg Firebase Auth (Google OAuth)

## Development Plan

### Project Setup
- Initialize React + Vite frontend
- Set up Node.js/Express backend
- Connect frontend and backend via REST API
- Structure the codebase to allow for future multi-user support and authentication integration

### Authentication (Future-Ready)
- Design the backend and database schema to support user-specific data, even if authentication is added later
- Plan for Better Auth integration in future phases

### Recipe Management
- Build recipe form (title, description, ingredients, steps, image)
- Implement recipe list and detail view
- Enable edit and delete functionality
- Please use https://www.npmjs.com/package/parse-ingredient for normalization of units of measure and ingredients. 
- The detailed view and overall layout can be taken from https://github.com/hello-pangea/pangea-recipes. 
- Ensure the database schema can accommodate user specific recipes in the future; as well as households (groups of users), households can see and edit each others recipes.

### Sharing
- Add public/private toggle for recipes
- Shareable url for public recipes

### UI & Mobile
- Use a component library for fast, clean, modern UI
- Ensure mobile responsiveness

### Deployment
- Deploy frontend and backend to cloud platforms

## Optional Enhancements (Future)
- Image upload (Cloudinary/s3)
- Enable images in steps.
- Add ingredient scaling option (0.25,0.5,0.75,1,1.5,2,3,4) and conversion (US, Metric, original)
- Basic nutrition info (static lookup)
- Shopping list (e.g. aggregate selected ingredients from the detail view)
- PWA support (offline access)
- Ways to categorize recipes (tags, likes, popular recipes etc)