import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navigation from './components/Navigation'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import GoogleAnalytics from './components/GoogleAnalytics'
import PageTracker from './components/PageTracker'
import PerformanceDashboard from './components/PerformanceDashboard'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipeFormPage from './pages/RecipeFormPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import ShareTargetPage from './pages/ShareTargetPage'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Check if performance monitoring is enabled (default: true)
    const enablePerformanceMonitoring = import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING !== 'false'

    if (enablePerformanceMonitoring) {
      // Initialize performance monitoring
      import('./utils/performanceMonitor').then(({ performanceMonitor }) => {
        performanceMonitor.initialize()
        // Add debug commands to console
        ;(window as any).debugPerformance = () => performanceMonitor.debug()
        ;(window as any).clearPerformanceMetrics = () => performanceMonitor.clearStoredMetrics()
        console.log('✅ Performance monitoring enabled. Use debugPerformance() in console.')
      }).catch((error) => {
        console.error('Failed to initialize performance monitoring:', error)
      })
    } else {
      console.log('ℹ️ Performance monitoring disabled via VITE_ENABLE_PERFORMANCE_MONITORING=false')
    }

    console.log('💡 Tip: Use debugPerformance() in console to see metrics, clearPerformanceMetrics() to reset')
  }, [])

  return (
    <ThemeProvider>
      <AuthProvider>
        <GoogleAnalytics />
        <Router>
          <PageTracker />
          <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Navigation />
            <main>
              <Routes>
                <Route path="/" element={<RecipesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/share-target" element={<ShareTargetPage />} />
                <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                <Route path="/add-recipe" element={<RecipeFormPage />} />
                <Route path="/recipe/:id/edit" element={<RecipeFormPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
            <PWAInstallPrompt />
          </div>
          {import.meta.env.DEV && <PerformanceDashboard />}
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App