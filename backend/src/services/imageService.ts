import { promises as fs } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'

interface StoredImageResult {
  filename: string
  url: string
  path: string
}

class ImageService {
  private uploadsDir: string

  constructor() {
    this.uploadsDir = join(process.cwd(), 'data', 'uploads')
    this.ensureUploadsDirectory()
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir)
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true })
    }
  }

  async storeImage(imageBuffer: Buffer, originalName?: string): Promise<StoredImageResult> {
    await this.ensureUploadsDirectory()

    // Generate unique filename
    const fileExtension = this.getFileExtension(originalName) || 'jpg'
    const filename = `${uuidv4()}.${fileExtension}`
    const filePath = join(this.uploadsDir, filename)

    // Process and optimize the image before storing
    const processedImageBuffer = await sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toBuffer()

    // Save the processed image
    await fs.writeFile(filePath, processedImageBuffer)

    // Return relative URL - frontend will construct full URL based on current location
    const relativeUrl = `/uploads/${filename}`

    return {
      filename,
      url: relativeUrl,
      path: filePath
    }
  }

  async deleteImage(filename: string): Promise<void> {
    const filePath = join(this.uploadsDir, filename)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }

  private getFileExtension(filename?: string): string | null {
    if (!filename) return null
    const lastDot = filename.lastIndexOf('.')
    return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : null
  }
}

export const imageService = new ImageService()