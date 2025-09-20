import { Link as RouterLink, useLocation } from 'react-router-dom'
import { SunIcon, MoonIcon, PlusIcon, HomeIcon, UserIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'

interface NavigationProps {
  onAuthModalOpen: (mode: 'login' | 'register') => void
}

function Navigation({ onAuthModalOpen }: NavigationProps) {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const { user } = useAuth()

  const navItems = user
    ? []
    : [
        { name: 'Public Recipes', path: '/' },
      ]

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <RouterLink
            to="/"
            className="font-bold text-xl tracking-tight text-gray-900 dark:text-white transition-colors duration-200"
          >
            Recipes
          </RouterLink>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navigation items for non-logged-in users */}
            {navItems.map((item) => (
              <RouterLink
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-all duration-200 relative py-2 ${
                  location.pathname === item.path && !location.search
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.name}
                {location.pathname === item.path && !location.search && (
                  <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </RouterLink>
            ))}

            {/* Responsive buttons for logged-in users */}
            {user && (
              <>
                {/* Recipes Button */}
                <RouterLink
                  to="/"
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname === '/' && !location.search
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <HomeIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Recipes</span>
                </RouterLink>

                {/* Add Recipe Button */}
                <RouterLink
                  to="/add-recipe"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Recipe</span>
                </RouterLink>

              </>
            )}

            {/* Actions */}
            {user ? (
              <div className="flex items-center space-x-2 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
                {/* Settings Button */}
                <RouterLink
                  to="/settings"
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    location.pathname === '/settings'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.displayName}</span>
                </RouterLink>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => onAuthModalOpen('login')}
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onAuthModalOpen('register')}
                  className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200"
                >
                  Sign Up
                </button>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors duration-200"
              title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation