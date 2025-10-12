import { CONTENT } from '../constants/content'

export interface SourceAttributionProps {
  sourceUrl: string | null | undefined
  className?: string
}

/**
 * Helper function to extract hostname from URL
 */
function getSourceHostname(sourceUrl?: string | null): string {
  if (!sourceUrl) {
    return ''
  }

  try {
    return new URL(sourceUrl).host
  } catch {
    const sanitized = sourceUrl.replace(/^https?:\/\//, '').split('/')[0]
    return sanitized || sourceUrl
  }
}

/**
 * Reusable component for displaying recipe source attribution
 * Shows "Recipe adapted from [hostname]" with a clickable link
 */
export function SourceAttribution({ sourceUrl, className = '' }: SourceAttributionProps) {
  if (!sourceUrl) {
    return null
  }

  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      <span>{CONTENT.recipeDetail.recipeAdaptedFrom} </span>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
      >
        {getSourceHostname(sourceUrl)}
      </a>
    </p>
  )
}
