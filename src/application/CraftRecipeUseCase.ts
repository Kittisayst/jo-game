import { Backpack, CraftingIngredient } from '../domain/entities/Backpack';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';

export const RECIPE_CRAFTED_EVENT = 'recipe-crafted';

export interface RecipeDefinition
{
    id: string;
    resultItemId: string;
    resultCount: number;
    building: 'workshop' | 'forge';
    requiredBookRecipe: string | null;
    creditCost: number;
    ingredients: CraftingIngredient[];
    /** Build time in seconds of Game time; missing or 0 = made at once (see `startCraftUseCase`). */
    craftSeconds?: number;
}

export interface RecipeCraftedPayload
{
    recipeId: string;
    resultItemId: string;
    resultCount: number;
    creditCost: number;
    remainingCredit: number;
}

export interface CraftResult
{
    success: boolean;
    reason?: 'recipe_locked' | 'insufficient_credit' | 'insufficient_ingredients_or_space';
    resultItemId?: string;
    resultCount?: number;
}

export function craftRecipeUseCase (
    recipe: RecipeDefinition,
    backpack: Backpack,
    wallet: Wallet,
    unlockedRecipes: Set<string>
): CraftResult
{
    // 1. Check recipe unlock status
    if (recipe.requiredBookRecipe && !unlockedRecipes.has(recipe.requiredBookRecipe))
    {
        return {
            success: false,
            reason: 'recipe_locked',
        };
    }

    // 2. Check credit cost
    if (recipe.creditCost > 0 && !wallet.canAfford(recipe.creditCost))
    {
        return {
            success: false,
            reason: 'insufficient_credit',
        };
    }

    // 3. Check ingredients and backpack space
    if (!backpack.canCraftAfterRemoving(recipe.ingredients, recipe.resultItemId, recipe.resultCount))
    {
        return {
            success: false,
            reason: 'insufficient_ingredients_or_space',
        };
    }

    // 4. Perform transaction
    if (recipe.creditCost > 0)
    {
        wallet.spend(recipe.creditCost);
    }

    for (const ing of recipe.ingredients)
    {
        backpack.removeItem(ing.itemId, ing.count);
    }

    backpack.addItem(recipe.resultItemId, recipe.resultCount);

    DomainEvents.emit<RecipeCraftedPayload>(RECIPE_CRAFTED_EVENT, {
        recipeId: recipe.id,
        resultItemId: recipe.resultItemId,
        resultCount: recipe.resultCount,
        creditCost: recipe.creditCost,
        remainingCredit: wallet.balance,
    });

    return {
        success: true,
        resultItemId: recipe.resultItemId,
        resultCount: recipe.resultCount,
    };
}

