import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBagIcon,
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { apiService, ShoppingListItem } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { getCategoryById, IngredientCategory } from '../utils/categories'

interface CustomCheckboxProps {
  size?: 'sm' | 'md' | 'lg'
  isSelected: boolean
  onValueChange: () => void
}

function CustomCheckbox({ size = 'md', isSelected, onValueChange }: CustomCheckboxProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      onClick={onValueChange}
      className={`flex items-center justify-center ${sizeClass} rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      <div
        className={`w-full h-full rounded border flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
        }`}
      >
        {isSelected ? (
          <CheckIcon className="w-3 h-3" />
        ) : null}
      </div>
    </button>
  )
}

interface ShoppingListItemProps {
  item: ShoppingListItem
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}

function ShoppingListItemComponent({ item, onToggle, onDelete }: ShoppingListItemProps) {
  // Use displayName if available, otherwise fall back to description, then ingredient
  const displayText = item.displayName || item.description || item.ingredient

  // Show original ingredient in parentheses only if we have a simplified displayName
  const showOriginal = item.displayName && item.displayName !== item.ingredient

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <CustomCheckbox
        isSelected={item.isCompleted}
        onValueChange={() => onToggle(item.id, !item.isCompleted)}
      />

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${
          item.isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
        }`}>
          <span className="font-medium">
            {displayText}
          </span>
          {showOriginal && (
            <span className="text-gray-500 dark:text-gray-400 ml-1 font-normal">
              ({item.ingredient})
            </span>
          )}
        </div>
        {item.recipeName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            From: {item.recipeName}
          </p>
        )}
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        aria-label="Delete item"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function ShoppingListPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<Set<string>>(new Set())
  const [newItem, setNewItem] = useState('')
  const [isAddingManualItem, setIsAddingManualItem] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadShoppingList()
  }, [user, navigate])

  const loadShoppingList = async () => {
    try {
      setLoading(true)
      setError(null)
      const shoppingList = await apiService.getShoppingList()
      setItems(shoppingList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shopping list')
      console.error('Failed to load shopping list:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleItem = async (id: string, completed: boolean) => {
    if (updating.has(id)) return

    try {
      setUpdating(prev => new Set([...prev, id]))
      const updatedItem = await apiService.updateShoppingListItem(id, { isCompleted: completed })

      setItems(prev =>
        prev.map(item => item.id === id ? updatedItem : item)
      )
    } catch (err) {
      console.error('Failed to update shopping list item:', err)
      // Could show a toast notification here
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (updating.has(id)) return

    try {
      setUpdating(prev => new Set([...prev, id]))
      await apiService.deleteShoppingListItem(id)

      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Failed to delete shopping list item:', err)
      // Could show a toast notification here
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleClearCompleted = async () => {
    const completedItems = items.filter(item => item.isCompleted)
    if (completedItems.length === 0) return

    if (!window.confirm(`Clear ${completedItems.length} completed item(s)?`)) return

    try {
      await apiService.clearCompletedShoppingItems()
      setItems(prev => prev.filter(item => !item.isCompleted))
    } catch (err) {
      console.error('Failed to clear completed items:', err)
      // Could show a toast notification here
    }
  }

  const handleAddManualItem = async () => {
    const trimmedItem = newItem.trim()
    if (!trimmedItem || isAddingManualItem) return

    try {
      setIsAddingManualItem(true)
      const response = await apiService.addToShoppingList({
        ingredients: [trimmedItem]
      })

      if (response.items.length > 0) {
        setItems(prev => [...response.items, ...prev])
        setNewItem('')
      }
    } catch (err) {
      console.error('Failed to add manual item:', err)
      // Could show a toast notification here
    } finally {
      setIsAddingManualItem(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddManualItem()
    }
  }

  // Group items by category
  const groupedItems = items.reduce<Record<string, { category: IngredientCategory; items: ShoppingListItem[] }>>((groups, item) => {
    const categoryId = item.category || 'OTHER'
    const category = getCategoryById(categoryId)

    if (!groups[categoryId]) {
      groups[categoryId] = { category, items: [] }
    }
    groups[categoryId].items.push(item)
    return groups
  }, {})

  // Sort categories by their sort order
  const sortedCategoryEntries = Object.entries(groupedItems).sort(([, a], [, b]) =>
    a.category.sortOrder - b.category.sortOrder
  )

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const completedCount = items.filter(item => item.isCompleted).length
  const totalCount = items.length

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shopping list...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Error Loading Shopping List</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={loadShoppingList}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping List</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalCount === 0
              ? 'No items in your shopping list'
              : `${completedCount} of ${totalCount} items completed`
            }
          </p>
        </div>

        {completedCount > 0 && (
          <button
            onClick={handleClearCompleted}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Clear Completed
          </button>
        )}
      </div>

      {/* Add Item Input */}
      <div className="mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add item to shopping list..."
              disabled={isAddingManualItem}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleAddManualItem}
              disabled={!newItem.trim() || isAddingManualItem}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAddingManualItem ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4" />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBagIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Your shopping list is empty</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add ingredients from recipes to start building your shopping list.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Browse Recipes
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCategoryEntries.map(([categoryId, { category, items }]) => {
            const isCollapsed = collapsedCategories.has(categoryId)
            const completedInCategory = items.filter(item => item.isCompleted).length
            const totalInCategory = items.length

            return (
              <div key={categoryId} className="space-y-2">
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{category.emoji}</div>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {category.name} ({completedInCategory}/{totalInCategory})
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                      {totalInCategory}
                    </span>
                    {isCollapsed ? (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>                {!isCollapsed && (
                  <div className="space-y-2 pl-3">
                    {items.map(item => (
                      <ShoppingListItemComponent
                        key={item.id}
                        item={item}
                        onToggle={handleToggleItem}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}