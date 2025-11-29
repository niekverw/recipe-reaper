import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { OfflineProvider } from './contexts/OfflineContext'
import Navigation from './components/Navigation'
import OfflineIndicator from './components/OfflineIndicator'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import GoogleAnalytics from './components/GoogleAnalytics'
import PageTracker from './components/PageTracker'
import PerformanceDashboard from './components/PerformanceDashboard'
import LoadingScreen from './components/LoadingScreen'
import ScrollToTop from './components/ScrollToTop'
// Critical routes - loaded eagerly
import RecipesPage from './pages/RecipesPage'
import LoginPage from './pages/LoginPage'

// Non-critical routes - lazy loaded for performance
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage'))
const RecipeFormPage = lazy(() => import('./pages/RecipeFormPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const ShareTargetPage = lazy(() => import('./pages/ShareTargetPage'))
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

function App() {
  useEffect(() => {
    // Defer heavy utilities until after initial render using idle callback
    const scheduleUtilityLoading = () => {
      const idleCallback = (window as typeof window & { requestIdleCallback?: (callback: IdleRequestCallback) => number }).requestIdleCallback

      const loadUtilities = () => {
        // Check if performance monitoring is enabled (default: true)
        const enablePerformanceMonitoring = import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING !== 'false'

        if (enablePerformanceMonitoring) {
          // Load performance monitoring after idle
          import('./utils/performanceMonitor').then(({ performanceMonitor }) => {
            performanceMonitor.initialize()
            // Add debug commands to console
            ;(window as any).debugPerformance = () => performanceMonitor.debug()
            ;(window as any).clearPerformanceMetrics = () => performanceMonitor.clearStoredMetrics()
            console.log('✅ Performance monitoring enabled (loaded after idle). Use debugPerformance() in console.')
            console.log('💡 Tip: Use debugPerformance() in console to see metrics, clearPerformanceMetrics() to reset')
          }).catch((error) => {
            console.error('Failed to initialize performance monitoring:', error)
          })
        }
      }

      if (typeof idleCallback === 'function') {
        idleCallback(loadUtilities)
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(loadUtilities, 2000)
      }
    }

    // Schedule utility loading after component mount
    scheduleUtilityLoading()
  }, [])

  return (
    <ThemeProvider>
      <OfflineProvider>
        <AuthProvider>
          <GoogleAnalytics />
          <Router>
            <ScrollToTop />
            <PageTracker />
            <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
              <OfflineIndicator />
              <Navigation />
              {/* Offset content for fixed mobile header */}
              <main className="pt-16 sm:pt-0">
                <Suspense fallback={<LoadingScreen message="Loading page..." />}>
                  <Routes>
                    <Route path="/" element={<RecipesPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/share-target" element={<ShareTargetPage />} />
                    <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                    <Route path="/add-recipe" element={<RecipeFormPage />} />
                    <Route path="/recipe/:id/edit" element={<RecipeFormPage />} />
                    <Route path="/shopping-list" element={<ShoppingListPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/about" element={<AboutPage />} />
                  </Routes>
                </Suspense>
              </main>
              <PWAInstallPrompt />
            </div>
            {import.meta.env.DEV && <PerformanceDashboard />}
          </Router>
        </AuthProvider>
      </OfflineProvider>
    </ThemeProvider>
  )
}

export default App