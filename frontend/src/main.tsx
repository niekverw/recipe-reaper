import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// PWA keyboard fix: Ensure inputs can be focused properly
if ('ontouchstart' in window) {
  document.addEventListener('touchstart', (e) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      target.focus()
    }
  }, { passive: true })
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find root element')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Temporarily disable service worker to test if it's causing reloads
  /*
  const registerServiceWorker = async () => {
    try {
      const { registerSW } = await import('virtual:pwa-register')
      registerSW({
        immediate: false,
        onNeedRefresh() {
          console.info('[PWA] New content is available; refresh the page when ready.')
        },
        onOfflineReady() {
          console.info('[PWA] App ready for offline use.')
        }
      })
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  }

  const scheduleRegistration = () => {
    const idleCallback = (window as typeof window & { requestIdleCallback?: (callback: IdleRequestCallback) => number }).requestIdleCallback

    if (typeof idleCallback === 'function') {
      idleCallback(() => {
        void registerServiceWorker()
      })
    } else {
      window.setTimeout(() => {
        void registerServiceWorker()
      }, 1500)
    }
  }

  window.addEventListener('load', scheduleRegistration, { once: true })
  */
}