import { useEffect } from 'react'

// Declare gtag function for Google Analytics
declare global {
  function gtag(...args: any[]): void
}

interface GoogleAnalyticsProps {
  measurementId?: string
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    const gaId = measurementId || import.meta.env.VITE_GA_MEASUREMENT_ID

    if (!gaId) {
      console.log('Google Analytics not configured (VITE_GA_MEASUREMENT_ID not set)')
      return
    }

    // Load Google Analytics script
    const script1 = document.createElement('script')
    script1.async = true
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script1)

    // Initialize gtag
    const script2 = document.createElement('script')
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', {
        send_page_view: false // We'll handle page views manually
      });
    `
    document.head.appendChild(script2)

    console.log('📊 Google Analytics initialized with ID:', gaId)

    // Cleanup function
    return () => {
      // Remove scripts if component unmounts
      const scripts = document.querySelectorAll(`script[src*="googletagmanager"]`)
      scripts.forEach(script => script.remove())
    }
  }, [measurementId])

  return null // This component doesn't render anything
}