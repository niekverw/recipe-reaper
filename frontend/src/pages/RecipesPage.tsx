import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  ClockIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  Bars3BottomLeftIcon,
  Squares2X2Icon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { sampleRecipes } from '../data/sampleRecipes'

interface RecipeActionsProps {
  recipeId: string
  onEdit: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

function RecipeActions({ recipeId, onEdit, onDelete }: RecipeActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onEdit(recipeId, e)
        }}
        className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Edit recipe"
      >
        <PencilIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDelete(recipeId, e)
        }}
        className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Delete recipe"
      >
        <TrashIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  )
}

interface RecipeGridCardProps {
  recipe: typeof sampleRecipes[0]
  onEdit: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

function RecipeGridCard({ recipe, onEdit, onDelete }: RecipeGridCardProps) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
        <div className="h-24 sm:h-36 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {/* date moved into metadata area to avoid changing card size */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
            <RecipeActions
              recipeId={recipe.id}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/30 text-white backdrop-blur-sm text-xs rounded-full">
                {formatDateShort(recipe.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/30 text-white backdrop-blur-sm text-xs rounded-full">
                <ClockIcon className="w-3 h-3" />
                {recipe.prepTimeMinutes}m
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/30 text-white backdrop-blur-sm text-xs rounded-full">
                <UsersIcon className="w-3 h-3" />
                {recipe.servings}
              </span>
            </div>
          </div>
        </div>
        <div className="p-2 sm:p-3 md:p-4">
          <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-1 sm:mb-2 line-clamp-1 sm:line-clamp-2 text-gray-900 dark:text-white">
            {recipe.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {recipe.description}
          </p>
        </div>
      </div>
    </Link>
  )
}

interface RecipeListCardProps {
  recipe: typeof sampleRecipes[0]
  onEdit: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

function RecipeListCard({ recipe, onEdit, onDelete }: RecipeListCardProps) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 p-2 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex-shrink-0" />
          {/* date shown inline with other meta so it doesn't affect card sizing */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 truncate text-gray-900 dark:text-white">
              {recipe.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-1 sm:mb-2">
              {recipe.description}
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateShort(recipe.createdAt)}</div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-3 h-3" />
                <span>{recipe.prepTimeMinutes}m</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <UsersIcon className="w-3 h-3" />
                <span>{recipe.servings}</span>
              </div>
            </div>
          </div>
          <RecipeActions
            recipeId={recipe.id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </Link>
  )
}

function RecipesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = sampleRecipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'time':
          return a.prepTimeMinutes - b.prepTimeMinutes
        case 'servings':
          return a.servings - b.servings
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
  }, [searchQuery, sortBy])

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Edit recipe:', id)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Delete recipe:', id)
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                {CONTENT.pageTitle}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                {filteredAndSortedRecipes.length} {CONTENT.recipesLabel}
              </span>
            </div>
            <Link
              to="/add-recipe"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Add Recipe</span>
            </Link>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder={CONTENT.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="name">Name</option>
                  <option value="time">Time</option>
                  <option value="servings">Servings</option>
                  <option value="recent">Recent</option>
                </select>
                <FunnelIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>

              {/* View Toggle */}
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Grid view"
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg border-l border-gray-300 dark:border-gray-600 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  aria-label="List view"
                >
                  <Bars3BottomLeftIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredAndSortedRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{CONTENT.noResultsTitle}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{CONTENT.noResultsMessage}</p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                {filteredAndSortedRecipes.map((recipe) => (
                  <RecipeGridCard
                    key={recipe.id}
                    recipe={recipe}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredAndSortedRecipes.map((recipe) => (
                  <RecipeListCard
                    key={recipe.id}
                    recipe={recipe}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RecipesPage

// Static content
const CONTENT = {
  pageTitle: 'Recipe Collection',
  searchPlaceholder: 'Search recipes...',
  recipesLabel: 'recipes',
  noResultsTitle: 'No recipes found',
  noResultsMessage: 'Try adjusting your search or add a new recipe to get started.'
}

// Interfaces
export interface RecipeListProps {
  recipes: typeof sampleRecipes
}

// Helpers
function formatDateShort(dateStr: string) {
  try {
    const d = new Date(dateStr)
    const monthDay = d.toLocaleString(undefined, { month: 'short', day: 'numeric' })
    const twoDigitYear = String(d.getFullYear()).slice(-2)
    return `${monthDay} \u2019${twoDigitYear}`
  } catch (e) {
    return ''
  }
}