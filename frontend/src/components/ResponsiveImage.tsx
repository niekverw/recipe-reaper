import { useMemo, useRef } from 'react'
import { ImageSizes, generateSrcSet, generateWebPSrcSet, generateSizes } from '../utils/imageUtils'

interface ResponsiveImageProps {
  src: string
  alt: string
  imageSizes?: ImageSizes
  blurDataUrl?: string
  className?: string
  context?: 'grid' | 'list' | 'detail'
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'auto' | 'low' | 'high'
  decoding?: 'async' | 'sync' | 'auto'
  onClick?: (e?: React.MouseEvent) => void
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  disableAspectRatio?: boolean
  imageClassName?: string
}

export default function ResponsiveImage({
  src,
  alt,
  imageSizes,
  blurDataUrl,
  className = '',
  context = 'grid',
  loading,
  fetchPriority = 'auto',
  decoding = 'async',
  onClick,
  onError,
  objectFit = 'cover',
  disableAspectRatio = false,
  imageClassName
}: ResponsiveImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const dimensionSource = useMemo(() => {
    if (!imageSizes) return undefined
    return imageSizes.large ?? imageSizes.medium ?? imageSizes.small
  }, [imageSizes])

  const intrinsicWidth = dimensionSource?.width
  const intrinsicHeight = useMemo(() => {
    if (!dimensionSource?.height && dimensionSource?.width) {
      return Math.round(dimensionSource.width * 0.75)
    }
    return dimensionSource?.height
  }, [dimensionSource])

  const resolvedLoading = loading ?? (fetchPriority === 'high' ? 'eager' : 'lazy')

  const handleImageLoad = () => {
    if (blurDataUrl && containerRef.current) {
      containerRef.current.style.filter = 'none'
    }
  }

  const baseContainerStyle = blurDataUrl ? {
    backgroundImage: `url(${blurDataUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(5px)',
    transition: 'filter 0.3s ease'
  } : undefined

  const containerStyle = !disableAspectRatio && intrinsicWidth && intrinsicHeight
    ? {
        ...baseContainerStyle,
        aspectRatio: `${intrinsicWidth} / ${intrinsicHeight}`
      }
    : baseContainerStyle

  const imageStyle = {
    opacity: blurDataUrl ? 0.8 : 1,
    transition: 'opacity 0.3s ease'
  }

  const sizeClass = disableAspectRatio ? 'w-full h-auto' : 'w-full h-full'
  const objectFitClass =
    objectFit === 'contain' ? 'object-contain'
      : objectFit === 'fill' ? 'object-fill'
        : objectFit === 'none' ? 'object-none'
          : objectFit === 'scale-down' ? 'object-scale-down'
            : 'object-cover'

  const combinedImageClassName = `${sizeClass} ${objectFitClass} block ${imageClassName ?? ''}`.trim()

  // If we have image sizes with WebP support, use <picture> element
  if (imageSizes) {
    const webpSrcSet = generateWebPSrcSet(imageSizes)
    const jpegSrcSet = generateSrcSet(imageSizes)
    const sizes = generateSizes(context)

    return (
      <div
        ref={containerRef}
        className={className}
        onClick={onClick}
        style={containerStyle}
      >
  <picture className={sizeClass}>
          {/* WebP source if available */}
          {webpSrcSet && (
            <source
              srcSet={webpSrcSet}
              sizes={sizes}
              type="image/webp"
            />
          )}

          {/* JPEG fallback */}
          <img
            src={src}
            srcSet={jpegSrcSet}
            sizes={sizes}
            alt={alt}
            loading={resolvedLoading}
            fetchPriority={fetchPriority}
            decoding={decoding}
            onError={onError}
            onLoad={handleImageLoad}
            className={combinedImageClassName}
            style={imageStyle}
            width={intrinsicWidth}
            height={intrinsicHeight}
          />
        </picture>
      </div>
    )
  }

  // Fallback for simple images without size variants
  return (
    <div
      ref={containerRef}
      className={className}
      onClick={onClick}
      style={containerStyle}
    >
      <img
        src={src}
        alt={alt}
        loading={resolvedLoading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        onError={onError}
        onLoad={handleImageLoad}
        className={combinedImageClassName}
        style={imageStyle}
        width={intrinsicWidth}
        height={intrinsicHeight}
      />
    </div>
  )
}