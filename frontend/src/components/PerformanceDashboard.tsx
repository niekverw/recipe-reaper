import { useState, useEffect } from 'react'
import { performanceMonitor } from '../utils/performanceMonitor'

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [pwaMetrics, setPWAMetrics] = useState<any[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) {
      loadMetrics()
    }
  }, [isVisible])

  const loadMetrics = () => {
    setMetrics(performanceMonitor.getMetrics())
    setPWAMetrics(performanceMonitor.getPWAMetrics())
  }

  const clearMetrics = () => {
    performanceMonitor.clearStoredMetrics()
    loadMetrics()
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm shadow-lg"
        >
          📊 Performance
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🚀 PWA Performance Dashboard
            </h2>
            <div className="flex gap-2">
              <button
                onClick={loadMetrics}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
              >
                Refresh
              </button>
              <button
                onClick={clearMetrics}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Web Vitals */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Core Web Vitals
              </h3>
              <div className="space-y-2">
                {metrics.map((metric, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{metric.name}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        metric.rating === 'good' ? 'bg-green-100 text-green-800' :
                        metric.rating === 'needs-improvement' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {metric.rating}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {metric.value.toFixed(2)}ms • {new Date(metric.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PWA Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                PWA Metrics
              </h3>
              <div className="space-y-2">
                {pwaMetrics.map((metric, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{metric.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {typeof metric.value === 'object' ? JSON.stringify(metric.value) : metric.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Debug Commands
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div>• <code>debugPerformance()</code> - Full debug info in console</div>
              <div>• <code>clearPerformanceMetrics()</code> - Clear stored metrics</div>
              <div>• Use browser DevTools → Network tab to monitor cache hits</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}