import { useState, useEffect, useMemo, useCallback } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
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
import { getRandomLoadingHumor, getRandomShoppingListHumor } from '../utils/humor'

interface CustomCheckboxProps {
  id: string
  size?: 'sm' | 'md' | 'lg'
  isSelected: boolean
  onValueChange: () => void
}

function CustomCheckbox({ id, size = 'md', isSelected, onValueChange }: CustomCheckboxProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'

  return (
    <span className="inline-flex items-center justify-center flex-shrink-0">
      <input
        id={id}
        type="checkbox"
        checked={isSelected}
        onChange={() => onValueChange()}
        className="sr-only peer"
      />
      <span
        aria-hidden="true"
        className={`flex items-center justify-center ${sizeClass} rounded border transition-colors ${
          isSelected
            ? 'bg-green-500 border-green-500 text-white'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
        } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-blue-500`}
      >
        {isSelected ? (
          <CheckIcon className="w-3 h-3" />
        ) : null}
      </span>
    </span>
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
  const checkboxId = useMemo(() => `shopping-item-${item.id}`, [item.id])

  const handleToggle = useCallback(() => {
    onToggle(item.id, !item.isCompleted)
  }, [item.id, item.isCompleted, onToggle])

  const handleContainerClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button')) {
      return
    }
    handleToggle()
  }, [handleToggle])

  return (
    <div
      className="flex items-center gap-3 py-2 px-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      onClick={handleContainerClick}
    >
      <label
        htmlFor={checkboxId}
        className="flex items-center gap-3 flex-1 cursor-pointer"
      >
        <CustomCheckbox
          id={checkboxId}
          isSelected={item.isCompleted}
          onValueChange={handleToggle}
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
      </label>

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

  const loadShoppingList = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    loadShoppingList()
  }, [user, navigate, loadShoppingList])

  const handleToggleItem = useCallback(async (id: string, completed: boolean) => {
    if (updating.has(id)) return

    // Optimistic update - immediately update UI
    const previousItems = [...items]
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isCompleted: completed } : item
      )
    )

    try {
      setUpdating(prev => new Set([...prev, id]))
      const updatedItem = await apiService.updateShoppingListItem(id, { isCompleted: completed })

      // Update with server response to ensure consistency
      setItems(prev =>
        prev.map(item => item.id === id ? updatedItem : item)
      )
    } catch (err) {
      // Revert optimistic update on error
      setItems(previousItems)
      console.error('Failed to update shopping list item:', err)
      // Could show a toast notification here
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }, [items, updating])

  const handleDeleteItem = useCallback(async (id: string) => {
    if (updating.has(id)) return

    // Optimistic update - immediately remove from UI
    const itemToDelete = items.find(item => item.id === id)
    if (!itemToDelete) return

    const previousItems = [...items]
    setItems(prev => prev.filter(item => item.id !== id))

    try {
      setUpdating(prev => new Set([...prev, id]))
      await apiService.deleteShoppingListItem(id)
    } catch (err) {
      // Revert optimistic update on error
      setItems(previousItems)
      console.error('Failed to delete shopping list item:', err)
      // Could show a toast notification here
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }, [items, updating])

  const handleClearAll = useCallback(async () => {
    if (items.length === 0) return

    if (!window.confirm(`Clear all ${items.length} item(s) from your shopping list? This action cannot be undone.`)) return

    try {
      await apiService.clearAllShoppingItems()
      // Reload the shopping list to ensure UI is in sync with server
      await loadShoppingList()
    } catch (err) {
      console.error('Failed to clear all items:', err)
      // Could show a toast notification here
    }
  }, [items, loadShoppingList])

  const handleAddManualItem = useCallback(async () => {
    const trimmedItem = newItem.trim()
    if (!trimmedItem || isAddingManualItem) return

    try {
      setIsAddingManualItem(true)
      const response = await apiService.addToShoppingList({
        ingredients: [trimmedItem]
      })

      setItems(prevItems => {
        if (!response.items.length) {
          return prevItems
        }

        const existingIds = new Set(prevItems.map(item => item.id))
        const updatesById = new Map(response.items.map(item => [item.id, item]))

        const mergedItems = prevItems.map(item => updatesById.get(item.id) || item)
        const newItems = response.items.filter(item => !existingIds.has(item.id))

        return [...newItems, ...mergedItems]
      })

      setNewItem('')
    } catch (err) {
      console.error('Failed to add manual item:', err)
      // Could show a toast notification here
    } finally {
      setIsAddingManualItem(false)
    }
  }, [isAddingManualItem, newItem])

  const handleManualItemKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddManualItem()
    }
  }, [handleAddManualItem])

  const { completedItems, sortedCategoryEntries } = useMemo(() => {
    const completed: ShoppingListItem[] = []
    const grouped: Record<string, { category: IngredientCategory; items: ShoppingListItem[] }> = {}

    items.forEach(item => {
      if (item.isCompleted) {
        completed.push(item)
        return
      }

      const categoryId = item.category || 'OTHER'
      const category = getCategoryById(categoryId)

      if (!grouped[categoryId]) {
        grouped[categoryId] = { category, items: [] }
      }
      grouped[categoryId].items.push(item)
    })

    const sortedEntries = Object.entries(grouped).sort(([, a], [, b]) =>
      a.category.sortOrder - b.category.sortOrder
    )

    return {
      completedItems: completed,
      sortedCategoryEntries: sortedEntries
    }
  }, [items])

  const totalCount = items.length
  const completedCount = completedItems.length

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shopping list...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 italic">
            {getRandomLoadingHumor()}
          </p>
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

        <div className="flex gap-3">
          {totalCount > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Add Item Input */}
      <div className="mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={handleManualItemKeyDown}
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
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6 italic">
            {getRandomShoppingListHumor()}
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
          {sortedCategoryEntries.map(([categoryId, { category, items: categoryItems }]) => {
            const isCollapsed = collapsedCategories.has(categoryId)
            const totalInCategory = categoryItems.length

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
                        {category.name} ({totalInCategory})
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
                </button>
                {!isCollapsed && (
                  <div className="space-y-2 pl-3">
                    {categoryItems.map(item => (
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

          {/* Completed Items Section */}
          {completedItems.length > 0 && (
            <div className="space-y-2">
              <div className="w-full flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="text-xl">✅</div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                      Completed ({completedItems.length})
                    </h2>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
                  {completedItems.length}
                </span>
              </div>
              <div className="space-y-2 pl-3">
                {completedItems.map(item => (
                  <ShoppingListItemComponent
                    key={item.id}
                    item={item}
                    onToggle={handleToggleItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}