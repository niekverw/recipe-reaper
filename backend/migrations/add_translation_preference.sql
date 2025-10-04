-- Add translation preference column to users table
-- This allows users to set a default language for recipe imports
-- NULL means no translation (honor original language)

ALTER TABLE users ADD COLUMN IF NOT EXISTS default_translation_language VARCHAR(10) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN users.default_translation_language IS 'ISO language code for default recipe translation (e.g., nl, en, es). NULL = no translation, preserve original language.';
