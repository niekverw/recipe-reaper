import { onCLS, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals'

// Declare gtag function for Google Analytics
declare global {
  function gtag(...args: any[]): void
}

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  rating?: 'good' | 'needs-improvement' | 'poor'
}

export interface PWAMetric {
  name: string
  value: any
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private pwaMetrics: PWAMetric[] = []
  private isInitialized = false
  private analyticsEnabled = false
  private installStartTime: number | null = null

  // Core Web Vitals thresholds
  private static readonly THRESHOLDS = {
    FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
    LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
    CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
    TTFB: { good: 800, poor: 1800 }  // Time to First Byte
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = PerformanceMonitor.THRESHOLDS[name as keyof typeof PerformanceMonitor.THRESHOLDS]
    if (!threshold) return 'good'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  private logMetric(metric: PerformanceMetric) {
    const rating = this.getRating(metric.name, metric.value)
    const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌'

    console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${rating})`)

    // Send to analytics if enabled
    if (this.analyticsEnabled) {
      this.sendToAnalytics('web_vitals', {
        name: metric.name,
        value: metric.value,
        rating: rating,
        timestamp: metric.timestamp
      })
    }

    // Store in localStorage for debugging
    this.storeMetric(metric)
  }

  private storeMetric(metric: PerformanceMetric) {
    try {
      const stored = localStorage.getItem('pwa-performance-metrics')
      const metrics = stored ? JSON.parse(stored) : []
      metrics.push(metric)

      // Keep only last 50 metrics to avoid storage bloat
      if (metrics.length > 50) {
        metrics.splice(0, metrics.length - 50)
      }

      localStorage.setItem('pwa-performance-metrics', JSON.stringify(metrics))
    } catch (error) {
      console.warn('Failed to store performance metric:', error)
    }
  }

  private sendToAnalytics(eventName: string, data: any) {
    // Google Analytics 4 integration
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        custom_map: { metric_value: data.value },
        ...data
      })
    }

    // Custom analytics endpoint (if configured)
    const analyticsUrl = import.meta.env.VITE_ANALYTICS_ENDPOINT
    if (analyticsUrl) {
      fetch(analyticsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, data, timestamp: Date.now() })
      }).catch(error => console.warn('Failed to send analytics:', error))
    }
  }

  private logPWAMetric(metric: PWAMetric) {
    console.log(`🔧 PWA ${metric.name}:`, metric.value)

    // Send to analytics if enabled
    if (this.analyticsEnabled) {
      this.sendToAnalytics('pwa_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        timestamp: metric.timestamp
      })
    }

    // Store PWA metrics separately
    try {
      const stored = localStorage.getItem('pwa-metrics')
      const metrics = stored ? JSON.parse(stored) : []
      metrics.push(metric)

      if (metrics.length > 20) {
        metrics.splice(0, metrics.length - 20)
      }

      localStorage.setItem('pwa-metrics', JSON.stringify(metrics))
    } catch (error) {
      console.warn('Failed to store PWA metric:', error)
    }
  }

  public initialize(): void {
    if (this.isInitialized) return
    this.isInitialized = true

    console.log('🚀 Initializing PWA Performance Monitoring...')

    // Check if analytics is enabled
    this.analyticsEnabled = import.meta.env.VITE_GA_MEASUREMENT_ID ||
                           import.meta.env.VITE_ANALYTICS_ENDPOINT ? true : false

    if (this.analyticsEnabled) {
      console.log('📊 Analytics integration enabled')
    }

    // Track install start time
    this.installStartTime = Date.now()

    // Track Core Web Vitals
    onCLS((metric: Metric) => {
      const performanceMetric: PerformanceMetric = {
        name: 'CLS',
        value: metric.value,
        timestamp: Date.now(),
        rating: this.getRating('CLS', metric.value)
      }
      this.metrics.push(performanceMetric)
      this.logMetric(performanceMetric)
    })

    onFCP((metric: Metric) => {
      const performanceMetric: PerformanceMetric = {
        name: 'FCP',
        value: metric.value,
        timestamp: Date.now(),
        rating: this.getRating('FCP', metric.value)
      }
      this.metrics.push(performanceMetric)
      this.logMetric(performanceMetric)
    })

    onLCP((metric: Metric) => {
      const performanceMetric: PerformanceMetric = {
        name: 'LCP',
        value: metric.value,
        timestamp: Date.now(),
        rating: this.getRating('LCP', metric.value)
      }
      this.metrics.push(performanceMetric)
      this.logMetric(performanceMetric)
    })

    onTTFB((metric: Metric) => {
      const performanceMetric: PerformanceMetric = {
        name: 'TTFB',
        value: metric.value,
        timestamp: Date.now(),
        rating: this.getRating('TTFB', metric.value)
      }
      this.metrics.push(performanceMetric)
      this.logMetric(performanceMetric)
    })

    // Track PWA-specific metrics
    this.trackPWAMetrics()

    // Track page load time
    if (window.performance.timing) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      const performanceMetric: PerformanceMetric = {
        name: 'PageLoad',
        value: loadTime,
        timestamp: Date.now(),
        rating: loadTime < 2000 ? 'good' : loadTime < 4000 ? 'needs-improvement' : 'poor'
      }
      this.metrics.push(performanceMetric)
      this.logMetric(performanceMetric)
    }

    console.log('✅ PWA Performance Monitoring initialized')

    // Automatically log summary after a short delay to catch all metrics
    setTimeout(() => {
      this.logSummary()
    }, 3000)
  }

  private trackPWAMetrics() {
    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone === true

    this.logPWAMetric({
      name: 'DisplayMode',
      value: isPWA ? 'standalone' : 'browser',
      timestamp: Date.now()
    })

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        const hasSW = registrations.length > 0
        this.logPWAMetric({
          name: 'ServiceWorker',
          value: hasSW ? 'registered' : 'not-registered',
          timestamp: Date.now()
        })

        if (hasSW) {
          // Check cache status
          this.checkCacheStatus()
        }
      })
    }

    // Track install prompt events
    window.addEventListener('beforeinstallprompt', () => {
      this.logPWAMetric({
        name: 'InstallPrompt',
        value: 'available',
        timestamp: Date.now()
      })
    })

    window.addEventListener('appinstalled', () => {
      const installTime = this.installStartTime ? Date.now() - this.installStartTime : null
      this.logPWAMetric({
        name: 'InstallEvent',
        value: 'installed',
        timestamp: Date.now()
      })

      if (installTime) {
        this.logPWAMetric({
          name: 'InstallTime',
          value: installTime,
          timestamp: Date.now()
        })
      }
    })

    // Track online/offline status
    this.logPWAMetric({
      name: 'NetworkStatus',
      value: navigator.onLine ? 'online' : 'offline',
      timestamp: Date.now()
    })

    window.addEventListener('online', () => {
      this.logPWAMetric({
        name: 'NetworkStatus',
        value: 'online',
        timestamp: Date.now()
      })
    })

    window.addEventListener('offline', () => {
      this.logPWAMetric({
        name: 'NetworkStatus',
        value: 'offline',
        timestamp: Date.now()
      })
    })
  }

  private async checkCacheStatus() {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        this.logPWAMetric({
          name: 'CacheCount',
          value: cacheNames.length,
          timestamp: Date.now()
        })

        // Check cache sizes (approximate)
        let totalSize = 0
        let cacheHitRate = 0

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const keys = await cache.keys()
          totalSize += keys.length

          // Check cache hit rate by testing a few requests
          if (keys.length > 0) {
            const testRequests = keys.slice(0, Math.min(5, keys.length))
            let hits = 0

            for (const request of testRequests) {
              try {
                const response = await cache.match(request)
                if (response) hits++
              } catch (e) {
                // Ignore errors
              }
            }

            cacheHitRate = Math.max(cacheHitRate, hits / testRequests.length)
          }
        }

        this.logPWAMetric({
          name: 'CacheEntries',
          value: totalSize,
          timestamp: Date.now()
        })

        if (cacheHitRate > 0) {
          this.logPWAMetric({
            name: 'CacheHitRate',
            value: Math.round(cacheHitRate * 100),
            timestamp: Date.now()
          })
        }
      }
    } catch (error) {
      console.warn('Failed to check cache status:', error)
    }
  }

  public trackUserInteraction(interactionType: string, details?: any) {
    const metric: PWAMetric = {
      name: 'UserInteraction',
      value: { type: interactionType, details },
      timestamp: Date.now()
    }
    this.pwaMetrics.push(metric)
    this.logPWAMetric(metric)
  }

  public trackPageView(page: string) {
    const metric: PWAMetric = {
      name: 'PageView',
      value: page,
      timestamp: Date.now()
    }
    this.pwaMetrics.push(metric)
    this.logPWAMetric(metric)
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  public getPWAMetrics(): PWAMetric[] {
    return [...this.pwaMetrics]
  }

  public clearStoredMetrics() {
    localStorage.removeItem('pwa-performance-metrics')
    localStorage.removeItem('pwa-metrics')
    console.log('🗑️ Cleared stored performance metrics')
  }

  // Debug method to show current metrics
  public debug() {
    console.group('🚀 PWA Performance Debug')
    console.log('Core Web Vitals:', this.metrics)
    console.log('PWA Metrics:', this.pwaMetrics)

    // Show stored metrics
    try {
      const storedPerformance = localStorage.getItem('pwa-performance-metrics')
      const storedPWA = localStorage.getItem('pwa-metrics')

      if (storedPerformance) {
        console.log('Stored Performance Metrics:', JSON.parse(storedPerformance))
      }
      if (storedPWA) {
        console.log('Stored PWA Metrics:', JSON.parse(storedPWA))
      }
    } catch (error) {
      console.warn('Failed to read stored metrics:', error)
    }

    console.groupEnd()
  }

  // Log a summary of current metrics
  private logSummary() {
    console.group('📊 PWA Performance Summary')
    console.log('Core Web Vitals:')
    this.metrics.forEach(metric => {
      const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌'
      console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`)
    })

    console.log('PWA Status:')
    this.pwaMetrics.forEach(metric => {
      console.log(`🔧 ${metric.name}: ${metric.value}`)
    })

    console.log('💡 Use debugPerformance() for full details, clearPerformanceMetrics() to reset')
    console.groupEnd()
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()