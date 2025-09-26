import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useOffline } from '../contexts/OfflineContext'

function OfflineIndicator() {
  const { isOnline } = useOffline()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 bg-red-600/70 text-white transition-all duration-300">
      <div className="flex items-center justify-center py-2 px-4 text-sm font-medium">
        <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
        You're offline. Showing cached content.
      </div>
    </div>
  )
}

export default OfflineIndicator