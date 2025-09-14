import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

function Navigation() {
  const location = useLocation()
  const { currentTheme, setTheme } = useTheme()

  const navItems = [
    { name: 'Recipes', path: '/' },
    { name: 'Add Recipe', path: '/add-recipe' }
  ]

  const toggleTheme = () => {
    setTheme(currentTheme.id === 'light' ? 'dark' : 'light')
  }

  return (
    <nav
      className="border-b sticky top-0 z-50 backdrop-blur-sm transition-all duration-200"
      style={{
        borderColor: 'var(--color-border-primary)',
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-small)'
      }}
    >
      <div className="max-w-7xl mx-auto px-3">
        <div className="flex justify-between items-center h-14">
          <RouterLink
            to="/"
            className="font-medium text-xl tracking-tight transition-colors duration-200"
            style={{
              color: 'var(--color-text-primary)'
            }}
          >
            RecipeBox
          </RouterLink>

          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <RouterLink
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-all duration-200 relative py-2 ${
                  location.pathname === item.path
                    ? 'opacity-100'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  color: location.pathname === item.path
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-secondary)'
                }}
              >
                {item.name}
                {location.pathname === item.path && (
                  <div
                    className="absolute -bottom-0.5 left-0 right-0 h-px"
                    style={{ backgroundColor: 'var(--color-text-primary)' }}
                  />
                )}
              </RouterLink>
            ))}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-md transition-all duration-200 hover:opacity-70"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)'
              }}
              title={`Switch to ${currentTheme.id === 'light' ? 'dark' : 'light'} theme`}
            >
              {currentTheme.id === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation