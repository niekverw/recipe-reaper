import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import RecipeDetailPage from '../pages/RecipeDetailPage'
import { Recipe } from '../services/api'

const { mockGetRecipe } = vi.hoisted(() => ({
  mockGetRecipe: vi.fn()
}))

vi.mock('../services/api', () => ({
  apiService: {
    getRecipe: mockGetRecipe,
    deleteRecipe: vi.fn(),
    constructImageUrl: (url: string) => url,
    getAllTags: vi.fn().mockResolvedValue([])
  }
}))

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

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
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

describe('RecipeDetailPage - Instruction numbering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('strips numeric prefixes when all non-header steps are numbered', async () => {
    const recipeWithNumberedSteps = createMockRecipe({
      instructions: [
        '*Make the Preferment*',
        '1. Combine ingredients',
        '2. Let rest',
        '3. Bake until golden'
      ]
    })

    mockGetRecipe.mockResolvedValue(recipeWithNumberedSteps)

    renderRecipeDetailPage()

    expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

    const firstStepButton = await screen.findByRole('button', { name: /Combine ingredients/i })
    expect(firstStepButton.textContent).toContain('Combine ingredients')
    expect(firstStepButton.textContent).not.toContain('1. Combine ingredients')

    expect(screen.queryByText('2. Let rest')).not.toBeInTheDocument()
    const secondStepButton = screen.getByRole('button', { name: /Let rest/i })
    expect(secondStepButton.textContent).toContain('Let rest')
    expect(secondStepButton.textContent).not.toContain('2. Let rest')
  })

  it('keeps numeric prefixes when steps are not uniformly numbered', async () => {
    const partiallyNumberedRecipe = createMockRecipe({
      instructions: ['1. Combine ingredients', 'Bake until golden']
    })

    mockGetRecipe.mockResolvedValue(partiallyNumberedRecipe)

    renderRecipeDetailPage()

    expect(await screen.findByText('Test Recipe')).toBeInTheDocument()

    expect(await screen.findByText('1. Combine ingredients')).toBeInTheDocument()
    expect(await screen.findByText('Bake until golden')).toBeInTheDocument()
  })
})
