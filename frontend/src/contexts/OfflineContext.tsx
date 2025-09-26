import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface OfflineContextType {
  isOnline: boolean
  wasOffline: boolean
  connectionType?: string
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

interface OfflineProviderProps {
  children: ReactNode
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)
  const [connectionType, setConnectionType] = useState<string>()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      // Clear wasOffline flag after a delay to allow components to show "back online" message
      setTimeout(() => setWasOffline(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(false)
    }

    // Update connection type if available
    const updateConnectionType = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      if (connection) {
        setConnectionType(connection.effectiveType || connection.type)
      }
    }

    // Set initial connection type
    updateConnectionType()

    // Listen for connection changes
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      connection.addEventListener('change', updateConnectionType)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (connection) {
        connection.removeEventListener('change', updateConnectionType)
      }
    }
  }, [])

  return (
    <OfflineContext.Provider value={{ isOnline, wasOffline, connectionType }}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}