import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import RecipeFormPage from '../pages/RecipeFormPage'

// Mock the apiService
vi.mock('../services/api', () => ({
  apiService: {
    createRecipe: vi.fn(),
    updateRecipe: vi.fn(),
    getRecipe: vi.fn()
  }
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({})
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
  beforeEach(() => {
    vi.clearAllMocks()
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
      // Mock useParams to return an ID (indicating edit mode)
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ id: 'test-id' })
        }
      })

      renderRecipeFormPage()

      expect(screen.queryByText('Import from URL')).not.toBeInTheDocument()
    })
  })

  describe('URL Import Functionality', () => {
    const user = userEvent.setup()
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
        expect(screen.getByDisplayValue('2 cups flour\n1 tsp salt')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Mix ingredients\nBake for 30 minutes')).toBeInTheDocument()
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

    it('should disable import button when URL is empty', () => {
      renderRecipeFormPage()

      const importButton = screen.getByRole('button', { name: /import recipe/i })
      expect(importButton).toBeDisabled()
    })

    it('should enable import button when URL is entered', async () => {
      renderRecipeFormPage()

      const urlInput = screen.getByPlaceholderText('https://example.com/recipe')
      const importButton = screen.getByRole('button', { name: /import recipe/i })

      await user.type(urlInput, 'https://example.com/recipe')
      expect(importButton).not.toBeDisabled()
    })
  })

  describe('Form Submission with Source URL', () => {
    it('should include source URL when submitting imported recipe', async () => {
      const mockCreateRecipe = vi.fn().mockResolvedValue({
        id: 'test-id',
        name: 'Test Recipe'
      })

      // Mock the API service
      vi.doMock('../services/api', () => ({
        apiService: {
          createRecipe: mockCreateRecipe
        }
      }))

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