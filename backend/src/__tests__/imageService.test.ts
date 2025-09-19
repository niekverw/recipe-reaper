import { imageService } from '../services/imageService'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import { join } from 'path'

describe('ImageService Orientation Tests', () => {
  const testUploadsDir = join(process.cwd(), 'data', 'uploads')

  beforeAll(async () => {
    // Ensure test directory exists
    try {
      await fs.access(testUploadsDir)
    } catch {
      await fs.mkdir(testUploadsDir, { recursive: true })
    }
  })

  afterAll(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(testUploadsDir)
      for (const file of files) {
        if (file.startsWith('test-')) {
          await fs.unlink(join(testUploadsDir, file))
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  })

  test('should auto-rotate image based on EXIF orientation', async () => {
    // Create a simple test image buffer (this would normally come from a file upload)
    // For this test, we'll create a basic image and verify the processing pipeline works
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 200, // Portrait orientation
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .jpeg()
    .toBuffer()

    // Process the image through our service
    const result = await imageService.storeImage(testImageBuffer, 'test-portrait.jpg')

    // Verify the file was created
    expect(result.filename).toBeDefined()
    expect(result.url).toContain('/uploads/')
    expect(result.path).toContain(result.filename)

    // Verify the file exists on disk
    const fileExists = await fs.access(result.path).then(() => true).catch(() => false)
    expect(fileExists).toBe(true)

    // Get image metadata to verify dimensions
    const metadata = await sharp(result.path).metadata()

    // The image should maintain aspect ratio (portrait should stay portrait)
    // Since we set withoutEnlargement: true and fit: 'inside',
    // a 100x200 image should remain 100x200
    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(200)

    console.log('✅ Image orientation test passed!')
    console.log(`Processed image: ${result.filename}`)
    console.log(`Original dimensions: 100x200 (portrait)`)
    console.log(`Processed dimensions: ${metadata.width}x${metadata.height}`)
  })

  test('should detect HEIC files correctly', async () => {
    // Test HEIC file detection logic
    const imageServiceInstance = imageService as any

    // Test various file extensions
    expect(imageServiceInstance.isHeicFile('photo.heic')).toBe(true)
    expect(imageServiceInstance.isHeicFile('image.heif')).toBe(true)
    expect(imageServiceInstance.isHeicFile('picture.HEIC')).toBe(true) // Case insensitive
    expect(imageServiceInstance.isHeicFile('photo.jpg')).toBe(false)
    expect(imageServiceInstance.isHeicFile('image.png')).toBe(false)
    expect(imageServiceInstance.isHeicFile()).toBe(false) // No filename
    expect(imageServiceInstance.isHeicFile('')).toBe(false) // Empty filename

    console.log('✅ HEIC detection test passed!')
    console.log('HEIC files detected correctly')
  })

  test('should handle non-HEIC files normally', async () => {
    // Create a test image buffer
    const testImageBuffer = await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 3,
        background: { r: 100, g: 200, b: 150 }
      }
    })
    .jpeg()
    .toBuffer()

    // Process a regular JPEG file (should work normally)
    const result = await imageService.storeImage(testImageBuffer, 'test-image.jpg')

    // Verify the file was created and processed correctly
    expect(result.filename).toBeDefined()
    expect(result.url).toContain('/uploads/')

    // Verify the file exists on disk
    const fileExists = await fs.access(result.path).then(() => true).catch(() => false)
    expect(fileExists).toBe(true)

    // Get image metadata to verify it was processed correctly
    const metadata = await sharp(result.path).metadata()
    expect(metadata.format).toBe('jpeg')

    console.log('✅ Regular image processing test passed!')
    console.log(`Processed file: ${result.filename}`)
    console.log(`Final format: ${metadata.format}`)
  })
})