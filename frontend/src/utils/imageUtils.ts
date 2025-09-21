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
export const cleanupImage = async (imageUrl: string): Promise<void> => {
  const filename = getFilenameFromUrl(imageUrl)
  if (filename) {
    try {
      await apiService.deleteImage(filename)
    } catch (err) {
      console.warn('Failed to delete image:', err)
      // Don't show error to user as this is background cleanup
    }
  }
}