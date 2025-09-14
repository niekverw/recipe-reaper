function AddRecipePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="text-center">
        <h1
          className="text-2xl font-normal tracking-tight mb-2"
          style={{
            color: 'var(--color-text-primary)',
          }}
        >
          Add New Recipe
        </h1>
      </div>

      <form className="space-y-4">
        <div
          className="border p-4"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border-primary)',
            borderRadius: 'var(--border-radius-medium)',
            boxShadow: 'var(--shadow-small)'
          }}
        >
          <h2
            className="font-medium mb-4"
            style={{
              color: 'var(--color-text-primary)'
            }}
          >
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
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="prepTime"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Prep Time (minutes)
                </label>
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
                />
              </div>
              <div>
                <label
                  htmlFor="servings"
                  className="block text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Servings
                </label>
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
                />
              </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className="border p-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border-primary)',
              borderRadius: 'var(--border-radius-medium)',
              boxShadow: 'var(--shadow-small)'
            }}
          >
            <h3
              className="font-medium mb-3"
              style={{
                color: 'var(--color-text-primary)',
                  }}
            >
              Ingredients
            </h3>
            <textarea
              id="ingredients"
              rows={6}
              placeholder={`2 cups all-purpose flour
1 tsp baking powder
1/2 cup butter, softened
1 cup sugar
2 large eggs`}
              className="w-full px-2 py-1.5 text-sm border transition-colors resize-none font-mono"
              style={{
                backgroundColor: 'var(--color-input-background)',
                borderColor: 'var(--color-input-border)',
                borderRadius: 'var(--border-radius-medium)',
                color: 'var(--color-input-text)',
                lineHeight: '1.3'
              }}
            />
          </div>

          <div
            className="border p-4"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border-primary)',
              borderRadius: 'var(--border-radius-medium)',
              boxShadow: 'var(--shadow-small)'
            }}
          >
            <h3
              className="font-medium mb-3"
              style={{
                color: 'var(--color-text-primary)',
                  }}
            >
              Instructions
            </h3>
            <textarea
              id="instructions"
              rows={6}
              placeholder={`1. Preheat oven to 350°F
2. Mix dry ingredients in a bowl
3. Cream butter and sugar
4. Add eggs one at a time
5. Combine wet and dry ingredients
6. Bake for 25-30 minutes`}
              className="w-full px-2 py-1.5 text-sm border transition-colors resize-none"
              style={{
                backgroundColor: 'var(--color-input-background)',
                borderColor: 'var(--color-input-border)',
                borderRadius: 'var(--border-radius-medium)',
                color: 'var(--color-input-text)',
                lineHeight: '1.3'
              }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--color-button-primary)',
              color: 'var(--color-background)',
              borderRadius: 'var(--border-radius-medium)'
            }}
          >
            Save Recipe
          </button>
          <button
            type="button"
            className="px-4 py-1.5 text-sm font-medium border transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'var(--color-border-primary)',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--border-radius-medium)'
            }}
          >
            Preview
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddRecipePage