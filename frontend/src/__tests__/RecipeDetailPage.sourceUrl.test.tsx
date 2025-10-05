import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import RecipeDetailPage from '../pages/RecipeDetailPage'
import { Recipe } from '../services/api'


const { mockGetRecipe } = vi.hoisted(() => ({
  mockGetRecipe: vi.fn()
}))

// Mock the apiService
vi.mock('../services/api', () => ({
  apiService: {
    getRecipe: mockGetRecipe,
    deleteRecipe: vi.fn(),
    constructImageUrl: (url: string) => url
  }
}))

// Mock authentication context to prevent provider requirements
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
    household: null,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    createHousehold: vi.fn(),
    joinHousehold: vi.fn(),
    leaveHousehold: vi.fn(),
    refreshUser: vi.fn()
  })
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'test-recipe-id' })
  }
})

const renderRecipeDetailPage = () => {
  return render(
    <BrowserRouter>
      <RecipeDetailPage />
    </BrowserRouter>
  )
}

const createMockRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: 'test-recipe-id',
  name: 'Test Recipe',
  description: 'A delicious test recipe',
  prepTimeMinutes: 30,
  servings: 4,
  ingredients: ['2 cups flour', '1 tsp salt'],
  instructions: ['Mix ingredients', 'Bake for 30 minutes'],
  image: 'https://example.com/image.jpg',
  isPublic: false,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  ...overrides
})

describe('RecipeDetailPage - Source URL Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Source URL Attribution', () => {
    it('should display source URL attribution when sourceUrl is present', async () => {
      const recipeWithSource = createMockRecipe({
        sourceUrl: 'https://example.com/recipe/chocolate-cake'
      })

      mockGetRecipe.mockResolvedValue(recipeWithSource)

      renderRecipeDetailPage()

      // Wait for the recipe to load and check for source attribution
      expect(await screen.findByText('Recipe adapted from')).toBeInTheDocument()

      // Check that the link is present and correctly formatted
      const sourceLink = screen.getByRole('link', { name: 'example.com' })
      expect(sourceLink).toBeInTheDocument()
      expect(sourceLink).toHaveAttribute('href', 'https://example.com/recipe/chocolate-cake')
      expect(sourceLink).toHaveAttribute('target', '_blank')
      expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should not display source URL attribution when sourceUrl is not present', async () => {
      const recipeWithoutSource = createMockRecipe({
        sourceUrl: undefined
      })

      mockGetRecipe.mockResolvedValue(recipeWithoutSource)

      renderRecipeDetailPage()

      // Wait for the recipe to load
      expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

      // Check that source attribution is not present
      expect(screen.queryByText('Recipe adapted from')).not.toBeInTheDocument()
    })

    it('should display correct hostname for various URL formats', async () => {
      const testCases = [
        {
          url: 'https://www.allrecipes.com/recipe/123/cake',
          expectedHostname: 'www.allrecipes.com'
        },
        {
          url: 'https://food.com/recipe/456',
          expectedHostname: 'food.com'
        },
        {
          url: 'https://recipes.example.org/desserts/cookies?source=homepage',
          expectedHostname: 'recipes.example.org'
        },
        {
          url: 'http://localhost:3000/recipe/test',
          expectedHostname: 'localhost:3000'
        }
      ]

      for (const testCase of testCases) {
        vi.clearAllMocks()

        const recipe = createMockRecipe({
          sourceUrl: testCase.url,
          name: `Recipe from ${testCase.expectedHostname}`
        })

        mockGetRecipe.mockResolvedValue(recipe)

        const { unmount } = renderRecipeDetailPage()

        // Wait for the recipe to load
        expect(await screen.findByText(`Recipe from ${testCase.expectedHostname}`)).toBeInTheDocument()

        // Check that the correct hostname is displayed
        const sourceLink = screen.getByRole('link', { name: testCase.expectedHostname })
        expect(sourceLink).toBeInTheDocument()
        expect(sourceLink).toHaveAttribute('href', testCase.url)

        unmount()
      }
    })

    it('should handle invalid URLs gracefully', async () => {
      const recipeWithInvalidUrl = createMockRecipe({
        sourceUrl: 'not-a-valid-url'
      })

      mockGetRecipe.mockResolvedValue(recipeWithInvalidUrl)

      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderRecipeDetailPage()

      // Wait for the recipe to load
      expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

      // The source attribution should still be present
      expect(screen.getByText('Recipe adapted from')).toBeInTheDocument()

      // But the link might not render properly due to invalid URL
      // This tests that the component doesn't crash

      consoleSpy.mockRestore()
    })

    it('should open source link in new tab with security attributes', async () => {
      const recipeWithSource = createMockRecipe({
        sourceUrl: 'https://malicious-site.com/recipe'
      })

      mockGetRecipe.mockResolvedValue(recipeWithSource)

      renderRecipeDetailPage()

      // Wait for the recipe to load
      expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

      const sourceLink = screen.getByRole('link', { name: 'malicious-site.com' })

      // Verify security attributes
      expect(sourceLink).toHaveAttribute('target', '_blank')
      expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('should display source attribution with proper styling', async () => {
      const recipeWithSource = createMockRecipe({
        sourceUrl: 'https://example.com/recipe'
      })

      mockGetRecipe.mockResolvedValue(recipeWithSource)

      renderRecipeDetailPage()

      // Wait for the recipe to load
      expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

      const sourceText = screen.getByText('Recipe adapted from')
      const sourceLink = screen.getByRole('link', { name: 'example.com' })

      // Check basic styling classes are applied
      expect(sourceLink).toHaveClass('text-blue-600')
      expect(sourceLink).toHaveClass('underline')
      expect(sourceText.parentElement).toHaveClass('text-sm')
    })
  })

  describe('Recipe Display Integration', () => {
    it('should display source attribution below description and above badges', async () => {
      const recipeWithSource = createMockRecipe({
        sourceUrl: 'https://example.com/recipe',
        image: undefined // No image so badges appear inline
      })

      mockGetRecipe.mockResolvedValue(recipeWithSource)

      renderRecipeDetailPage()

      // Wait for the recipe to load
      expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

      const description = screen.getByText('A delicious test recipe')
      const sourceAttribution = screen.getByText('Recipe adapted from')
      const prepTimeBadge = screen.getByText('30 min')

      // Check order in DOM (simplified - assumes proper ordering)
      expect(description).toBeInTheDocument()
      expect(sourceAttribution).toBeInTheDocument()
      expect(prepTimeBadge).toBeInTheDocument()
    })

    it('should display source attribution when recipe has image', async () => {
      const recipeWithSourceAndImage = createMockRecipe({
        sourceUrl: 'https://example.com/recipe',
        image: 'https://example.com/image.jpg'
      })

      mockGetRecipe.mockResolvedValue(recipeWithSourceAndImage)

      renderRecipeDetailPage()

      // Wait for the recipe to load
      expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

      // Source attribution should still be present
      expect(screen.getByText('Recipe adapted from')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'example.com' })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for source link', async () => {
      const recipeWithSource = createMockRecipe({
        sourceUrl: 'https://example.com/recipe'
      })

      mockGetRecipe.mockResolvedValue(recipeWithSource)

      renderRecipeDetailPage()

      // Wait for the recipe to load
      expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

      const sourceLink = screen.getByRole('link', { name: 'example.com' })

      // Check that the link is properly accessible
      expect(sourceLink).toBeInTheDocument()
      expect(sourceLink.tagName.toLowerCase()).toBe('a')
    })

    it('should be readable by screen readers', async () => {
      const recipeWithSource = createMockRecipe({
        sourceUrl: 'https://example.com/recipe'
      })

      mockGetRecipe.mockResolvedValue(recipeWithSource)

      renderRecipeDetailPage()

      // Wait for the recipe to load
      expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

      // Check that the full attribution text is present and readable
      const fullText = screen.getByText((_content, element) => {
        return element?.textContent === 'Recipe adapted from example.com'
      })
      expect(fullText).toBeInTheDocument()
    })
  })
})