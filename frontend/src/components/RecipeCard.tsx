import { Link } from 'react-router-dom'
import {
  ClockIcon,
  UsersIcon,
  GlobeAltIcon,
  HomeIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { Recipe } from '../services/api'
import { buildRecipeImageSources } from '../utils/recipeImages'
import ResponsiveImage from './ResponsiveImage'
import { TagList } from './TagList'

export interface RecipeCardProps {
  recipe: Recipe
  layout: 'grid' | 'list'
  onEdit: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onCopy: (id: string, e: React.MouseEvent) => void
  onTagClick: (tag: string) => void
  prioritize?: boolean
  formatDate: (dateStr: string) => string
  renderActions: (recipe: Recipe) => React.ReactNode
}

/**
 * Reusable RecipeCard component that supports both grid and list layouts
 * Consolidates common recipe card rendering logic
 */
export function RecipeCard({
  recipe,
  layout,
  onTagClick,
  prioritize,
  formatDate,
  renderActions,
}: RecipeCardProps) {
  const { src, imageSizes } = buildRecipeImageSources(recipe)

  if (layout === 'grid') {
    return (
      <Link to={`/recipe/${recipe.id}`} className="block group">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 overflow-hidden">
          <div className="h-24 sm:h-36 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
            {/* If recipe.image exists render it, otherwise keep gradient */}
            {src ? (
              <ResponsiveImage
                src={src}
                alt={`${recipe.name} image`}
                imageSizes={imageSizes}
                blurDataUrl={recipe.blurDataUrl}
                context="grid"
                className="absolute inset-0 w-full h-full"
                fetchPriority={prioritize ? 'high' : 'auto'}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 hidden sm:block">
              {renderActions(recipe)}
            </div>
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 hidden sm:block">
              <div className="p-1.5 rounded-full bg-black/30 backdrop-blur-sm">
                {recipe.isPublic ? (
                  <GlobeAltIcon className="w-4 h-4 text-white" title="Public recipe" />
                ) : recipe.householdId ? (
                  <HomeIcon className="w-4 h-4 text-white" title="Household recipe" />
                ) : (
                  <LockClosedIcon className="w-4 h-4 text-white" title="Private recipe" />
                )}
              </div>
            </div>
            <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 hidden sm:flex">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/30 text-white backdrop-blur-sm text-xs rounded-full">
                  {formatDate(recipe.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/30 text-white backdrop-blur-sm text-xs rounded-full">
                  <ClockIcon className="w-3 h-3" />
                  {(recipe.totalTimeMinutes || recipe.prepTimeMinutes)}m
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
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-2">
              {recipe.description}
            </p>
            {/* Tags */}
            <TagList 
              tags={recipe.tags || []} 
              maxDisplay={3} 
              onTagClick={onTagClick}
              className="mt-2"
            />
          </div>
        </div>
      </Link>
    )
  }

  // List layout
  return (
    <Link to={`/recipe/${recipe.id}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 p-2 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex-shrink-0 overflow-hidden">
            {src ? (
              <ResponsiveImage
                src={src}
                alt={`${recipe.name} thumbnail`}
                imageSizes={imageSizes}
                blurDataUrl={recipe.blurDataUrl}
                context="list"
                className="w-full h-full"
                fetchPriority={prioritize ? 'high' : 'auto'}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 truncate text-gray-900 dark:text-white">
              {recipe.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-1 sm:mb-2">
              {recipe.description}
            </p>
            <div className="flex items-center gap-2 sm:gap-3 mb-1">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {recipe.isPublic ? (
                  <GlobeAltIcon className="w-3 h-3" title="Public recipe" />
                ) : recipe.householdId ? (
                  <HomeIcon className="w-3 h-3" title="Household recipe" />
                ) : (
                  <LockClosedIcon className="w-3 h-3" title="Private recipe" />
                )}
                <span>{formatDate(recipe.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <ClockIcon className="w-3 h-3" />
                <span>{(recipe.totalTimeMinutes || recipe.prepTimeMinutes)}m</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <UsersIcon className="w-3 h-3" />
                <span>{recipe.servings}</span>
              </div>
            </div>
            {/* Tags */}
            <TagList 
              tags={recipe.tags || []} 
              maxDisplay={4} 
              onTagClick={onTagClick}
              className="mt-1"
            />
          </div>
          {renderActions(recipe)}
        </div>
      </div>
    </Link>
  )
}
