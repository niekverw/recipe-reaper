import { useEffect, useRef } from 'react';

function AddRecipePage() {
  // Auto-fill sourceUrl from ?url= param if present
  const sourceUrlRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url');
    if (url && sourceUrlRef.current) {
      sourceUrlRef.current.value = url;
    }
  }, []);

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h1
          className="text-2xl font-normal tracking-tight mb-1"
          style={{
            color: 'var(--color-text-primary)',
          }}
        >
          Add New Recipe
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Create and share your culinary masterpiece</p>
      </div>

      <form className="space-y-6">
        <div
          className="rounded-lg relative"
          style={{
            backgroundColor: 'transparent',
            position: 'relative'
          }}
        >
          <div 
            className="border-b mb-3"
            style={{ 
              borderColor: 'var(--color-border-primary)'
            }}
          />
          <h2
            className="font-medium mb-4 flex items-center gap-2"
            style={{
              color: 'var(--color-text-primary)',
            }}
          >
            <span className="inline-block w-4 h-4 rounded-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }}>
                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
              </svg>
            </span>
            Basic Information
          </h2>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Recipe Name
              </label>
              <input
                type="text"
                id="title"
                placeholder="Enter recipe name"
                className="w-full px-2 py-1.5 text-sm border transition-colors"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-input-border)',
                  borderRadius: 'var(--border-radius-medium)',
                  color: 'var(--color-input-text)'
                }}
                autoComplete="off"
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Description
              </label>
              <textarea
                id="description"
                rows={2}
                placeholder="Brief description of your recipe"
                className="w-full px-2 py-1.5 text-sm border transition-colors resize-none"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-input-border)',
                  borderRadius: 'var(--border-radius-medium)',
                  color: 'var(--color-input-text)'
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative">
            <div className="border-b mb-3 pb-1" style={{ borderColor: 'var(--color-accent)' }}>
              <h3
                className="font-medium flex items-center gap-2"
                style={{
                  color: 'var(--color-text-primary)',
                }}
              >
                <span className="inline-block w-4 h-4 rounded-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: 'var(--color-accent)' }}>
                    <path d="M10.75 1.75a.75.75 0 00-1.5 0v1.5h-1.5a.75.75 0 000 1.5h1.5v1.5a.75.75 0 001.5 0v-1.5h1.5a.75.75 0 000-1.5h-1.5v-1.5zM6 4a1 1 0 00-1 1v11a1 1 0 001 1h8a1 1 0 001-1V5a1 1 0 00-1-1H6z" />
                  </svg>
                </span>
                Ingredients
              </h3>
            </div>
            <div className="relative">
              <textarea
                id="ingredients"
                rows={8}
                placeholder={`2 cups all-purpose flour
1 tsp baking powder
1/2 cup butter, softened
1 cup sugar
2 large eggs`}
                className="w-full px-3 py-2.5 text-sm transition-colors resize-none font-mono"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-input-border)',
                  borderRadius: 'var(--border-radius-medium)',
                  color: 'var(--color-input-text)',
                  lineHeight: '1.5',
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                One item per line
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="border-b mb-3 pb-1" style={{ borderColor: 'var(--color-button-primary)' }}>
              <h3
                className="font-medium flex items-center gap-2"
                style={{
                  color: 'var(--color-text-primary)',
                }}
              >
                <span className="inline-block w-4 h-4 rounded-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: 'var(--color-button-primary)' }}>
                    <path fillRule="evenodd" d="M2 3a1 1 0 00-1 1v12a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2zm3.5 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm4.5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm4.5 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" />
                  </svg>
                </span>
                Instructions
              </h3>
            </div>
            <div className="relative">
              <textarea
                id="instructions"
                rows={8}
                placeholder={`1. Preheat oven to 350°F
2. Mix dry ingredients in a bowl
3. Cream butter and sugar
4. Add eggs one at a time
5. Combine wet and dry ingredients
6. Bake for 25-30 minutes`}
                className="w-full px-3 py-2.5 text-sm transition-colors resize-none"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-input-border)',
                  borderRadius: 'var(--border-radius-medium)',
                  color: 'var(--color-input-text)',
                  lineHeight: '1.5',
                }}
              />
              <div className="absolute bottom-2 right-2 text-xs opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                Each step on a new line
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="prepTime"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Prep Time (minutes) <span className="text-xs opacity-70" style={{ color: 'var(--color-text-secondary)' }}>(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="prepTime"
                  placeholder="30"
                  className="w-full px-2 py-1.5 text-sm border transition-colors"
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: 'var(--color-input-border)',
                    borderRadius: 'var(--border-radius-medium)',
                    color: 'var(--color-input-text)'
                  }}
                  autoComplete="off"
                  inputMode="numeric"
                />
                <div className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                  Leave empty to auto-infer
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="servings"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Servings <span className="text-xs opacity-70" style={{ color: 'var(--color-text-secondary)' }}>(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="servings"
                  placeholder="4"
                  className="w-full px-2 py-1.5 text-sm border transition-colors"
                  style={{
                    backgroundColor: 'var(--color-input-background)',
                    borderColor: 'var(--color-input-border)',
                    borderRadius: 'var(--border-radius-medium)',
                    color: 'var(--color-input-text)'
                  }}
                  autoComplete="off"
                  inputMode="numeric"
                />
                <div className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                  Leave empty to auto-infer
                </div>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Image URL <span className="text-xs opacity-70" style={{ color: 'var(--color-text-secondary)' }}>(optional)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                id="imageUrl"
                placeholder="https://example.com/my-recipe-image.jpg"
                className="w-full px-2 py-1.5 text-sm border transition-colors"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-input-border)',
                  borderRadius: 'var(--border-radius-medium)',
                  color: 'var(--color-input-text)'
                }}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                inputMode="url"
              />
              <div className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                Add a URL to an image of your completed recipe
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="sourceUrl"
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Source URL <span className="text-xs opacity-70" style={{ color: 'var(--color-text-secondary)' }}>(optional)</span>
            </label>
            <div className="relative">
              <input
                type="url"
                id="sourceUrl"
                placeholder="https://example.com/original-recipe"
                className="w-full px-2 py-1.5 text-sm border transition-colors"
                style={{
                  backgroundColor: 'var(--color-input-background)',
                  borderColor: 'var(--color-input-border)',
                  borderRadius: 'var(--border-radius-medium)',
                  color: 'var(--color-input-text)'
                }}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                inputMode="url"
                ref={sourceUrlRef}
              />
              <div className="text-xs mt-0.5 opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                URL of the original recipe or inspiration source
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <button
            type="submit"
            className="px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-90 flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-background)',
              borderRadius: 'var(--border-radius-medium)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Save Recipe
          </button>
          <button
            type="button"
            className="px-4 py-1.5 text-sm font-medium border transition-colors hover:opacity-90 flex items-center gap-1.5"
            style={{
              backgroundColor: 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--color-border-primary)',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--border-radius-medium)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preview
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddRecipePage