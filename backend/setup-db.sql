-- Create user and database for recipe app
CREATE USER recipeapp_user WITH PASSWORD 'recipeapp123';
CREATE DATABASE recipeapp OWNER recipeapp_user;
GRANT ALL PRIVILEGES ON DATABASE recipeapp TO recipeapp_user;

-- Also grant privileges for the current user
CREATE USER tafelplankje WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE recipeapp TO tafelplankje;