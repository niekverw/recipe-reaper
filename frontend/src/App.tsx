import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Navigation from './components/Navigation'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipeFormPage from './pages/RecipeFormPage'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<RecipesPage />} />
              <Route path="/recipe/:id" element={<RecipeDetailPage />} />
              <Route path="/add-recipe" element={<RecipeFormPage />} />
              <Route path="/recipe/:id/edit" element={<RecipeFormPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App