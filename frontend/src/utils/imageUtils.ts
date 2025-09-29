import { apiService } from '../services/api'

/**
 * Utility functions for handling uploaded images
 */

const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || '/uploads'

/**
 * Check if a URL points to one of our uploaded images
 */
export const isOurUploadedImage = (url: string): boolean => {
  if (!url) return false
  // Check if it's a URL pointing to our uploads endpoint
  const currentUrl = window.location
  const frontendBaseUrl = `${currentUrl.protocol}//${currentUrl.hostname}:${currentUrl.port || (currentUrl.protocol === 'https:' ? '443' : '80')}`
  return url.startsWith('/uploads/') || url.startsWith(`${frontendBaseUrl}/uploads/`) || url.startsWith(UPLOADS_BASE_URL)
}

/**
 * Extract filename from our upload URL
 */
export const getFilenameFromUrl = (url: string): string | null => {
  if (!isOurUploadedImage(url)) return null
  const match = url.match(/\/uploads\/([^/?]+)/)
  return match ? match[1] : null
}

/**
 * Clean up an uploaded image by deleting it from the server
 */
export const deleteUploadedImage = async (url: string): Promise<void> => {
  const filename = getFilenameFromUrl(url)
  if (!filename) return

  try {
    await apiService.deleteImage(filename)
  } catch (error) {
    console.error('Failed to delete uploaded image:', error)
  }
}

/**
 * Generate responsive image attributes for uploaded images
 */
export interface ImageSizes {
  small: { url: string; width: number; height?: number; webp?: string }
  medium: { url: string; width: number; height?: number; webp?: string }
  large: { url: string; width: number; height?: number; webp?: string }
}

/**
 * Generate srcset attribute for responsive images (JPEG/fallback)
 */
export const generateSrcSet = (imageSizes: ImageSizes): string => {
  return [
    `${imageSizes.small.url} ${imageSizes.small.width}w`,
    `${imageSizes.medium.url} ${imageSizes.medium.width}w`,
    `${imageSizes.large.url} ${imageSizes.large.width}w`
  ].join(', ')
}

/**
 * Generate srcset attribute for WebP images
 */
export const generateWebPSrcSet = (imageSizes: ImageSizes): string | null => {
  const webpUrls = [
    imageSizes.small.webp ? `${imageSizes.small.webp} ${imageSizes.small.width}w` : null,
    imageSizes.medium.webp ? `${imageSizes.medium.webp} ${imageSizes.medium.width}w` : null,
    imageSizes.large.webp ? `${imageSizes.large.webp} ${imageSizes.large.width}w` : null
  ].filter(Boolean)

  return webpUrls.length > 0 ? webpUrls.join(', ') : null
}

/**
 * Generate sizes attribute based on display context
 */
export const generateSizes = (context: 'grid' | 'list' | 'detail' = 'grid'): string => {
  switch (context) {
    case 'grid':
      // Grid view: fixed height containers with object-cover, so sizes based on height constraints
      // h-24 (96px) → ~128px, h-36 (144px) → ~192px, h-48 (192px) → ~256px
      return '(max-width: 640px) 128px, (max-width: 768px) 192px, 256px'
    case 'list':
      // List view: fixed small size
      return '64px'
    case 'detail':
      // Detail view: larger responsive
      return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw'
    default:
      return '(max-width: 640px) 128px, (max-width: 768px) 192px, 256px'
  }
}

/**
 * Get the best image URL for a specific max width
 */
export const getOptimalImageUrl = (imageSizes: ImageSizes, maxWidth: number): string => {
  if (maxWidth <= imageSizes.small.width) {
    return imageSizes.small.url
  } else if (maxWidth <= imageSizes.medium.width) {
    return imageSizes.medium.url
  } else {
    return imageSizes.large.url
  }
}

/**
 * Get the best WebP image URL for a specific max width
 */
export const getOptimalWebPUrl = (imageSizes: ImageSizes, maxWidth: number): string | null => {
  if (maxWidth <= imageSizes.small.width && imageSizes.small.webp) {
    return imageSizes.small.webp
  } else if (maxWidth <= imageSizes.medium.width && imageSizes.medium.webp) {
    return imageSizes.medium.webp
  } else if (imageSizes.large.webp) {
    return imageSizes.large.webp
  }
  return null
}