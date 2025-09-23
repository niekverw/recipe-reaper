import { Router } from 'express'
import { shoppingListController } from '../controllers/shoppingListController'
import { requireAuth } from '../middleware/auth'

export const shoppingListRoutes = Router()

// Apply authentication middleware to all shopping list routes
shoppingListRoutes.use(requireAuth)

// GET /api/shopping-list - Get user's shopping list
shoppingListRoutes.get('/', shoppingListController.getShoppingList)

// POST /api/shopping-list - Add ingredients to shopping list
shoppingListRoutes.post('/', shoppingListController.addToShoppingList)

// PUT /api/shopping-list/:id - Update shopping list item (mark complete/incomplete)
shoppingListRoutes.put('/:id', shoppingListController.updateShoppingListItem)

// DELETE /api/shopping-list/:id - Remove item from shopping list
shoppingListRoutes.delete('/:id', shoppingListController.deleteShoppingListItem)

// DELETE /api/shopping-list/completed - Clear completed items
shoppingListRoutes.delete('/completed', shoppingListController.clearCompleted)