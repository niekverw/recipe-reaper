import { Link as RouterLink, useLocation } from 'react-router-dom'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../contexts/ThemeContext'

function Navigation() {
  const location = useLocation()
  const { isDark, toggleTheme } = useTheme()

  const navItems = [
    { name: 'Recipes', path: '/' },
    { name: 'Add Recipe', path: '/add-recipe' }
  ]

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <RouterLink
            to="/"
            className="font-bold text-xl tracking-tight text-gray-900 dark:text-white transition-colors duration-200"
          >
            RecipeBox
          </RouterLink>

          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <RouterLink
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-all duration-200 relative py-2 ${
                  location.pathname === item.path
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {item.name}
                {location.pathname === item.path && (
                  <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </RouterLink>
            ))}

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