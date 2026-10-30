import { Backpack, CraftingIngredient } from '../domain/entities/Backpack';
import { DomainEvents } from '../domain/DomainEvents';
import { ITEM_REPAIRED_EVENT } from './WearItemUseCase';

/** What repairing one kind of weapon or tool costs. Materials only: repairs never cost Credit. */
export interface RepairRecipe
{
    itemId: string;
    /** The Forge mends swords, the Workshop mends tools. */
    building: 'forge' | 'workshop';
    ingredients: CraftingIngredient[];
}

export interface ItemRepairedPayload
{
    itemId: string;
}

export interface RepairResult
{
    success: boolean;
    reason?: 'no_recipe' | 'not_in_backpack' | 'not_worn' | 'insufficient_ingredients';
}

/**
 * Gives a worn weapon or tool its full Durability back for the Materials of its repair recipe. Nothing is
 * taken when the item is missing, is not worn, or the Backpack lacks a Material.
 */
export function repairItemUseCase (
    itemId: string,
    recipes: readonly RepairRecipe[],
    backpack: Backpack
): RepairResult
{
    const recipe = recipes.find(r => r.itemId === itemId);
    if (!recipe) return { success: false, reason: 'no_recipe' };

    const reading = backpack.getDurability(itemId);
    if (!reading) return { success: false, reason: 'not_in_backpack' };
    if (reading.current >= reading.max) return { success: false, reason: 'not_worn' };

    for (const ingredient of recipe.ingredients)
    {
        if (backpack.getItemCount(ingredient.itemId) < ingredient.count)
        {
            return { success: false, reason: 'insufficient_ingredients' };
        }
    }

    for (const ingredient of recipe.ingredients)
    {
        backpack.removeItem(ingredient.itemId, ingredient.count);
    }
    backpack.restoreItem(itemId);

    DomainEvents.emit<ItemRepairedPayload>(ITEM_REPAIRED_EVENT, { itemId });
    return { success: true };
}
