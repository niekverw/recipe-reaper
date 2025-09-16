/**
 * Utility functions for tag management and normalization
 */
export class TagHelper {
  /**
   * Normalize a tag by capitalizing the first letter of each word
   * @param tag - The tag string to normalize
   * @returns The normalized tag string
   */
  static normalizeTag(tag: string): string {
    if (!tag || typeof tag !== 'string') return ''
    
    return tag
      .trim()
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Normalize an array of tags
   * @param tags - Array of tag strings to normalize
   * @returns Array of normalized tag strings
   */
  static normalizeTags(tags: string[]): string[] {
    if (!Array.isArray(tags)) return []
    
    return tags
      .map(tag => this.normalizeTag(tag))
      .filter(tag => tag.length > 0)
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
  }

  /**
   * Validate that a tag meets basic requirements
   * @param tag - The tag to validate
   * @returns True if the tag is valid
   */
  static isValidTag(tag: string): boolean {
    if (!tag || typeof tag !== 'string') return false
    
    const normalized = tag.trim()
    
    // Basic validation rules
    return (
      normalized.length > 0 &&
      normalized.length <= 50 && // Reasonable max length
      !/[<>{}[\]\\]/.test(normalized) // No special characters that could cause issues
    )
  }
}