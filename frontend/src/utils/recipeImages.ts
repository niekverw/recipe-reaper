import { apiService, Recipe } from '../services/api'
import { generateSizes, generateSrcSet, type ImageSizes as ResponsiveImageSizes } from './imageUtils'

// Memoization cache for recipe image processing
const imageSourcesCache = new Map<string, { src: string; imageSizes?: ResponsiveImageSizes }>()
const imageSizesCache = new Map<string, ResponsiveImageSizes>()

const createImageSizesCacheKey = (sizes: NonNullable<Recipe['imageSizes']>): string => {
  return [
    sizes.small.url,
    sizes.small.webp ?? '',
    sizes.small.width,
    sizes.small.height ?? '',
    sizes.medium.url,
    sizes.medium.webp ?? '',
    sizes.medium.width,
    sizes.medium.height ?? '',
    sizes.large.url,
    sizes.large.webp ?? '',
    sizes.large.width,
    sizes.large.height ?? ''
  ].join('|')
}

const createRecipeImageCacheKey = (recipe: Recipe): string => {
  const parts: Array<string | number | undefined> = [
    recipe.id,
    recipe.updatedAt,
    recipe.image
  ]

  if (recipe.imageSizes) {
    parts.push(
      recipe.imageSizes.small.url,
      recipe.imageSizes.medium.url,
      recipe.imageSizes.large.url,
      recipe.imageSizes.small.webp,
      recipe.imageSizes.medium.webp,
      recipe.imageSizes.large.webp
    )
  }

  return parts.filter((part) => part !== undefined && part !== null).join('|')
}

/**
 * Maps recipe image sizes to ResponsiveImage format with API URL construction
 */
export function mapRecipeImageSizes(imageSizes: NonNullable<Recipe['imageSizes']>): ResponsiveImageSizes {
  const cacheKey = createImageSizesCacheKey(imageSizes)

  if (imageSizesCache.has(cacheKey)) {
    return imageSizesCache.get(cacheKey)!
  }

  const mapSize = (size: { url: string; width: number; height?: number; webp?: string }) => ({
    url: apiService.constructImageUrl(size.url),
    width: size.width,
    height: size.height ?? Math.round(size.width * 0.75),
    webp: size.webp ? apiService.constructImageUrl(size.webp) : undefined
  })

  const result = {
    small: mapSize(imageSizes.small),
    medium: mapSize(imageSizes.medium),
    large: mapSize(imageSizes.large)
  }

  imageSizesCache.set(cacheKey, result)
  return result
}

/**
 * Builds image sources for a recipe with memoization
 */
export function buildRecipeImageSources(recipe: Recipe): { src: string; imageSizes?: ResponsiveImageSizes } {
  const cacheKey = createRecipeImageCacheKey(recipe)

  if (imageSourcesCache.has(cacheKey)) {
    return imageSourcesCache.get(cacheKey)!
  }

  const mappedSizes = recipe.imageSizes ? mapRecipeImageSizes(recipe.imageSizes) : undefined
  const src = mappedSizes?.small.url
    ?? (recipe.image ? apiService.constructImageUrl(recipe.image) : '')

  const result = { src, imageSizes: mappedSizes }
  imageSourcesCache.set(cacheKey, result)
  return result
}

/**
 * Builds hero image preload data for the first recipe with proper srcset/sizes
 */
export function buildHeroImagePreloadData(firstRecipe: Recipe | null): {
  src: string
  srcset?: string
  sizes?: string
} {
  if (!firstRecipe) return { src: '' }

  const { src, imageSizes } = buildRecipeImageSources(firstRecipe)

  if (!imageSizes) {
    return { src }
  }

  const srcset = generateSrcSet(imageSizes)
  const sizes = generateSizes('grid') // Hero images are in grid context
  return { src, srcset, sizes }
}

/**
 * Clears the image processing cache (useful for testing or memory management)
 */
export function clearImageCache(): void {
  imageSourcesCache.clear()
  imageSizesCache.clear()
}