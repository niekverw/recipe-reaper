#!/bin/bash

# PostgreSQL setup script for recipe app
echo "Setting up PostgreSQL for recipe app..."

# Create user and database
sudo -u postgres psql << EOF
CREATE USER recipeapp_user WITH PASSWORD 'recipeapp123';
CREATE DATABASE recipeapp OWNER recipeapp_user;
GRANT ALL PRIVILEGES ON DATABASE recipeapp TO recipeapp_user;
\q
EOF

echo "PostgreSQL setup complete!"
echo "Database: recipeapp"
echo "User: recipeapp_user"
echo "Password: recipeapp123"
echo ""
echo "Add these to your .env file:"
echo "DB_HOST=localhost"
echo "DB_PORT=5432"
echo "DB_NAME=recipeapp"
echo "DB_USER=recipeapp_user"
echo "DB_PASSWORD=recipeapp123"