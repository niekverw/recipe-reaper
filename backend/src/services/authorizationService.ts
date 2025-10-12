import { userModel } from '../models/userModel'
import { User } from '../types/user'

/**
 * Service for handling authorization logic
 */
export class AuthorizationService {
  /**
   * Check if a user has access to a recipe through household membership
   * @param user - Current user
   * @param recipeOwnerId - ID of recipe owner
   * @param recipeHouseholdId - ID of recipe's household
   * @returns True if user has household access
   */
  async userHasHouseholdAccess(
    user: User,
    recipeOwnerId?: string,
    recipeHouseholdId?: string
  ): Promise<boolean> {
    if (!user.householdId) {
      return false
    }

    // Check if recipe is in user's household
    if (recipeHouseholdId && recipeHouseholdId === user.householdId) {
      return true
    }

    // Check if recipe owner is in user's household
    if (recipeOwnerId && recipeOwnerId !== user.id) {
      const owner = await userModel.findById(recipeOwnerId)
      if (owner && owner.household_id === user.householdId) {
        return true
      }
    }

    return false
  }

  /**
   * Check if user can edit a recipe
   * @param user - Current user
   * @param recipeUserId - ID of recipe owner
   * @param recipeHouseholdId - ID of recipe's household
   * @returns True if user can edit the recipe
   */
  async canEditRecipe(
    user: User,
    recipeUserId?: string,
    recipeHouseholdId?: string
  ): Promise<boolean> {
    // User owns the recipe
    if (recipeUserId === user.id) {
      return true
    }

    // Check household access
    return await this.userHasHouseholdAccess(user, recipeUserId, recipeHouseholdId)
  }
}

// Export singleton instance
export const authorizationService = new AuthorizationService()
