import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useOptionalOffline } from '../contexts/OfflineContext'

function OfflineIndicator() {
  const offlineContext = useOptionalOffline()

  if (!offlineContext) {
    return null
  }

  const { isOnline } = offlineContext

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 bg-red-600/70 text-white transition-all duration-300">
      <div className="flex items-center justify-center py-2 px-4 text-sm font-medium">
        <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
        You're offline.
      </div>
    </div>
  )
}

export default OfflineIndicator