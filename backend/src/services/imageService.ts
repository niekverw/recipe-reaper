import { promises as fs } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import heicConvert from 'heic-convert'
import https from 'https'
import http from 'http'

interface StoredImageResult {
  filename: string
  url: string
  path: string
  blurDataUrl?: string
  sizes: {
    small: { url: string; width: number; height: number; webp?: string }
    medium: { url: string; width: number; height: number; webp?: string }
    large: { url: string; width: number; height: number; webp?: string }
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

    // Process and generate multiple sizes in both JPEG and WebP formats
    const sizes = {
      small: { width: 400, jpegQuality: 80, webpQuality: 75 },
      medium: { width: 800, jpegQuality: 85, webpQuality: 80 },
      large: { width: 1200, jpegQuality: 85, webpQuality: 80 }
    }

  const generatedSizes: Partial<Record<'small' | 'medium' | 'large', { url: string; width: number; height: number; webp?: string }>> = {}
  let mainJpegFilename = ''

    for (const [sizeName, config] of Object.entries(sizes)) {
      const sizeKey = sizeName as keyof typeof generatedSizes
      // Generate JPEG version
      const jpegFilename = sizeName === 'large' ? `${baseFilename}.jpg` : `${baseFilename}_${sizeName}.jpg`
      const jpegFilePath = join(this.uploadsDir, jpegFilename)

      // Check if image has transparency and flatten for JPEG (which doesn't support alpha)
      const hasAlpha = await sharp(processedBuffer).metadata().then(meta => meta.hasAlpha || meta.channels === 4)
      const jpegPipeline = sharp(processedBuffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(config.width, config.width, {
          fit: 'inside',
          withoutEnlargement: true
        })

      // Flatten transparent images with white background for JPEG
      if (hasAlpha) {
        jpegPipeline.flatten({ background: { r: 255, g: 255, b: 255 } })
      }

      const { data: jpegBuffer, info } = await jpegPipeline
        .jpeg({
          quality: config.jpegQuality,
          progressive: true
        })
        .toBuffer({ resolveWithObject: true })

      await fs.writeFile(jpegFilePath, jpegBuffer)

      // Generate WebP version (WebP supports transparency, so no flattening needed)
      const webpFilename = sizeName === 'large' ? `${baseFilename}.webp` : `${baseFilename}_${sizeName}.webp`
      const webpFilePath = join(this.uploadsDir, webpFilename)

      const webpBuffer = await sharp(processedBuffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(config.width, config.width, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({
          quality: config.webpQuality,
          effort: 4 // Good balance between compression and speed
        })
        .toBuffer()

      await fs.writeFile(webpFilePath, webpBuffer)

  const url = `/uploads/${jpegFilename}`
      const webp = `/uploads/${webpFilename}`

      const derivedHeight = info.height ?? Math.round((info.width || config.width) * 0.75)

      generatedSizes[sizeKey] = {
        url,
        width: info.width ?? config.width,
        height: derivedHeight,
        webp
      }

      // Store main file names for return
      if (sizeName === 'large') {
        mainJpegFilename = jpegFilename
      }
    }

    // Generate blur placeholder - tiny 20px JPEG as base64 data URL
    const blurDataUrl = await this.generateBlurPlaceholder(processedBuffer)

    // Return relative URL - frontend will construct full URL based on current location
    const relativeUrl = `/uploads/${mainJpegFilename}`

    const { small, medium, large } = generatedSizes

    if (!small || !medium || !large) {
      throw new Error('Failed to generate responsive image sizes')
    }

    return {
      filename: mainJpegFilename,
      url: relativeUrl,
      path: join(this.uploadsDir, mainJpegFilename),
      blurDataUrl,
      sizes: {
        small,
        medium,
        large
      }
    }
  }

  async deleteImage(filename: string): Promise<void> {
    // Delete main file
    const filePath = join(this.uploadsDir, filename)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    // Delete WebP version if it exists
    const baseFilename = filename.replace(/\.[^/.]+$/, '') // Remove extension
    const webpFilename = `${baseFilename}.webp`
    const webpFilePath = join(this.uploadsDir, webpFilename)
    try {
      await fs.unlink(webpFilePath)
    } catch (error) {
      // Ignore if WebP file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(`Failed to delete WebP version: ${webpFilename}`, error)
      }
    }

    // Delete size variants (small, medium, large) for both JPEG and WebP
    const sizeVariants = ['small', 'medium', 'large']
    for (const size of sizeVariants) {
      // Delete JPEG variant
      const jpegVariant = `${baseFilename}_${size}.jpg`
      const jpegVariantPath = join(this.uploadsDir, jpegVariant)
      try {
        await fs.unlink(jpegVariantPath)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`Failed to delete JPEG variant: ${jpegVariant}`, error)
        }
      }

      // Delete WebP variant
      const webpVariant = `${baseFilename}_${size}.webp`
      const webpVariantPath = join(this.uploadsDir, webpVariant)
      try {
        await fs.unlink(webpVariantPath)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`Failed to delete WebP variant: ${webpVariant}`, error)
        }
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

  async downloadAndStoreImageFromUrl(imageUrl: string): Promise<StoredImageResult> {
    if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      throw new Error('Invalid image URL provided')
    }

    try {
      console.log(`Downloading image from URL: ${imageUrl}`)

      // Download the image
      const imageBuffer = await this.downloadImage(imageUrl)

      // Extract filename from URL or generate one
      const urlParts = new URL(imageUrl)
      const urlPath = urlParts.pathname
      const originalName = urlPath.split('/').pop() || 'downloaded-image.jpg'

      // Process the downloaded image through our existing pipeline
      const result = await this.storeImage(imageBuffer, originalName)
      console.log(`Successfully processed external image: ${originalName}`)

      return result
    } catch (error) {
      console.error(`Failed to download and process image from ${imageUrl}:`, error)
      throw new Error(`Failed to process external image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http
      const timeout = 30000 // 30 second timeout

      const request = protocol.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location
          if (redirectUrl) {
            console.log(`Redirecting to: ${redirectUrl}`)
            return this.downloadImage(redirectUrl).then(resolve).catch(reject)
          }
        }

        if (response.statusCode !== 200) {
          return reject(new Error(`HTTP ${response.statusCode}: Failed to download image`))
        }

        const contentType = response.headers['content-type']
        if (!contentType || !contentType.startsWith('image/')) {
          return reject(new Error(`Invalid content type: ${contentType}. Expected image/*`))
        }

        const chunks: Buffer[] = []
        let totalSize = 0
        const maxSize = 10 * 1024 * 1024 // 10MB limit

        response.on('data', (chunk: Buffer) => {
          totalSize += chunk.length
          if (totalSize > maxSize) {
            request.destroy()
            return reject(new Error('Image file too large (max 10MB)'))
          }
          chunks.push(chunk)
        })

        response.on('end', () => {
          const buffer = Buffer.concat(chunks)
          if (buffer.length === 0) {
            return reject(new Error('Downloaded image is empty'))
          }
          resolve(buffer)
        })

        response.on('error', (error) => {
          reject(new Error(`Download error: ${error.message}`))
        })
      })

      request.setTimeout(timeout, () => {
        request.destroy()
        reject(new Error('Download timeout (30s)'))
      })

      request.on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`))
      })
    })
  }

  private async generateBlurPlaceholder(imageBuffer: Buffer): Promise<string> {
    try {
      // Generate a very small (20px wide) JPEG thumbnail for blur placeholder
      const blurBuffer = await sharp(imageBuffer)
        .rotate() // Auto-rotate based on EXIF orientation
        .resize(20, 20, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 60,
          mozjpeg: true // Use mozjpeg for better compression
        })
        .toBuffer()

      // Convert to base64 data URL
      const base64 = blurBuffer.toString('base64')
      return `data:image/jpeg;base64,${base64}`
    } catch (error) {
      console.warn('Failed to generate blur placeholder:', error)
      // Return a simple gray placeholder as fallback
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNjY2MiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48L3N2Zz4='
    }
  }

  async isExternalUrl(imageUrl: string): Promise<boolean> {
    return Boolean(imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')))
  }
}

export const imageService = new ImageService()