#!/bin/bash

# PostgreSQL setup script for recipe app
echo "Setting up PostgreSQL for recipe app..."

# Create user and database
sudo -u postgres psql << EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'recipeapp_user') THEN
      CREATE USER recipeapp_user WITH PASSWORD 'recipeapp123';
   END IF;
END
\$\$;

SELECT 'CREATE DATABASE recipeapp OWNER recipeapp_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'recipeapp')\gexec

GRANT ALL PRIVILEGES ON DATABASE recipeapp TO recipeapp_user;
\q
EOF

echo "PostgreSQL database and user created successfully!"
echo "Database: recipeapp"
echo "User: recipeapp_user"
echo "Password: recipeapp123"
echo ""

# Create tables and indexes
echo "Creating database tables..."
cd "$(dirname "$0")"
npm run init-postgres

echo ""
echo "PostgreSQL setup complete!"
echo ""
echo "Add these to your .env file:"
echo "DB_HOST=localhost"
echo "DB_PORT=5432"
echo "DB_NAME=recipeapp"
echo "DB_USER=recipeapp_user"
echo "DB_PASSWORD=recipeapp123"