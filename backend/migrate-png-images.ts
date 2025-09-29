import { promises as fs } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import { PostgreSQLDatabase } from './src/models/database-pg'

interface ImageSizes {
  small: { url: string; width: number; height?: number; webp?: string }
  medium: { url: string; width: number; height?: number; webp?: string }
  large: { url: string; width: number; height?: number; webp?: string }
}

async function migratePngImages(dryRun = false) {
  console.log(`${dryRun ? 'DRY RUN: ' : ''}Starting PNG to JPEG/WebP migration...`)

  // Initialize database connection
  const db = PostgreSQLDatabase.getInstance()
  await db.initialize()

  try {
    // Get all recipes with PNG images
    const recipesWithPng = await db.query(`
      SELECT id, image, image_sizes
      FROM recipes
      WHERE image LIKE '%.png'
      ORDER BY created_at DESC
    `)

    console.log(`Found ${recipesWithPng.rows.length} recipes with PNG images`)

    const uploadsDir = join(process.cwd(), 'data', 'uploads')
    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const recipe of recipesWithPng.rows) {
      try {
        const pngPath = recipe.image
        if (!pngPath || !pngPath.startsWith('/uploads/')) {
          console.log(`Skipping recipe ${recipe.id}: invalid PNG path ${pngPath}`)
          skippedCount++
          continue
        }

        // Extract base filename (remove /uploads/ and .png)
        const pngFilename = pngPath.replace('/uploads/', '')
        const baseFilename = pngFilename.replace('.png', '')

        // Check if the main PNG file exists
        const mainPngPath = join(uploadsDir, `${baseFilename}.png`)
        try {
          await fs.access(mainPngPath)
        } catch {
          console.log(`Skipping recipe ${recipe.id}: PNG file not found at ${mainPngPath}`)
          skippedCount++
          continue
        }

        // Convert PNG files to JPEG/WebP format
        const sizes = {
          small: { width: 400, pngPath: `${baseFilename}_small.png`, jpegPath: `${baseFilename}_small.jpg`, webpPath: `${baseFilename}_small.webp` },
          medium: { width: 800, pngPath: `${baseFilename}_medium.png`, jpegPath: `${baseFilename}_medium.jpg`, webpPath: `${baseFilename}_medium.webp` },
          large: { width: 1200, pngPath: `${baseFilename}.png`, jpegPath: `${baseFilename}.jpg`, webpPath: `${baseFilename}.webp` }
        }

        const newImageSizes: ImageSizes = {
          small: { url: `/uploads/${baseFilename}_small.jpg`, width: 400 },
          medium: { url: `/uploads/${baseFilename}_medium.jpg`, width: 800 },
          large: { url: `/uploads/${baseFilename}.jpg`, width: 1200 }
        }

        // Convert each size
        for (const [sizeName, config] of Object.entries(sizes)) {
          const sizeKey = sizeName as keyof typeof newImageSizes
          const pngFilePath = join(uploadsDir, config.pngPath)
          const jpegFilePath = join(uploadsDir, config.jpegPath)
          const webpFilePath = join(uploadsDir, config.webpPath)

          // Check if PNG file exists
          let pngExists = false
          try {
            await fs.access(pngFilePath)
            pngExists = true
          } catch {
            // PNG file doesn't exist, skip conversion for this size
            continue
          }

          if (pngExists && !dryRun) {
            // Read PNG file
            const pngBuffer = await fs.readFile(pngFilePath)

            // Check if image has transparency
            const hasAlpha = await sharp(pngBuffer).metadata().then(meta => meta.hasAlpha || meta.channels === 4)

            // Convert to JPEG
            const jpegPipeline = sharp(pngBuffer)
            if (hasAlpha) {
              jpegPipeline.flatten({ background: { r: 255, g: 255, b: 255 } })
            }
            const jpegBuffer = await jpegPipeline
              .jpeg({ quality: sizeName === 'small' ? 80 : 85, progressive: true })
              .toBuffer()
            await fs.writeFile(jpegFilePath, jpegBuffer)

            // Convert to WebP (WebP supports transparency)
            const webpBuffer = await sharp(pngBuffer)
              .webp({ quality: sizeName === 'small' ? 75 : 80, effort: 4 })
              .toBuffer()
            await fs.writeFile(webpFilePath, webpBuffer)

            // Add WebP reference
            newImageSizes[sizeKey].webp = `/uploads/${config.webpPath}`

            // Get dimensions
            const metadata = await sharp(jpegBuffer).metadata()
            newImageSizes[sizeKey].height = metadata.height
          }
        }

        const newImagePath = `/uploads/${baseFilename}.jpg`

        // Update the recipe in database
        if (dryRun) {
          console.log(`[DRY RUN] Would update recipe ${recipe.id}: ${pngPath} -> ${newImagePath}`)
        } else {
          await db.query(`
            UPDATE recipes
            SET image = $1, image_sizes = $2, updated_at = NOW()
            WHERE id = $3
          `, [newImagePath, JSON.stringify(newImageSizes), recipe.id])

          console.log(`Migrated recipe ${recipe.id}: ${pngPath} -> ${newImagePath}`)
        }
        migratedCount++

      } catch (error) {
        console.error(`Error migrating recipe ${recipe.id}:`, error)
        errorCount++
      }
    }

    console.log('\nMigration Summary:')
    console.log(`- Migrated: ${migratedCount} recipes`)
    console.log(`- Skipped: ${skippedCount} recipes`)
    console.log(`- Errors: ${errorCount} recipes`)

    // Optional: Clean up old PNG files
    if (migratedCount > 0) {
      console.log('\nWould you like to clean up the old PNG files?')
      console.log('Run this script again with CLEANUP=true environment variable to remove PNG files.')
      console.log('Example: CLEANUP=true npx ts-node migrate-png-images.ts')

      if (process.env.CLEANUP === 'true' && !dryRun) {
        console.log('Cleaning up PNG files...')
        let deletedCount = 0

        for (const recipe of recipesWithPng.rows) {
          try {
            const pngPath = recipe.image
            if (pngPath && pngPath.startsWith('/uploads/')) {
              const pngFilename = pngPath.replace('/uploads/', '')
              const fullPngPath = join(uploadsDir, pngFilename)

              // Also try to delete size variants
              const baseFilename = pngFilename.replace('.png', '')
              const sizeVariants = [
                `${baseFilename}_small.png`,
                `${baseFilename}_medium.png`,
                `${baseFilename}_large.png`,
                `${baseFilename}.png`
              ]

              for (const variant of sizeVariants) {
                try {
                  if (dryRun) {
                    console.log(`[DRY RUN] Would delete: ${variant}`)
                  } else {
                    await fs.unlink(join(uploadsDir, variant))
                    console.log(`Deleted: ${variant}`)
                  }
                  deletedCount++
                } catch {
                  // File doesn't exist or already deleted
                }
              }
            }
          } catch (error) {
            console.error(`Error cleaning up files for recipe ${recipe.id}:`, error)
          }
        }

        console.log(`${dryRun ? '[DRY RUN] Would clean up' : 'Cleaned up'} ${deletedCount} PNG files`)
      }
    }

  } finally {
    // Close database connection
    await db.close()
  }
}

// Run the migration
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true'
  migratePngImages(dryRun)
    .then(() => {
      console.log(`${dryRun ? 'DRY RUN: ' : ''}Migration completed successfully`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}

export { migratePngImages }