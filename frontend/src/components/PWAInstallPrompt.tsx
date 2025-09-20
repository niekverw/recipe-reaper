import { useState, useEffect } from 'react'
import { XMarkIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showManualPrompt, setShowManualPrompt] = useState(false)
  const [browserInfo, setBrowserInfo] = useState<{
    isIOS: boolean
    isSafari: boolean
    isChrome: boolean
    isFirefox: boolean
  }>({ isIOS: false, isSafari: false, isChrome: false, isFirefox: false })

  useEffect(() => {
    // Detect platform and browser
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    const isMobile = isIOS || isAndroid || window.innerWidth <= 768
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Firefox/.test(navigator.userAgent)
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent)
    const isFirefox = /Firefox/.test(navigator.userAgent)

    setBrowserInfo({ isIOS, isSafari, isChrome, isFirefox })

    // Improved standalone detection for iOS and other platforms
    const checkIfInstalled = () => {
      // iOS Safari standalone detection
      const isIOSStandalone = isIOS && (window.navigator as any).standalone === true

      // General standalone detection (works for most modern browsers)
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches

      // Check if PWA was previously installed (stored in localStorage)
      const wasPreviouslyInstalled = localStorage.getItem('pwa-installed') === 'true'

      // Check if installation was attempted recently (within last 20 days)
      const installAttempted = localStorage.getItem('pwa-install-attempted')
      const wasRecentlyAttempted = installAttempted && (Date.now() - parseInt(installAttempted)) < (20 * 24 * 60 * 60 * 1000)

      return isIOSStandalone || isInStandaloneMode || wasPreviouslyInstalled || wasRecentlyAttempted
    }

    // Initial check
    const initialInstalled = checkIfInstalled()

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event so it can be triggered later
      setDeferredPrompt(e)
      // Show our custom prompt
      setShowPrompt(true)
    }

    const handleAppInstalled = () => {
      // Hide the prompt when app is installed
      setShowPrompt(false)
      setShowManualPrompt(false)
      setDeferredPrompt(null)
      // Remember that the PWA was installed
      localStorage.setItem('pwa-installed', 'true')
    }

    // Periodic check for installation status (useful if user installs while using the app)
    const checkInstallationStatus = () => {
      const currentlyInstalled = checkIfInstalled()
      if (currentlyInstalled) {
        setShowPrompt(false)
        setShowManualPrompt(false)
        setDeferredPrompt(null)
        // If we're now in standalone mode, remember it for future visits
        const isIOSStandaloneNow = isIOS && (window.navigator as any).standalone === true
        const isInStandaloneModeNow = window.matchMedia('(display-mode: standalone)').matches
        if (isIOSStandaloneNow || isInStandaloneModeNow) {
          localStorage.setItem('pwa-installed', 'true')
          // Clear the attempt flag since we confirmed installation
          localStorage.removeItem('pwa-install-attempted')
        }
      }
    }

    // Check every 1 second for the first 10 seconds (more aggressive for iOS)
    const intervalId = setInterval(() => {
      checkInstallationStatus()
    }, 1000)

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId)
      // Continue checking less frequently
      setInterval(checkInstallationStatus, 5000)
    }, 10000)

    if (!initialInstalled && isMobile) {
      // Check if browser supports beforeinstallprompt (mainly Chrome/Edge on desktop/Android)
      const supportsInstallPrompt = isChrome && !isIOS

      if (supportsInstallPrompt) {
        // For browsers with beforeinstallprompt support
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
        window.addEventListener('appinstalled', handleAppInstalled)
      } else {
                // For browsers that need manual installation (iOS, Firefox, etc.)
        const timer = setTimeout(() => {
          const wasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true'
          const installAttempted = localStorage.getItem('pwa-install-attempted')
          const wasRecentlyAttempted = installAttempted && (Date.now() - parseInt(installAttempted)) < (20 * 24 * 60 * 60 * 1000)

          if (!wasDismissed && !checkIfInstalled() && !wasRecentlyAttempted) {
            setShowManualPrompt(true)
          }
        }, 3000) // Show after 3 seconds

        return () => {
          clearTimeout(timer)
          clearInterval(intervalId)
          clearTimeout(timeoutId)
        }
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const choice = await deferredPrompt.userChoice

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowPrompt(false)

    // If user accepted the install, mark it as potentially installed
    // This helps with browsers that don't fire the appinstalled event
    if (choice.outcome === 'accepted') {
      localStorage.setItem('pwa-install-attempted', Date.now().toString())
    }
  }

  const handleDismiss = (temporary = false) => {
    setShowPrompt(false)
    setShowManualPrompt(false)

    if (temporary) {
      // Temporarily dismiss for 20 days, assuming user is following manual instructions
      const expiry = new Date().getTime() + (20 * 24 * 60 * 60 * 1000)
      localStorage.setItem('pwa-install-dismissed-temporarily', expiry.toString())
    } else {
      // Permanently dismiss
      localStorage.setItem('pwa-install-dismissed', 'true')
    }
  }

  const getInstallInstructions = () => {
    const { isIOS, isChrome, isFirefox } = browserInfo

    if (isIOS) {
      return {
        title: "To Install App",
        steps: [
          "Tap the Share button",
          "Select \"Add to Home Screen\"",
          "Tap \"Add\" to confirm"
        ]
      }
    } else {
      if (isChrome) {
        return {
          title: "To Install App",
          steps: [
            "Tap the menu (⋮) in the top right",
            "Select \"Add to Home screen\"",
            "Tap \"Add\" to confirm"
          ]
        }
      } else if (isFirefox) {
        return {
          title: "To Install App",
          steps: [
            "Tap the menu (⋮) in the top right",
            "Select \"Install\"",
            "Tap \"Add\" to confirm"
          ]
        }
      } else {
        return {
          title: "To Install App",
          steps: [
            "Look for an \"Install\" option in your browser menu",
            ""
          ]
        }
      }
    }
  }

  // Don't show if user has dismissed before
  const wasDismissed = localStorage.getItem('pwa-install-dismissed') === 'true'
  const temporaryDismissal = localStorage.getItem('pwa-install-dismissed-temporarily')
  const isTemporarilyDismissed = temporaryDismissal && Date.now() < parseInt(temporaryDismissal)

  return (
    <>
      {/* Install prompt for browsers with beforeinstallprompt */}
      {showPrompt && deferredPrompt && !wasDismissed && !isTemporarilyDismissed && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Add to Home Screen
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Install Recipe Reaper for quick access to your recipes
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    Install
                  </button>
                  <button
                    onClick={() => handleDismiss(true)}
                    className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Not now
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(false)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Install Instructions */}
      {showManualPrompt && !wasDismissed && !isTemporarilyDismissed && (() => {
        const instructions = getInstallInstructions()
        return (
          <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {instructions.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    To install Recipe Reaper:
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 space-y-1">
                    {instructions.steps.map((step, index) => (
                      <div key={index}>{index + 1}. {step}</div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleDismiss(true)}
                    className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Got it
                  </button>
                </div>
                <button
                  onClick={() => handleDismiss(false)}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

export default PWAInstallPrompt