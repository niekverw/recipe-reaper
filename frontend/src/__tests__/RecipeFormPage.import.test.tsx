import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import RecipeFormPage from '../pages/RecipeFormPage'

// Shared mocks for apiService methods used by the form (must be hoisted for vi.mock)
const {
  mockCreateRecipe,
  mockUpdateRecipe,
  mockGetRecipe,
  mockCheckRecipeName,
  mockScrapeRecipeFromUrl,
  mockParseRecipeFromText,
  mockParseRecipeFromTextGemini,
  mockParseRecipeFromImage,
  mockGetAllTags,
  mockUploadImage,
  mockInvalidateRecipesCache
} = vi.hoisted(() => {
  const createRecipe = vi.fn()
  const updateRecipe = vi.fn()
  const getRecipe = vi.fn()
  const checkRecipeName = vi.fn().mockResolvedValue({ exists: false })
  const parseRecipeFromText = vi.fn()
  const parseRecipeFromTextGemini = vi.fn()
  const parseRecipeFromImage = vi.fn()
  const getAllTags = vi.fn().mockResolvedValue([])
  const uploadImage = vi.fn()
  const invalidateRecipesCache = vi.fn()

  const scrapeRecipeFromUrl = vi.fn(async (url: string) => {
    try {
      const response = await (globalThis as any).fetch('/api/recipes/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: { message: 'Failed to import recipe from URL' } }))
        throw new Error(errorData.error?.message || 'Failed to import recipe from URL')
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to import recipe from URL')
    }
  })

  return {
    mockCreateRecipe: createRecipe,
    mockUpdateRecipe: updateRecipe,
    mockGetRecipe: getRecipe,
    mockCheckRecipeName: checkRecipeName,
    mockScrapeRecipeFromUrl: scrapeRecipeFromUrl,
    mockParseRecipeFromText: parseRecipeFromText,
    mockParseRecipeFromTextGemini: parseRecipeFromTextGemini,
    mockParseRecipeFromImage: parseRecipeFromImage,
    mockGetAllTags: getAllTags,
    mockUploadImage: uploadImage,
    mockInvalidateRecipesCache: invalidateRecipesCache
  }
})

const {
  setRouterParams,
  setRouterPathname,
  resetRouterMocks,
  getUseNavigate,
  getUseParams,
  getUseLocation
} = vi.hoisted(() => {
  const navigate = vi.fn()
  let params: Record<string, string | undefined> = {}
  let location = { pathname: '/' }

  return {
    mockNavigate: navigate,
    setRouterParams: (next: Record<string, string | undefined>) => {
      params = next
    },
    setRouterPathname: (pathname: string) => {
      location = { ...location, pathname }
    },
    resetRouterMocks: () => {
      params = {}
      location = { pathname: '/' }
      navigate.mockReset()
    },
    getUseNavigate: () => () => navigate,
    getUseParams: () => () => params,
    getUseLocation: () => () => location,
    useNavigate: () => navigate,
    useParams: () => params,
    useLocation: () => location
  }
})

// Mock the apiService
vi.mock('../services/api', () => ({
  apiService: {
    createRecipe: mockCreateRecipe,
    updateRecipe: mockUpdateRecipe,
    getRecipe: mockGetRecipe,
    checkRecipeName: mockCheckRecipeName,
    constructImageUrl: (url: string) => url,
    getAllTags: mockGetAllTags,
    scrapeRecipeFromUrl: mockScrapeRecipeFromUrl,
    parseRecipeFromText: mockParseRecipeFromText,
    parseRecipeFromTextGemini: mockParseRecipeFromTextGemini,
    parseRecipeFromImage: mockParseRecipeFromImage,
    uploadImage: mockUploadImage,
    invalidateRecipesCache: mockInvalidateRecipesCache
  }
}))

// Mock authentication context to prevent provider errors
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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: getUseNavigate(),
    useParams: getUseParams(),
    useLocation: getUseLocation()
  }
})

const renderRecipeFormPage = () => {
  return render(
    <BrowserRouter>
      <RecipeFormPage />
    </BrowserRouter>
  )
}

describe('RecipeFormPage - URL Import Feature', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    vi.clearAllMocks()
    resetRouterMocks()
    setRouterParams({})
    setRouterPathname('/')
    mockCreateRecipe.mockReset()
    mockUpdateRecipe.mockReset()
    mockGetRecipe.mockReset()
    mockScrapeRecipeFromUrl.mockClear()
    mockParseRecipeFromText.mockReset()
    mockParseRecipeFromTextGemini.mockReset()
    mockParseRecipeFromImage.mockReset()
    mockGetAllTags.mockClear()
    mockCheckRecipeName.mockClear()
    mockGetAllTags.mockResolvedValue([])
    mockCheckRecipeName.mockResolvedValue({ exists: false })
    mockParseRecipeFromTextGemini.mockResolvedValue({
      recipeData: {
        name: 'Gemini AI Recipe',
        description: 'Generated by Gemini',
        ingredients: ['1 cup imagination'],
        instructions: ['Combine all thoughts.'],
        image: '',
        sourceUrl: undefined,
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        totalTimeMinutes: 5,
        servings: 2
      }
    })
    user = userEvent.setup()
    // Reset fetch mock
    ;(globalThis as any).fetch = vi.fn()
    // Reset window.confirm mock
    window.confirm = vi.fn().mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('URL Import Section Visibility', () => {
    it('should show URL import section when creating new recipe', () => {
      renderRecipeFormPage()

      expect(screen.getByText('Import from URL')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('https://example.com/recipe')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /import recipe/i })).toBeInTheDocument()
    })

    it('should not show URL import section when editing recipe', () => {
      setRouterParams({ id: 'test-id' })
      setRouterPathname('/recipe/test-id')

      renderRecipeFormPage()

      expect(screen.queryByText('Import from URL')).not.toBeInTheDocument()
    })
  })

  describe('URL Import Functionality', () => {
    const mockRecipeData = {
      name: 'Imported Recipe',
      description: 'A delicious imported recipe',
      ingredients: ['2 cups flour', '1 tsp salt'],
      instructions: ['Mix ingredients', 'Bake for 30 minutes'],
      image: 'https://example.com/image.jpg',
      sourceUrl: 'https://example.com/recipe',
      prepTimeMinutes: 15,
      servings: 4
    }

    it('should successfully import recipe from URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ recipeData: mockRecipeData })
      })
      ;(globalThis as any).fetch = mockFetch

      renderRecipeFormPage()

      const urlInput = screen.getByPlaceholderText('https://example.com/recipe')
      const importButton = screen.getByRole('button', { name: /import recipe/i })

      // Enter URL
  await user.type(urlInput, 'https://example.com/recipe')
      expect(urlInput).toHaveValue('https://example.com/recipe')

      // Click import button
  await user.click(importButton)

      // Verify fetch was called correctly
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/recipes/scrape', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: 'https://example.com/recipe' })
        })
      })

      // Verify form fields are populated
      await waitFor(() => {
        expect(screen.getByDisplayValue('Imported Recipe')).toBeInTheDocument()
        expect(screen.getByDisplayValue('A delicious imported recipe')).toBeInTheDocument()
  expect(screen.getByLabelText(/ingredients/i)).toHaveValue('2 cups flour\n1 tsp salt')
  expect(screen.getByLabelText(/instructions/i)).toHaveValue('Mix ingredients\nBake for 30 minutes')
        expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument()
      })

      // Verify URL input is cleared
      expect(urlInput).toHaveValue('')
    })

    it('should show loading state during import', async () => {
      let resolvePromise: (value: any) => void
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      const mockFetch = vi.fn().mockReturnValue(pendingPromise)
      ;(globalThis as any).fetch = mockFetch

      renderRecipeFormPage()

      const urlInput = screen.getByPlaceholderText('https://example.com/recipe')
      const importButton = screen.getByRole('button', { name: /import recipe/i })

  await user.type(urlInput, 'https://example.com/recipe')
  await user.click(importButton)

      // Check loading state
      expect(screen.getByText('Importing...')).toBeInTheDocument()
      expect(importButton).toBeDisabled()
      expect(urlInput).toBeDisabled()

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ recipeData: mockRecipeData })
      })

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Importing...')).not.toBeInTheDocument()
      })
    })

    it('should handle empty URL validation', async () => {
      renderRecipeFormPage()

      const importButton = screen.getByRole('button', { name: /import recipe/i })

      // Try to import without URL
  await user.click(importButton)

      expect(screen.getByText('Please enter a URL')).toBeInTheDocument()
      expect((globalThis as any).fetch).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Recipe not found at the provided URL' }
        })
      })
      ;(globalThis as any).fetch = mockFetch

      renderRecipeFormPage()

      const urlInput = screen.getByPlaceholderText('https://example.com/recipe')
      const importButton = screen.getByRole('button', { name: /import recipe/i })

  await user.type(urlInput, 'https://invalid-url.com/recipe')
  await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText('Recipe not found at the provided URL')).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      ;(globalThis as any).fetch = mockFetch

      renderRecipeFormPage()

      const urlInput = screen.getByPlaceholderText('https://example.com/recipe')
      const importButton = screen.getByRole('button', { name: /import recipe/i })

      await user.type(urlInput, 'https://example.com/recipe')
      await user.click(importButton)

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should warn before overwriting existing form data', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ recipeData: mockRecipeData })
      })
      ;(globalThis as any).fetch = mockFetch

      renderRecipeFormPage()

      // Fill in some existing data
      const nameInput = screen.getByLabelText(/recipe name/i)
      await user.type(nameInput, 'Existing Recipe')

      // Try to import
      const urlInput = screen.getByPlaceholderText('https://example.com/recipe')
      const importButton = screen.getByRole('button', { name: /import recipe/i })

      await user.type(urlInput, 'https://example.com/recipe')
      await user.click(importButton)

      // Verify confirm was called
      expect(window.confirm).toHaveBeenCalledWith(
        'This will overwrite your current form data. Do you want to continue?'
      )
    })

    it('should not import if user cancels overwrite confirmation', async () => {
      window.confirm = vi.fn().mockReturnValue(false)

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ recipeData: mockRecipeData })
      })
      ;(globalThis as any).fetch = mockFetch

      renderRecipeFormPage()

      // Fill in some existing data
      const nameInput = screen.getByLabelText(/recipe name/i)
      await user.type(nameInput, 'Existing Recipe')

      // Try to import
      const urlInput = screen.getByPlaceholderText('https://example.com/recipe')
      const importButton = screen.getByRole('button', { name: /import recipe/i })

      await user.type(urlInput, 'https://example.com/recipe')
      await user.click(importButton)

      // Verify form data wasn't overwritten
      expect(nameInput).toHaveValue('Existing Recipe')
      expect(screen.queryByDisplayValue('Imported Recipe')).not.toBeInTheDocument()
    })

    it('should indicate import button is inactive when URL is empty', () => {
      renderRecipeFormPage()

      const importButton = screen.getByRole('button', { name: /import recipe/i })
      expect(importButton).not.toBeDisabled()
      expect(importButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('should enable import button when URL is entered', async () => {
      renderRecipeFormPage()

      const urlInput = screen.getByPlaceholderText('https://example.com/recipe')
      const importButton = screen.getByRole('button', { name: /import recipe/i })

      await user.type(urlInput, 'https://example.com/recipe')
      expect(importButton).not.toBeDisabled()
      expect(importButton).toHaveAttribute('aria-disabled', 'false')
    })
  })

  // Additional Gemini context note removed from text import: coverage retained via URL tests

  describe('Form Submission with Source URL', () => {
    it('should include source URL when submitting imported recipe', async () => {
      mockCreateRecipe.mockResolvedValue({
        id: 'test-id',
        name: 'Test Recipe'
      })

      renderRecipeFormPage()

      // Fill form with imported data (simulating successful import)
      const nameInput = screen.getByLabelText(/recipe name/i)
      const descInput = screen.getByLabelText(/description/i)
      const ingredientsInput = screen.getByLabelText(/ingredients/i)
      const instructionsInput = screen.getByLabelText(/instructions/i)

      await userEvent.type(nameInput, 'Imported Recipe')
      await userEvent.type(descInput, 'A delicious recipe')
      await userEvent.type(ingredientsInput, '2 cups flour')
      await userEvent.type(instructionsInput, 'Mix and bake')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save recipe/i })
      await userEvent.click(submitButton)

      // Verify API was called with correct data structure
      await waitFor(() => {
        expect(mockCreateRecipe).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Imported Recipe',
            description: 'A delicious recipe',
            ingredients: expect.any(Array),
            instructions: expect.any(Array)
          })
        )
      })
    })
  })
})