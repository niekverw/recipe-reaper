import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon,
  DocumentDuplicateIcon,
  XMarkIcon,
  TagIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { apiService, Recipe } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getRandomLoadingHumor, getRandomGeneralHumor } from '../utils/humor'
import AlertBanner from '../components/AlertBanner'
import { RecipeCard } from '../components/RecipeCard'
import { buildHeroImagePreloadData } from '../utils/recipeImages'
import { CONTENT } from '../constants/content'

const PRIORITIZED_IMAGE_COUNT = 6

interface RecipeActionsProps {
  recipe: Recipe
  onEdit: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onCopy: (id: string, e: React.MouseEvent) => void
}

function RecipeActions({ recipe, onEdit, onDelete, onCopy }: RecipeActionsProps) {
  // For recipes user cannot edit, only show copy button
  if (!recipe.canEdit) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onCopy(recipe.id, e)
          }}
          className="p-2 rounded-full bg-black/30 hover:bg-black/40 dark:bg-black/30 dark:hover:bg-black/40 text-white backdrop-blur-sm transition-colors"
          aria-label="Copy to my recipes"
        >
          <DocumentDuplicateIcon className="w-5 h-5 text-white" />
        </button>
      </div>
    )
  }

  // For user's own recipes or household recipes, show edit and delete
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onCopy(recipe.id, e)
        }}
        className="p-2 rounded-full bg-black/30 hover:bg-black/40 dark:bg-black/30 dark:hover:bg-black/40 text-white backdrop-blur-sm transition-colors"
        aria-label="Duplicate recipe"
      >
        <DocumentDuplicateIcon className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onEdit(recipe.id, e)
        }}
        className="p-2 rounded-full bg-black/30 hover:bg-black/40 dark:bg-black/30 dark:hover:bg-black/40 text-white backdrop-blur-sm transition-colors"
        aria-label="Edit recipe"
      >
        <PencilIcon className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete(recipe.id, e)
        }}
        className="p-2 rounded-full bg-black/30 hover:bg-black/40 dark:bg-black/30 dark:hover:bg-black/40 text-white backdrop-blur-sm transition-colors"
        aria-label="Delete recipe"
      >
        <TrashIcon className="w-5 h-5 text-white" />
      </button>
    </div>
  )
}

// RecipeGridCard and RecipeListCard removed - now using unified RecipeCard component

function RecipesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, household } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [showOnlyMyRecipes, setShowOnlyMyRecipes] = useState(false)

  // Get scope from URL parameters
  const scope = searchParams.get('scope') as 'my' | 'public' | 'all' || (user ? 'my' : 'public')

  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = recipes.filter(recipe => {
      // Text search filter
      const matchesSearch = !searchQuery ||
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Tag filter (OR logic - recipe must have at least one of the selected tags)
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => recipe.tags?.includes(tag))

      // My recipes filter
      const matchesMyRecipes = !showOnlyMyRecipes || recipe.userId === user?.id

      return matchesSearch && matchesTags && matchesMyRecipes
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'time':
          return (a.totalTimeMinutes || a.prepTimeMinutes) - (b.totalTimeMinutes || b.prepTimeMinutes)
        case 'servings':
          return a.servings - b.servings
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
  }, [recipes, searchQuery, sortBy, selectedTags, showOnlyMyRecipes, user?.id])

  // Hero image preload optimization - stable dependencies to prevent churn
  const firstRecipe = filteredAndSortedRecipes[0]
  const heroImageSignature = firstRecipe
    ? [
        firstRecipe.id,
        firstRecipe.updatedAt,
        firstRecipe.image,
        firstRecipe.imageSizes?.small?.url,
        firstRecipe.imageSizes?.medium?.url,
        firstRecipe.imageSizes?.large?.url
      ].join('|')
    : null

  const heroImageData = useMemo(
    () => buildHeroImagePreloadData(firstRecipe ?? null),
    [heroImageSignature]
  )

  useEffect(() => {
    if (typeof document === 'undefined') return

    const head = document.head
    if (!head) return

    const preloadId = 'preload-first-recipe-image'
    const existingLink = head.querySelector<HTMLLinkElement>(`link[data-preload-id="${preloadId}"]`)

    if (!heroImageData.src) {
      if (existingLink) {
        head.removeChild(existingLink)
      }
      return
    }

    // Check if existing link matches current data (href + srcset)
    if (existingLink?.href === heroImageData.src &&
        existingLink.getAttribute('imagesrcset') === (heroImageData.srcset || '')) {
      return
    }

    if (existingLink) {
      head.removeChild(existingLink)
    }

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = heroImageData.src
    link.setAttribute('fetchpriority', 'high')
    link.setAttribute('data-preload-id', preloadId)

    // Set responsive preload attributes for better LCP alignment
    if (heroImageData.srcset) {
      link.setAttribute('imagesrcset', heroImageData.srcset)
    }
    if (heroImageData.sizes) {
      link.setAttribute('imagesizes', heroImageData.sizes)
    }

    head.appendChild(link)

    return () => {
      if (head.contains(link)) {
        head.removeChild(link)
      }
    }
  }, [heroImageData.src, heroImageData.srcset, heroImageData.sizes])

  // Load recipes on mount and when scope changes
  useEffect(() => {
    loadRecipes()
    loadAvailableTags()
  }, [scope, location.key]) // Also reload when location.key changes (navigation)

  // Handle URL parameters for tag filtering
  useEffect(() => {
    const tagParam = searchParams.get('tag')
    if (tagParam && selectedTags.length === 0) {
      // Only set from URL parameter if no tags are currently selected
      // This prevents re-adding tags when they're being removed
      setSelectedTags([tagParam])
      setShowTagFilter(true)
    } else if (!tagParam && selectedTags.length > 0) {
      // If URL has no tag parameter but we have selected tags, 
      // this likely means we came from an external link, so sync URL
      updateURLWithTags(selectedTags)
    }
  }, [searchParams])

  const loadRecipes = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedRecipes = await apiService.getRecipes({ scope })
      setRecipes(fetchedRecipes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes')
      console.error('Failed to load recipes:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableTags = async () => {
    try {
      const tags = await apiService.getAllTags()
      setAvailableTags(tags)
    } catch (err) {
      console.error('Failed to load available tags:', err)
    }
  }

  const addTagFilter = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag]
      setSelectedTags(newTags)
      updateURLWithTags(newTags)
    }
  }

  const removeTagFilter = (tag: string) => {
    const newTags = selectedTags.filter(t => t !== tag)
    setSelectedTags(newTags)
    updateURLWithTags(newTags)
  }

  const clearTagFilters = () => {
    setSelectedTags([])
    updateURLWithTags([])
  }

  const updateURLWithTags = (tags: string[]) => {
    const newSearchParams = new URLSearchParams()
    if (tags.length === 1) {
      newSearchParams.set('tag', tags[0])
    } else if (tags.length > 1) {
      // For multiple tags, we could use a different approach
      // For now, we'll just show the first tag in the URL
      newSearchParams.set('tag', tags[0])
    }
    // Update URL without causing a navigation
    setSearchParams(newSearchParams, { replace: true })
  }

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/recipe/${id}/edit`)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await apiService.deleteRecipe(id)
        await loadRecipes()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete recipe')
        console.error('Failed to delete recipe:', err)
      }
    }
  }

  const handleCopy = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const originalRecipe = recipes.find(r => r.id === id)
      if (!originalRecipe) return

      // For public recipes, use the API copy endpoint
      if (originalRecipe.isPublic && originalRecipe.userId !== user?.id) {
        const copiedRecipe = await apiService.copyRecipe(id, {
          householdId: household?.id
        })

        // Navigate to edit the copied recipe or to My Recipes page
        if (scope === 'public') {
          // If we're browsing public recipes, navigate to My Recipes to see the copy
          navigate('/?scope=my')
        } else {
          // If we're already in My Recipes, navigate to edit the copied recipe
          navigate(`/recipe/${copiedRecipe.id}/edit`)
        }
      } else {
        // For own recipes, navigate to add recipe page with copied data
        navigate('/add-recipe', {
          state: {
            copiedRecipe: {
              name: `${originalRecipe.name} (Copy)`,
              description: originalRecipe.description,
              prepTimeMinutes: originalRecipe.prepTimeMinutes,
              cookTimeMinutes: originalRecipe.cookTimeMinutes,
              totalTimeMinutes: originalRecipe.totalTimeMinutes,
              servings: originalRecipe.servings,
              ingredients: originalRecipe.ingredients,
              instructions: originalRecipe.instructions,
              image: originalRecipe.image,
              sourceUrl: originalRecipe.sourceUrl
            }
          }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy recipe')
      console.error('Failed to copy recipe:', err)
    }
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="sr-only">{getPageTitle(scope, user)}</h1>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {user ? (
              <div className="flex flex-1 flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setSearchParams({ scope: 'my' })}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    scope === 'my'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Recipes
                </button>
                <button
                  type="button"
                  onClick={() => setSearchParams({ scope: 'public' })}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    scope === 'public'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Public
                </button>

                <span className="ml-auto inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  {filteredAndSortedRecipes.length} {CONTENT.recipes.recipesLabel}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                {filteredAndSortedRecipes.length} {CONTENT.recipes.recipesLabel}
              </span>
            )}
          </div>

          {/* Search & Filters */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-grow basis-full min-w-[220px] sm:basis-72">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder={CONTENT.recipes.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowTagFilter(!showTagFilter)}
                aria-pressed={showTagFilter}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  showTagFilter
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <TagIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Tags</span>
                {selectedTags.length > 0 && (
                  <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                    {selectedTags.length}
                  </span>
                )}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => setShowOnlyMyRecipes(!showOnlyMyRecipes)}
                  aria-pressed={showOnlyMyRecipes}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    showOnlyMyRecipes
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  title="Show only recipes I created"
                >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">My Recipes</span>
                </button>
              )}

              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="name">Name</option>
                    <option value="time">Time</option>
                    <option value="servings">Servings</option>
                    <option value="recent">Recent</option>
                  </select>
                  <FunnelIcon className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>

                <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    className={`p-2 transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    aria-label="Grid view"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-pressed={viewMode === 'list'}
                    className={`border-l border-gray-200 p-2 transition-colors dark:border-gray-600 ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    aria-label="List view"
                  >
                    <Bars3BottomLeftIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {selectedTags.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200/60 bg-blue-50/70 p-2 dark:border-blue-800/60 dark:bg-blue-900/20">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-800 dark:text-blue-100">
                  Active
                </span>
                {selectedTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTagFilter(tag)}
                    className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-sm text-blue-700 shadow-sm transition-colors hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-100 dark:hover:bg-blue-800/60"
                  >
                    {tag}
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearTagFilters}
                  className="ml-auto text-sm font-medium text-blue-700 underline-offset-2 transition-colors hover:text-blue-900 dark:text-blue-200 dark:hover:text-blue-100"
                >
                  Clear
                </button>
              </div>
            )}

            {showTagFilter && (
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                {availableTags.filter(tag => !selectedTags.includes(tag)).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {availableTags
                      .filter(tag => !selectedTags.includes(tag))
                      .map(tag => (
                        <button
                          key={tag}
                          onClick={() => addTagFilter(tag)}
                          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-left text-sm text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-gray-50 py-2 text-center text-sm text-gray-500 dark:bg-gray-800/40 dark:text-gray-400">
                    All tags are already selected
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <AlertBanner
            variant="error"
            description={error}
            onDismiss={() => setError(null)}
            actions={(
              <button
                type="button"
                onClick={loadRecipes}
                className="font-medium text-red-700 underline underline-offset-2 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100"
              >
                Try again
              </button>
            )}
          />
        )}

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading recipes...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 italic">
              {getRandomLoadingHumor()}
            </p>
          </div>
        ) : filteredAndSortedRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{CONTENT.recipes.noResultsTitle}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{CONTENT.recipes.noResultsMessage}</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {filteredAndSortedRecipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    layout="grid"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onTagClick={addTagFilter}
                    prioritize={index < PRIORITIZED_IMAGE_COUNT}
                    formatDate={formatDateShort}
                    renderActions={(recipe) => (
                      <RecipeActions
                        recipe={recipe}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                      />
                    )}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredAndSortedRecipes.map((recipe, index) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    layout="list"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                    onTagClick={addTagFilter}
                    prioritize={index < PRIORITIZED_IMAGE_COUNT}
                    formatDate={formatDateShort}
                    renderActions={(recipe) => (
                      <RecipeActions
                        recipe={recipe}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onCopy={handleCopy}
                      />
                    )}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="text-center mt-8">
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {getRandomGeneralHumor()}
        </p>
      </footer>
    </div>
  )
}

export default RecipesPage

// Static content now imported from constants/content.ts

// Interfaces
export interface RecipeListProps {
  recipes: Recipe[]
}

// Helpers
function formatDateShort(dateStr: string) {
  try {
    const d = new Date(dateStr)
    const monthDay = d.toLocaleString(undefined, { month: 'short', day: 'numeric' })
    const twoDigitYear = String(d.getFullYear()).slice(-2)
    return `${monthDay} '${twoDigitYear}`
  } catch (e) {
    return ''
  }
}

function getPageTitle(scope: string, user: any) {
  if (!user) return 'Public Recipes'

  switch (scope) {
    case 'my':
      return 'Recipes'
    case 'public':
      return 'Browse Public Recipes'
    case 'all':
      return 'All Recipes'
    default:
      return 'Recipes'
  }
}