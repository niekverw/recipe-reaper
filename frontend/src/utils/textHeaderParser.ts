export interface TextSegment {
  type: 'header' | 'text'
  content: string
}

export class TextHeaderParser {
  /**
   * Parse text containing inline *header* patterns
   */
  static parseText(text: string): TextSegment[] {
    if (!text) return []

    const segments: TextSegment[] = []
    const regex = /\*([^*]+)\*/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      // Add text before the header
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index)
        if (beforeText.trim()) {
          segments.push({
            type: 'text',
            content: beforeText
          })
        }
      }

      // Add the header (strip leading numbers for instructions)
      let headerContent = match[1].trim()
      headerContent = this.stripLeadingNumber(headerContent)
      segments.push({
        type: 'header',
        content: headerContent
      })

      lastIndex = regex.lastIndex
    }

    // Add remaining text after the last header
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex)
      if (remainingText.trim()) {
        segments.push({
          type: 'text',
          content: remainingText
        })
      }
    }

    // If no headers found, return the entire text as one segment
    if (segments.length === 0 && text.trim()) {
      segments.push({
        type: 'text',
        content: text
      })
    }

    return segments
  }

  /**
   * Strip leading numbers and dots from header content (for instructions)
   */
  private static stripLeadingNumber(content: string): string {
    // Remove patterns like "1. ", "12. ", "1.", "12." from the beginning
    return content.replace(/^\d+\.?\s*/, '').trim()
  }

  /**
   * Check if text contains any inline headers
   */
  static hasInlineHeaders(text: string): boolean {
    return /\*[^*]+\*/g.test(text)
  }

  /**
   * Check if text is purely a header (only contains *header* and whitespace)
   */
  static isPureHeader(text: string): boolean {
    const trimmed = text.trim()
    const headerMatch = trimmed.match(/^\*([^*]+)\*$/)
    return headerMatch !== null
  }
}