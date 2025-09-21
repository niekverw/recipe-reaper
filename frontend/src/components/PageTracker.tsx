import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    // Track page view in performance monitor
    import('../utils/performanceMonitor').then(({ performanceMonitor }) => {
      performanceMonitor.trackPageView(location.pathname)
    }).catch(error => {
      console.warn('Failed to track page view:', error)
    })

    // Send page view to Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_path: location.pathname,
        page_location: window.location.href
      })
    }
  }, [location])

  return null
}