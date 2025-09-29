import { promises as fs } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { PostgreSQLDatabase } from './src/models/database-pg'
import { Recipe } from './src/types/recipe'

interface ImageSizes {
  small: { url: string; width: number; height: number; webp?: string }
  medium: { url: string; width: number; height: number; webp?: string }
  large: { url: string; width: number; height: number; webp?: string }
}

async function migrateExistingImages() {
  console.log('Starting image migration for existing recipes...')

  const db = PostgreSQLDatabase.getInstance()
  await db.initialize() // Initialize the database connection
  const uploadsDir = join(process.cwd(), 'data', 'uploads')

  try {
    // Get all recipes that have images but no imageSizes
    const result = await db.query(
      'SELECT id, image FROM recipes WHERE image IS NOT NULL AND (image_sizes IS NULL OR image_sizes = \'null\')',
      []
    )

    const recipes = result.rows as { id: string; image: string }[]

    console.log(`Found ${recipes.length} recipes with images to migrate`)

    let successCount = 0
    let errorCount = 0

    for (const recipe of recipes) {
      try {
        console.log(`Processing recipe ${recipe.id} with image: ${recipe.image}`)

        // Extract filename from image URL
        const filenameMatch = recipe.image.match(/\/uploads\/([^/?]+)/)
        if (!filenameMatch) {
          console.warn(`Could not extract filename from ${recipe.image}, skipping`)
          errorCount++
          continue
        }

        const baseFilename = filenameMatch[1]
        const imagePath = join(uploadsDir, baseFilename)

        // Check if the original image file exists
        try {
          await fs.access(imagePath)
        } catch {
          console.warn(`Original image file not found: ${imagePath}, skipping`)
          errorCount++
          continue
        }

        // Read the original image
        const imageBuffer = await fs.readFile(imagePath)

        // Generate multiple sizes
        const sizes = {
          small: { width: 400, quality: 80 },
          medium: { width: 800, quality: 85 },
          large: { width: 1200, quality: 85 }
        }

        const generatedSizes: { [key: string]: { url: string; width: number } } = {}

        for (const [sizeName, config] of Object.entries(sizes)) {
          const sizeFilename = `${baseFilename.replace(/\.[^/.]+$/, '')}_${sizeName}${baseFilename.match(/\.[^/.]+$/)?.[0] || '.jpg'}`
          const sizeFilePath = join(uploadsDir, sizeFilename)

          const resizedBuffer = await sharp(imageBuffer)
            .rotate() // Auto-rotate based on EXIF orientation
            .resize(config.width, config.width, {
              fit: 'inside',
              withoutEnlargement: true
            })
            .jpeg({
              quality: config.quality,
              progressive: true
            })
            .toBuffer()

          await fs.writeFile(sizeFilePath, resizedBuffer)

          generatedSizes[sizeName as keyof typeof generatedSizes] = {
            url: `/uploads/${sizeFilename}`,
            width: config.width
          }

          console.log(`  Generated ${sizeName} size: ${sizeFilename}`)
        }

        // Update the database with imageSizes
        const imageSizesJson = JSON.stringify({
          small: generatedSizes.small,
          medium: generatedSizes.medium,
          large: { url: recipe.image, width: 1200 } // Keep original as large
        })

        await db.run(
          'UPDATE recipes SET image_sizes = $1 WHERE id = $2',
          [imageSizesJson, recipe.id]
        )

        successCount++
        console.log(`✅ Successfully migrated recipe ${recipe.id}`)

      } catch (error) {
        console.error(`❌ Failed to migrate recipe ${recipe.id}:`, error)
        errorCount++
      }
    }

    console.log(`\nMigration complete!`)
    console.log(`✅ Successfully migrated: ${successCount} recipes`)
    console.log(`❌ Failed to migrate: ${errorCount} recipes`)

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await db.close()
  }
}

// Load environment variables
require('dotenv').config()

// Run migration
migrateExistingImages().catch(console.error)