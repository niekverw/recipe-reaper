import { promises as fs } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import heicConvert from 'heic-convert'

interface StoredImageResult {
  filename: string
  url: string
  path: string
  sizes: {
    small: { url: string; width: number }
    medium: { url: string; width: number }
    large: { url: string; width: number }
  }
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
    const baseFilename = uuidv4()
    const filename = `${baseFilename}.${fileExtension}`
    const filePath = join(this.uploadsDir, filename)

    let processedBuffer = imageBuffer

    // Handle HEIC files using heic-convert library
    if (this.isHeicFile(originalName)) {
      try {
        console.log('Converting HEIC file to JPEG...')
        processedBuffer = await this.convertHeicToJpeg(imageBuffer)
        console.log('HEIC conversion successful')
      } catch (error) {
        console.error('HEIC conversion failed:', error)
        throw new Error('Failed to process HEIC image file. Please try uploading a JPEG or PNG instead.')
      }
    }

    // Process and generate multiple sizes
    const sizes = {
      small: { width: 400, quality: 80 },
      medium: { width: 800, quality: 85 },
      large: { width: 1200, quality: 85 }
    }

    const generatedSizes: { [key: string]: { url: string; width: number } } = {}

    for (const [sizeName, config] of Object.entries(sizes)) {
      const sizeFilename = `${baseFilename}_${sizeName}.${fileExtension}`
      const sizeFilePath = join(this.uploadsDir, sizeFilename)

      const resizedBuffer = await sharp(processedBuffer)
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
    }

    // Also save the original processed version as the "large" size
    const finalImageBuffer = await sharp(processedBuffer)
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

    await fs.writeFile(filePath, finalImageBuffer)

    // Return relative URL - frontend will construct full URL based on current location
    const relativeUrl = `/uploads/${filename}`

    return {
      filename,
      url: relativeUrl,
      path: filePath,
      sizes: {
        small: generatedSizes.small,
        medium: generatedSizes.medium,
        large: { url: relativeUrl, width: 1200 }
      }
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

  private isHeicFile(filename?: string): boolean {
    const extension = this.getFileExtension(filename)
    return extension === 'heic' || extension === 'heif'
  }

  private async convertHeicToJpeg(heicBuffer: Buffer): Promise<Buffer> {
    try {
      // Try using the buffer directly as heic-convert might accept it
      const convertedBuffer = await heicConvert({
        buffer: heicBuffer as any, // Type assertion as a last resort
        format: 'JPEG',
        quality: 0.9
      })
      return Buffer.from(convertedBuffer)
    } catch (error) {
      // If that fails, try the manual ArrayBuffer conversion
      try {
        const arrayBuffer = new ArrayBuffer(heicBuffer.length)
        const uint8Array = new Uint8Array(arrayBuffer)
        for (let i = 0; i < heicBuffer.length; i++) {
          uint8Array[i] = heicBuffer[i]
        }

        const convertedBuffer2 = await heicConvert({
          buffer: arrayBuffer,
          format: 'JPEG',
          quality: 0.9
        })
        return Buffer.from(convertedBuffer2)
      } catch (secondError) {
        throw new Error(`HEIC conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }
}

export const imageService = new ImageService()