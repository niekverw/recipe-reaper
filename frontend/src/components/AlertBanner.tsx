import { ReactNode } from 'react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export type AlertVariant = 'error' | 'warning' | 'success' | 'info'

interface AlertBannerProps {
  variant?: AlertVariant
  title?: string
  description?: ReactNode
  onDismiss?: () => void
  dismissLabel?: string
  actions?: ReactNode
  className?: string
  isCompact?: boolean
}

const variantStyles: Record<AlertVariant, { container: string; iconColor: string; textColor: string }> = {
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-700 dark:text-red-200'
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-700 dark:text-amber-100'
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-700 dark:text-green-200'
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-700 dark:text-blue-200'
  }
}

const variantIcons: Record<AlertVariant, typeof ExclamationTriangleIcon | typeof CheckCircleIcon | typeof InformationCircleIcon> = {
  error: ExclamationTriangleIcon,
  warning: ExclamationTriangleIcon,
  success: CheckCircleIcon,
  info: InformationCircleIcon
}

export function AlertBanner({
  variant = 'info',
  title,
  description,
  onDismiss,
  dismissLabel = 'Dismiss alert',
  actions,
  className = '',
  isCompact = false
}: AlertBannerProps) {
  const variantStyle = variantStyles[variant]
  const Icon = variantIcons[variant]
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status'
  const ariaLive = variant === 'error' || variant === 'warning' ? 'assertive' : 'polite'

  return (
    <div
      className={`${variantStyle.container} rounded-lg ${isCompact ? 'px-3 py-2.5' : 'px-3 py-3'} ${className}`.trim()}
      role={role}
      aria-live={ariaLive}
    >
      <div className={`flex items-start ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
        <Icon className={`flex-shrink-0 ${isCompact ? 'w-4 h-4 mt-0.5' : 'w-5 h-5 mt-0.5'} ${variantStyle.iconColor}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`font-semibold ${isCompact ? 'text-sm' : 'text-base'} ${variantStyle.textColor}`}>
              {title}
            </p>
          )}
          {description && (
            <div className={`${variantStyle.textColor} ${isCompact ? 'text-xs mt-1' : 'text-base mt-1'} leading-relaxed first:mt-0`}>{description}</div>
          )}
          {actions && (
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              {actions}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`${variantStyle.iconColor} hover:opacity-80 transition-opacity`}
          >
            <span className="sr-only">{dismissLabel}</span>
            <XMarkIcon className={isCompact ? 'w-4 h-4' : 'w-5 h-5'} />
          </button>
        )}
      </div>
    </div>
  )
}

export default AlertBanner
