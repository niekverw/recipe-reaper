import { useEffect, useState } from 'react'
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useOffline } from '../contexts/OfflineContext'

function OfflineIndicator() {
  const { isOnline, wasOffline } = useOffline()
  const [showBackOnline, setShowBackOnline] = useState(false)

  useEffect(() => {
    if (wasOffline && isOnline) {
      setShowBackOnline(true)
      const timer = setTimeout(() => setShowBackOnline(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [wasOffline, isOnline])

  if (isOnline && !showBackOnline) {
    return null
  }

  return (
    <div className={`fixed top-16 left-0 right-0 z-50 transition-all duration-300 ${
      !isOnline
        ? 'bg-red-600 text-white'
        : 'bg-green-600 text-white'
    }`}>
      <div className="flex items-center justify-center py-2 px-4 text-sm font-medium">
        {!isOnline ? (
          <>
            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
            You're offline. Showing cached content.
          </>
        ) : (
          <>
            <WifiIcon className="w-4 h-4 mr-2" />
            Back online! Syncing changes...
          </>
        )}
      </div>
    </div>
  )
}

export default OfflineIndicator