import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navigation from './components/Navigation'
import AuthModal from './components/auth/AuthModal'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipeFormPage from './pages/RecipeFormPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

function App() {
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  })

  const handleAuthModalOpen = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode })
  }

  const handleAuthModalClose = () => {
    setAuthModal({ ...authModal, isOpen: false })
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
            <Navigation onAuthModalOpen={handleAuthModalOpen} />
            <main>
              <Routes>
                <Route path="/" element={<RecipesPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />
                <Route path="/recipe/:id" element={<RecipeDetailPage />} />
                <Route path="/add-recipe" element={<RecipeFormPage />} />
                <Route path="/recipe/:id/edit" element={<RecipeFormPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
            <AuthModal
              isOpen={authModal.isOpen}
              onClose={handleAuthModalClose}
              initialMode={authModal.mode}
            />
            <PWAInstallPrompt />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App