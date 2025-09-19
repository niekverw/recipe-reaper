import { useState, useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { TagHelper } from '../utils/tagHelper'

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  availableTags?: string[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

function TagInput({ tags, onTagsChange, availableTags = [], placeholder = "Add tags...", className = "", disabled = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (inputValue && showSuggestions) {
      const filtered = availableTags.filter(tag =>
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(tag)
      ).slice(0, 10)
      setFilteredSuggestions(filtered)
      setHighlightedIndex(0)
    } else {
      setFilteredSuggestions([])
    }
  }, [inputValue, showSuggestions, availableTags, tags])

  const addTag = (tag: string) => {
    const normalizedTag = TagHelper.normalizeTag(tag)
    if (normalizedTag && !tags.includes(normalizedTag) && TagHelper.isValidTag(normalizedTag)) {
      onTagsChange([...tags, normalizedTag])
    }
    setInputValue('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (filteredSuggestions.length > 0 && highlightedIndex >= 0) {
          addTag(filteredSuggestions[highlightedIndex])
        } else if (inputValue.trim()) {
          addTag(inputValue)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (filteredSuggestions.length > 0) {
          setHighlightedIndex(prev => (prev + 1) % filteredSuggestions.length)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (filteredSuggestions.length > 0) {
          setHighlightedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setInputValue('')
        break
      case 'Backspace':
        if (!inputValue && tags.length > 0) {
          removeTag(tags[tags.length - 1])
        }
        break
      case ',':
      case ';':
        e.preventDefault()
        if (inputValue.trim()) {
          addTag(inputValue)
        }
        break
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setShowSuggestions(value.length > 0)
  }

  const handleInputFocus = () => {
    if (inputValue.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = (_e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false)
      if (inputValue.trim()) {
        addTag(inputValue)
      }
    }, 150)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Tag Display and Input */}
      <div className={`flex flex-wrap items-center gap-2 p-2 min-h-[2.5rem] border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {/* Display existing tags */}
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-md border border-blue-200 dark:border-blue-800"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag} tag`}
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={tags.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] px-1 py-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              ref={el => { suggestionRefs.current[index] = el }}
              type="button"
              onClick={() => addTag(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                index === highlightedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Press Enter, comma, or semicolon to add a tag. Use Backspace to remove the last tag.
      </div>
    </div>
  )
}

export default TagInput