import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ClockIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  PrinterIcon,
  CheckIcon,
  ScaleIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { apiService, Recipe, IngredientCategory } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { IngredientHelper } from '../utils/ingredientHelper'
import { TagHelper } from '../utils/tagHelper'
import { useCallback } from 'react'
import TextWithHeaders from '../components/TextWithHeaders'
import { TextHeaderParser } from '../utils/textHeaderParser'

interface IngredientItemProps {
  ingredient: string
  isChecked: boolean
  onToggle: () => void
  scale: number
}

interface CustomCheckboxProps {
  size?: 'sm' | 'md' | 'lg'
  isSelected: boolean
  onValueChange: () => void
}

function CustomCheckbox({ size = 'sm', isSelected, onValueChange }: CustomCheckboxProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      onClick={onValueChange}
      className={`flex items-center justify-center ${sizeClass} rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      <div
        className={`w-full h-full rounded border flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
        }`}
      >
        {isSelected ? (
          <CheckIcon className="w-3 h-3" />
        ) : null}
      </div>
    </button>
  )
}

function IngredientItem({ ingredient, isChecked, onToggle, scale }: IngredientItemProps) {
  const scaleIngredient = (ingredient: string, scale: number) => {
    if (scale === 1) return ingredient

    // Map of Unicode fractions to their decimal values
    const fractionMap: Record<string, number> = {
      '¼': 0.25,
      '½': 0.5,
      '¾': 0.75,
      '⅓': 1/3,
      '⅔': 2/3,
      '⅛': 1/8,
      '⅜': 3/8,
      '⅝': 5/8,
      '⅞': 7/8,
    }

    // Common fraction values and their Unicode representations
    const commonFractions = [
      { value: 1/8, unicode: '⅛' },
      { value: 1/6, unicode: '⅙' }, // Approximation
      { value: 1/4, unicode: '¼' },
      { value: 1/3, unicode: '⅓' },
      { value: 3/8, unicode: '⅜' },
      { value: 1/2, unicode: '½' },
      { value: 2/3, unicode: '⅔' },
      { value: 5/8, unicode: '⅝' },
      { value: 3/4, unicode: '¾' },
      { value: 5/6, unicode: '⅚' }, // Approximation
      { value: 7/8, unicode: '⅞' },
    ].sort((a, b) => a.value - b.value)

    // Function to find the closest Unicode fraction
    const findClosestFraction = (value: number): string | null => {
      // For very small values, return decimal
      if (value < 0.05) return null
      
      // Try to find an exact match first (with small tolerance)
      for (const fraction of commonFractions) {
        if (Math.abs(value - fraction.value) < 0.01) {
          return fraction.unicode
        }
      }
      
      // If no exact match, find the closest match if within reasonable range
      let closest = commonFractions[0]
      let minDiff = Math.abs(value - closest.value)
      
      for (let i = 1; i < commonFractions.length; i++) {
        const diff = Math.abs(value - commonFractions[i].value)
        if (diff < minDiff) {
          minDiff = diff
          closest = commonFractions[i]
        }
      }
      
      // Only return if it's a reasonable approximation (within 0.03)
      return minDiff <= 0.03 ? closest.unicode : null
    }

    // Step 1: Convert fractions like "3/4" to decimal
    let processedIngredient = ingredient.replace(/(\d+)\/(\d+)/g, (_, numerator, denominator) => {
      return (parseInt(numerator) / parseInt(denominator)).toString()
    })

    // Step 2: Handle Unicode fractions like ¼, ½, ¾
    processedIngredient = processedIngredient.replace(/([¼½¾⅓⅔⅛⅜⅝⅞])/g, (match) => {
      return fractionMap[match].toString()
    })

    // Step 3: Handle mixed numbers like "1 ½" or "2½"
    processedIngredient = processedIngredient.replace(/(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])/g, (_, whole, fraction) => {
      return (parseInt(whole) + fractionMap[fraction]).toString()
    })

    // Step 4: Scale all decimal numbers, but skip size measurements
    const scaled = processedIngredient.replace(/(\d+(?:\.\d+)?)/g, (match, ...args) => {
      // Extract the offset and fullString from the replace callback args
      const offset = args[args.length - 2]
      const fullString = args[args.length - 1]
      // Check if this number is followed by a size unit that shouldn't be scaled
      const afterNumber = fullString.slice(offset + match.length)
      const sizeUnits = [
        /^\s*"/, // inch symbol
        /^\s*'/, // foot symbol
        /^\s*inch(?:es)?(?:\s|$|,|\.|;)/i,
        /^\s*cm(?:\s|$|,|\.|;)/i,
        /^\s*mm(?:\s|$|,|\.|;)/i,
        /^\s*millimeter(?:s)?(?:\s|$|,|\.|;)/i,
        /^\s*centimeter(?:s)?(?:\s|$|,|\.|;)/i,
        /^\s*-inch(?:\s|$|,|\.|;)/i, // hyphenated like "1/4-inch"
        /^\s*-cm(?:\s|$|,|\.|;)/i,
        /^\s*-mm(?:\s|$|,|\.|;)/i
      ]

      // If this number is followed by a size unit, don't scale it
      if (sizeUnits.some(regex => regex.test(afterNumber))) {
        return match // Return original number unchanged
      }

      const num = parseFloat(match)
      const result = num * scale

      // If it's a whole number, return as integer
      if (Math.abs(result % 1) < 0.001) return Math.round(result).toString()

      // Handle the fractional part
      const wholePart = Math.floor(result)
      const fractionPart = result - wholePart

      // Try to find a matching Unicode fraction
      const fractionChar = findClosestFraction(fractionPart)

      if (fractionChar) {
        return wholePart > 0
          ? `${wholePart}${fractionChar}`
          : fractionChar
      }

      // Otherwise return with 1 or 2 decimal places depending on the value
      return result < 0.1 ? result.toFixed(2) : result.toFixed(1)
    })

    return scaled
  }

  return (
    <div className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <CustomCheckbox
        size="sm"
        isSelected={isChecked}
        onValueChange={onToggle}
      />
      <span className={`text-sm leading-relaxed flex-1 ${isChecked ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
        {scaleIngredient(ingredient, scale)}
      </span>
    </div>
  )
}

interface InstructionStepProps {
  instruction: string
  stepNumber: number
  isCompleted: boolean
  onToggle: () => void
}

function InstructionStep({ instruction, stepNumber, isCompleted, onToggle }: InstructionStepProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-start gap-3 py-2 w-full text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div
        className={`w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full border-2 transition-all flex-shrink-0 ${
          isCompleted
            ? 'bg-green-500 text-white border-green-500'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-blue-500'
        }`}
      >
        {isCompleted ? <CheckIcon className="w-4 h-4" /> : stepNumber}
      </div>
      <TextWithHeaders
        text={instruction}
        className={`text-sm leading-relaxed ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}
      />
    </button>
  )
}

function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [showScaleMenu, setShowScaleMenu] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementError, setEnhancementError] = useState<string | null>(null)
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isUpdatingTags, setIsUpdatingTags] = useState(false)
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [filteredTagSuggestions, setFilteredTagSuggestions] = useState<string[]>([])
  const [highlightedTagIndex, setHighlightedTagIndex] = useState(0)

  const openImageModal = useCallback(() => {
    setShowImageModal(true)
    // lock body scroll
    document.body.style.overflow = 'hidden'
  }, [])

  const closeImageModal = useCallback(() => {
    setShowImageModal(false)
    // restore body scroll
    document.body.style.overflow = ''
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showImageModal) closeImageModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showImageModal, closeImageModal])

  const loadAvailableTags = async () => {
    try {
      const tags = await apiService.getAllTags()
      setAvailableTags(tags)
    } catch (err) {
      console.error('Failed to load available tags:', err)
    }
  }

  useEffect(() => {
    const loadRecipe = async () => {
      if (!id) {
        setError('No recipe ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const fetchedRecipe = await apiService.getRecipe(id)
        setRecipe(fetchedRecipe)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recipe')
        console.error('Failed to load recipe:', err)
      } finally {
        setLoading(false)
      }
    }

    loadRecipe()
    loadAvailableTags()
  }, [id])

  useEffect(() => {
    if (showTagInput && newTag) {
      const filtered = availableTags.filter(tag =>
        tag.toLowerCase().includes(newTag.toLowerCase()) &&
        !recipe?.tags?.includes(tag)
      ).slice(0, 10)
      setFilteredTagSuggestions(filtered)
      setHighlightedTagIndex(0)
      setShowTagSuggestions(filtered.length > 0)
    } else if (showTagInput && newTag === '') {
      // Show all available tags when input is empty but focused
      const filtered = availableTags.filter(tag =>
        !recipe?.tags?.includes(tag)
      ).slice(0, 10)
      setFilteredTagSuggestions(filtered)
      setHighlightedTagIndex(0)
      setShowTagSuggestions(filtered.length > 0)
    } else {
      setFilteredTagSuggestions([])
      setShowTagSuggestions(false)
    }
  }, [newTag, showTagInput, availableTags, recipe?.tags])

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Recipe Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "The recipe you're looking for doesn't exist or has been removed."}
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Recipes
            </button>
          </div>
        </div>
      </div>
    )
  }

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients)
    if (newChecked.has(index)) {
      newChecked.delete(index)
    } else {
      newChecked.add(index)
    }
    setCheckedIngredients(newChecked)
  }

  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedSteps(newCompleted)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.name,
        text: recipe.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const scaleOptions = [
    { key: '0.5', label: '½x', value: 0.5 },
    { key: '1', label: '1x', value: 1 },
    { key: '1.5', label: '1½x', value: 1.5 },
    { key: '2', label: '2x', value: 2 },
    { key: '3', label: '3x', value: 3 },
    { key: '4', label: '4x', value: 4 }
  ]
  
  const handleScaleChange = (newScale: number) => {
    setScale(newScale)
    setShowScaleMenu(false)
  }

  const handleEnhanceRecipe = async () => {
    if (!recipe) return

    try {
      setIsEnhancing(true)
      setEnhancementError(null)
      const response = await apiService.enhanceRecipe(recipe.id)
      setRecipe(response.recipe)
    } catch (err) {
      setEnhancementError(err instanceof Error ? err.message : 'Failed to enhance recipe')
      console.error('Failed to enhance recipe:', err)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleAddTag = async (tagToAdd?: string) => {
    if (!recipe || isUpdatingTags) return

    const rawTag = tagToAdd || newTag.trim()
    if (!rawTag) return

    // Normalize the tag to ensure consistent capitalization
    const tag = TagHelper.normalizeTag(rawTag)
    if (!tag || !TagHelper.isValidTag(tag)) return

    if (recipe.tags?.includes(tag)) {
      setNewTag('')
      setShowTagInput(false)
      setShowTagSuggestions(false)
      return
    }

    try {
      setIsUpdatingTags(true)
      const updatedTags = [...(recipe.tags || []), tag]
      const updatedRecipe = await apiService.updateRecipe(recipe.id, { tags: updatedTags })
      setRecipe(updatedRecipe)
      setNewTag('')
      setShowTagInput(false)
      setShowTagSuggestions(false)
      loadAvailableTags() // Refresh available tags
    } catch (err) {
      console.error('Failed to add tag:', err)
    } finally {
      setIsUpdatingTags(false)
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!recipe || isUpdatingTags) return

    try {
      setIsUpdatingTags(true)
      const updatedTags = recipe.tags?.filter(tag => tag !== tagToRemove) || []
      const updatedRecipe = await apiService.updateRecipe(recipe.id, { tags: updatedTags })
      setRecipe(updatedRecipe)
      loadAvailableTags() // Refresh available tags
    } catch (err) {
      console.error('Failed to remove tag:', err)
    } finally {
      setIsUpdatingTags(false)
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTagSuggestions.length > 0 && highlightedTagIndex >= 0) {
        handleAddTag(filteredTagSuggestions[highlightedTagIndex])
      } else {
        handleAddTag()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredTagSuggestions.length > 0) {
        setHighlightedTagIndex(prev => (prev + 1) % filteredTagSuggestions.length)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredTagSuggestions.length > 0) {
        setHighlightedTagIndex(prev => (prev - 1 + filteredTagSuggestions.length) % filteredTagSuggestions.length)
      }
    } else if (e.key === 'Escape') {
      setNewTag('')
      setShowTagInput(false)
      setShowTagSuggestions(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="p-3 rounded-full bg-white/0 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Back to recipes"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-3 rounded-full bg-white/0 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Share recipe"
          >
            <ShareIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handlePrint}
            className="p-3 rounded-full bg-white/0 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Print recipe"
          >
            <PrinterIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigate('/add-recipe', {
                  state: {
                    copiedRecipe: {
                      name: `${recipe.name} (Copy)`,
                      description: recipe.description,
                      prepTimeMinutes: recipe.prepTimeMinutes,
                      cookTimeMinutes: recipe.cookTimeMinutes,
                      totalTimeMinutes: recipe.totalTimeMinutes,
                      servings: recipe.servings,
                      ingredients: recipe.ingredients,
                      instructions: recipe.instructions,
                      image: recipe.image,
                      sourceUrl: recipe.sourceUrl
                    }
                  }
                })
              }}
              className="p-3 rounded-full bg-white/0 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Copy recipe"
            >
              <DocumentDuplicateIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => navigate(`/recipe/${recipe.id}/edit`)}
              className="p-3 rounded-full bg-white/0 dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Edit recipe"
            >
              <PencilIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={async () => {
                if (window.confirm('Delete this recipe?')) {
                  try {
                    await apiService.deleteRecipe(recipe.id)
                    navigate('/')
                  } catch (err) {
                    alert('Failed to delete recipe: ' + (err instanceof Error ? err.message : 'Unknown error'))
                  }
                }
              }}
              className="p-3 rounded-full bg-white/0 dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label="Delete recipe"
            >
              <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-gray-900 dark:text-white">{recipe.name}</h1>
              <TextWithHeaders
                text={recipe.description}
                className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed max-w-3xl"
              />

              {/* Source URL Attribution */}
              {recipe.sourceUrl && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recipe adapted from{' '}
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                    >
                      {new URL(recipe.sourceUrl).hostname}
                    </a>
                  </p>
                </div>
              )}

              {/* Tags */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Folder:{' '}
                    {recipe.tags && recipe.tags.length > 0 ? (
                      recipe.tags.map((tag, index) => (
                        <span key={tag} className="inline-flex items-center">
                          <button
                            onClick={() => navigate(`/?tag=${encodeURIComponent(tag)}`)}
                            className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            title="View all recipes with this tag"
                          >
                            {tag}
                          </button>
                          {user && (
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              disabled={isUpdatingTags}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Remove tag"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          )}
                          {index < (recipe.tags?.length || 0) - 1 && ', '}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 italic">None</span>
                    )}
                  </p>

                  {showTagInput ? (
                    <div className="relative flex items-center gap-1">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={() => {
                          // Delay hiding suggestions to allow clicking on them
                          setTimeout(() => {
                            setShowTagSuggestions(false)
                            if (!newTag.trim()) {
                              setShowTagInput(false)
                            }
                          }, 200)
                        }}
                        onFocus={() => {
                          // Show suggestions when input gains focus if there are filtered suggestions
                          if (filteredTagSuggestions.length > 0) {
                            setShowTagSuggestions(true)
                          }
                        }}
                        placeholder="Add tag..."
                        disabled={isUpdatingTags}
                        className="w-20 px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setNewTag('')
                          setShowTagInput(false)
                          setShowTagSuggestions(false)
                        }}
                        disabled={isUpdatingTags}
                        className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>

                      {/* Suggestions Dropdown */}
                      {showTagSuggestions && filteredTagSuggestions.length > 0 && !isUpdatingTags && (
                        <div className="absolute z-50 top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-32 overflow-y-auto min-w-24">
                          {filteredTagSuggestions.map((suggestion, index) => (
                            <button
                              key={suggestion}
                              type="button"
                              onMouseDown={(e) => {
                                // Prevent blur event when clicking on suggestion
                                e.preventDefault()
                              }}
                              onClick={() => handleAddTag(suggestion)}
                              className={`w-full text-left px-2 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                index === highlightedTagIndex
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : user ? (
                    <button
                      onClick={() => setShowTagInput(true)}
                      disabled={isUpdatingTags}
                      className="p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                      title="Add tag"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Show badges inline only when there is no image */}
              {!recipe.image && (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Prep: {recipe.prepTimeMinutes} min</span>
                  </div>
                  {recipe.cookTimeMinutes && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Cook: {recipe.cookTimeMinutes} min</span>
                    </div>
                  )}
                  {recipe.totalTimeMinutes && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Total: {recipe.totalTimeMinutes} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <UsersIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(recipe.servings * scale)} servings</span>
                  </div>
                </div>
              )}
            </div>

            {/* Optional compact hero image to the side on md+ screens */}
            {recipe.image && (
              <>
                <div className="mt-4 md:mt-0 md:shrink-0 md:w-56 lg:w-72 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
                  <img
                    src={apiService.constructImageUrl(recipe.image)}
                    alt={`${recipe.name} image`}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    className="w-full h-36 md:h-44 lg:h-56 object-cover block cursor-pointer"
                    onClick={openImageModal}
                  />

                  {/* Overlay badges */}
                  <div className="absolute left-3 bottom-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-2 py-1 bg-black/60 text-white rounded-lg backdrop-blur-sm text-sm">
                      <ClockIcon className="w-4 h-4 text-white opacity-90" />
                      <span className="font-medium">Prep: {recipe.prepTimeMinutes} min</span>
                    </div>
                    {recipe.cookTimeMinutes && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-black/60 text-white rounded-lg backdrop-blur-sm text-sm">
                        <ClockIcon className="w-4 h-4 text-white opacity-90" />
                        <span className="font-medium">Cook: {recipe.cookTimeMinutes} min</span>
                      </div>
                    )}
                    {recipe.totalTimeMinutes && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-black/60 text-white rounded-lg backdrop-blur-sm text-sm">
                        <ClockIcon className="w-4 h-4 text-white opacity-90" />
                        <span className="font-medium">Total: {recipe.totalTimeMinutes} min</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-2 py-1 bg-black/60 text-white rounded-lg backdrop-blur-sm text-sm">
                      <UsersIcon className="w-4 h-4 text-white opacity-90" />
                      <span className="font-medium">{Math.round(recipe.servings * scale)} servings</span>
                    </div>
                  </div>
                </div>

                {/* Image Modal */}
                {showImageModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeImageModal} />
                    <div className="relative max-w-5xl w-full max-h-[90vh] overflow-hidden rounded-lg z-50">
                      <button
                        type="button"
                        onClick={closeImageModal}
                        className="absolute right-2 top-2 z-50 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                        aria-label="Close image"
                      >
                        ×
                      </button>
                      <img
                        src={apiService.constructImageUrl(recipe.image)}
                        alt={`${recipe.name} full size`}
                        className="w-full h-auto max-h-[90vh] object-contain block bg-black"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Instructions */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Instructions</h2>
            <button
              onClick={() => setCompletedSteps(new Set())}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Reset steps"
              title="Reset steps"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            {recipe.instructions.map((instruction, index) => {
              // Check if this instruction is purely a header
              if (TextHeaderParser.isPureHeader(instruction)) {
                return (
                  <div key={index} className="py-2">
                    <TextWithHeaders
                      text={instruction}
                      className="text-lg font-semibold text-gray-900 dark:text-white"
                    />
                  </div>
                )
              }

              // Calculate step number by counting non-header instructions before this one
              const stepNumber = recipe.instructions
                .slice(0, index)
                .filter(inst => !TextHeaderParser.isPureHeader(inst))
                .length + 1

              return (
                <InstructionStep
                  key={index}
                  instruction={instruction}
                  stepNumber={stepNumber}
                  isCompleted={completedSteps.has(index)}
                  onToggle={() => toggleStep(index)}
                />
              )
            })}
          </div>
        </div>

        {/* Ingredients Sidebar */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ingredients</h3>
                <button
                  onClick={() => {
                    const allIngredients = IngredientHelper.getAllIngredients(recipe.ingredients);
                    const allIndices = new Set(allIngredients.map((_, index) => index));
                    setCheckedIngredients(
                      checkedIngredients.size === allIngredients.length ? new Set() : allIndices
                    );
                  }}
                  className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {checkedIngredients.size === IngredientHelper.getAllIngredients(recipe.ingredients).length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <ScaleIcon className="w-4 h-4 text-gray-400" />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowScaleMenu(!showScaleMenu)}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                  >
                    {scaleOptions.find(o => o.value === scale)?.label ?? `${scale}x`}
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                  
                  {showScaleMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowScaleMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-24 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        {scaleOptions.map(option => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => handleScaleChange(option.value)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between cursor-pointer ${
                              scale === option.value ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            <span>{option.label}</span>
                            {scale === option.value && <CheckIcon className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {IngredientHelper.isCategorized(recipe.ingredients) ? (
                // Render categorized ingredients
                (recipe.ingredients as IngredientCategory[]).map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    {category.category && (
                      <h4 className="font-semibold text-gray-900 dark:text-white mt-4 first:mt-0 mb-2">
                        {category.category}
                      </h4>
                    )}
                    <div className={`space-y-1 ${category.category ? '' : 'ml-4'}`}>
                      {category.items.map((ingredient, itemIndex) => {
                        const flatIndex = IngredientHelper.getAllIngredients(recipe.ingredients.slice(0, categoryIndex))
                          .length + itemIndex;
                        return (
                          <IngredientItem
                            key={`${categoryIndex}-${itemIndex}`}
                            ingredient={ingredient}
                            isChecked={checkedIngredients.has(flatIndex)}
                            onToggle={() => toggleIngredient(flatIndex)}
                            scale={scale}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                // Render flat ingredients (backward compatibility)
                (recipe.ingredients as string[]).map((ingredient, index) => (
                  <IngredientItem
                    key={index}
                    ingredient={ingredient}
                    isChecked={checkedIngredients.has(index)}
                    onToggle={() => toggleIngredient(index)}
                    scale={scale}
                  />
                ))
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Created {new Date(recipe.createdAt).toLocaleDateString()}</span>
                {/* Deselect All already provides reset functionality */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chef's Notes Section */}
      <div className="mt-12">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Chef's Notes</h2>
            </div>
            {!recipe.aiEnhancedNotes && (
              <button
                onClick={handleEnhanceRecipe}
                disabled={isEnhancing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isEnhancing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Enhance with AI
                  </>
                )}
              </button>
            )}
          </div>

          {enhancementError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{enhancementError}</p>
            </div>
          )}

          {recipe.aiEnhancedNotes ? (
            <div className="prose prose-blue dark:prose-invert max-w-none">
              {(() => {
                try {
                  const enhancement = JSON.parse(recipe.aiEnhancedNotes)
                  return (
                    <div className="space-y-6">
                      {enhancement.cookingTips && enhancement.cookingTips.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🔥 Cooking Tips</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            {enhancement.cookingTips.map((tip: string, index: number) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enhancement.traditionalNotes && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📜 Traditional Notes</h3>
                          <p className="text-gray-700 dark:text-gray-300">{enhancement.traditionalNotes}</p>
                        </div>
                      )}

                      {enhancement.modernVariations && enhancement.modernVariations.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">✨ Modern Variations</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            {enhancement.modernVariations.map((variation: string, index: number) => (
                              <li key={index}>{variation}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enhancement.troubleshooting && enhancement.troubleshooting.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🛠️ Troubleshooting</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            {enhancement.troubleshooting.map((tip: string, index: number) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enhancement.servingSuggestions && enhancement.servingSuggestions.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🍽️ Serving Suggestions</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            {enhancement.servingSuggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {enhancement.storageNotes && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">🥫 Storage Notes</h3>
                          <p className="text-gray-700 dark:text-gray-300">{enhancement.storageNotes}</p>
                        </div>
                      )}
                    </div>
                  )
                } catch {
                  return <p className="text-gray-600 dark:text-gray-400 italic">AI-enhanced notes available but format is invalid.</p>
                }
              })()}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Get AI-powered cooking tips, variations, and chef's insights for this recipe.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Enhance this recipe with professional chef knowledge and traditional cooking wisdom.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RecipeDetailPage