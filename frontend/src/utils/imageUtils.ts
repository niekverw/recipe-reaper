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
  small: { url: string; width: number }
  medium: { url: string; width: number }
  large: { url: string; width: number }
}

/**
 * Generate srcset attribute for responsive images
 */
export const generateSrcSet = (imageSizes: ImageSizes): string => {
  return [
    `${imageSizes.small.url} ${imageSizes.small.width}w`,
    `${imageSizes.medium.url} ${imageSizes.medium.width}w`,
    `${imageSizes.large.url} ${imageSizes.large.width}w`
  ].join(', ')
}

/**
 * Generate sizes attribute based on display context
 */
export const generateSizes = (context: 'grid' | 'list' | 'detail' = 'grid'): string => {
  switch (context) {
    case 'grid':
      // Grid view: responsive breakpoints matching grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
    case 'list':
      // List view: fixed small size
      return '64px'
    case 'detail':
      // Detail view: larger responsive
      return '(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw'
    default:
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
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