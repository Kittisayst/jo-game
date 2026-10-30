import { Backpack } from '../domain/entities/Backpack';
import { CraftingQueue } from '../domain/entities/CraftingQueue';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';
import { RecipeDefinition, CraftResult, craftRecipeUseCase } from './CraftRecipeUseCase';

export const CRAFT_STARTED_EVENT = 'craft-started';
export const CRAFT_COLLECTED_EVENT = 'craft-collected';

export interface CraftStartedPayload
{
    recipeId: string;
    seconds: number;
}

export interface CraftCollectedPayload
{
    recipeId: string;
    resultItemId: string;
    resultCount: number;
}

export type StartCraftResult =
    | { success: true; started: boolean; resultItemId: string; resultCount: number }
    | { success: false; reason: 'busy' | 'recipe_locked' | 'insufficient_credit' | 'insufficient_ingredients_or_space' };

/** How long a recipe takes in seconds of Game time; 0 for one that is made at once. */
export function craftSecondsOf (recipe: RecipeDefinition): number
{
    return recipe.craftSeconds && recipe.craftSeconds > 0 ? recipe.craftSeconds : 0;
}

/**
 * Starts making a recipe. A recipe with a `craftSeconds` takes its Materials and Credit now and goes into the
 * queue (only one job at a time; the result is collected when it is done). A recipe without one is made at once,
 * as before.
 */
export function startCraftUseCase (
    recipe: RecipeDefinition,
    backpack: Backpack,
    wallet: Wallet,
    unlockedRecipes: Set<string>,
    queue: CraftingQueue
): StartCraftResult
{
    const seconds = craftSecondsOf(recipe);

    if (seconds === 0)
    {
        const instant: CraftResult = craftRecipeUseCase(recipe, backpack, wallet, unlockedRecipes);
        return instant.success
            ? { success: true, started: false, resultItemId: recipe.resultItemId, resultCount: recipe.resultCount }
            : { success: false, reason: instant.reason ?? 'insufficient_ingredients_or_space' };
    }

    if (queue.isBusy) return { success: false, reason: 'busy' };
    if (recipe.requiredBookRecipe && !unlockedRecipes.has(recipe.requiredBookRecipe)) return { success: false, reason: 'recipe_locked' };
    if (recipe.creditCost > 0 && !wallet.canAfford(recipe.creditCost)) return { success: false, reason: 'insufficient_credit' };
    if (!backpack.canCraftAfterRemoving(recipe.ingredients, recipe.resultItemId, recipe.resultCount))
    {
        return { success: false, reason: 'insufficient_ingredients_or_space' };
    }

    if (recipe.creditCost > 0) wallet.spend(recipe.creditCost);
    for (const ing of recipe.ingredients) backpack.removeItem(ing.itemId, ing.count);

    queue.start(recipe.id, recipe.resultItemId, recipe.resultCount, seconds * 1000);
    DomainEvents.emit<CraftStartedPayload>(CRAFT_STARTED_EVENT, { recipeId: recipe.id, seconds });
    return { success: true, started: true, resultItemId: recipe.resultItemId, resultCount: recipe.resultCount };
}

export type CollectCraftResult =
    | { success: true; resultItemId: string; resultCount: number }
    | { success: false; reason: 'nothing_ready' | 'backpack_full' };

/** Takes a finished job's result into the Backpack. It stays in the queue when the Backpack has no room. */
export function collectCraftUseCase (queue: CraftingQueue, backpack: Backpack): CollectCraftResult
{
    const job = queue.job;
    if (!job || !queue.isReady) return { success: false, reason: 'nothing_ready' };
    if (!backpack.canAddItem(job.resultItemId, job.resultCount)) return { success: false, reason: 'backpack_full' };

    queue.collect();
    backpack.addItem(job.resultItemId, job.resultCount);
    DomainEvents.emit<CraftCollectedPayload>(CRAFT_COLLECTED_EVENT, {
        recipeId: job.recipeId,
        resultItemId: job.resultItemId,
        resultCount: job.resultCount,
    });
    return { success: true, resultItemId: job.resultItemId, resultCount: job.resultCount };
}
