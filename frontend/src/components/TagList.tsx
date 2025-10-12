import { TagIcon } from '@heroicons/react/24/outline'

export interface TagListProps {
  tags: string[]
  maxDisplay?: number
  onTagClick?: (tag: string) => void
  variant?: 'compact' | 'default'
  className?: string
}

/**
 * Reusable component for displaying recipe tags
 * Supports different variants and customizable tag click behavior
 */
export function TagList({ 
  tags, 
  maxDisplay, 
  onTagClick, 
  className = '' 
}: TagListProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags
  const remainingCount = maxDisplay && tags.length > maxDisplay ? tags.length - maxDisplay : 0

  const handleClick = (e: React.MouseEvent, tag: string) => {
    if (onTagClick) {
      e.preventDefault()
      e.stopPropagation()
      onTagClick(tag)
    }
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayTags.map(tag => (
        <button
          key={tag}
          onClick={(e) => handleClick(e, tag)}
          disabled={!onTagClick}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded transition-colors ${
            onTagClick ? 'hover:bg-blue-200 dark:hover:bg-blue-800/50 cursor-pointer' : 'cursor-default'
          }`}
        >
          <TagIcon className="w-2.5 h-2.5" />
          {tag}
        </button>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
