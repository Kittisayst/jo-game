import { DomainEvents } from '../domain/DomainEvents';
import { Backpack, CraftingIngredient } from '../domain/entities/Backpack';
import { ToolUpgrades } from '../domain/entities/ToolUpgrades';

export const TOOL_UPGRADED_EVENT = 'tool-upgraded';

/** One step of a tool's upgrades (+1, +2, +3), from `recipes.json`. Costs Materials only, never Credit. */
export interface ToolUpgradeRecipe
{
    id: string;
    targetToolId: string;
    targetLevel: number;
    building: 'workshop';
    /** How much one Strike with the tool counts once upgraded (1 = a plain tool). */
    strikeWeight: number;
    ingredients: CraftingIngredient[];
}

export interface ToolUpgradedPayload
{
    toolId: string;
    newLevel: number;
}

export type UpgradeToolResult =
    | { success: true; newLevel: number; strikeWeight: number }
    | { success: false; reason: 'not_owned' | 'max_level' | 'no_matching_recipe' | 'insufficient_ingredients' };

/** How much one Strike with `toolId` counts: 1 for a plain tool, more at each upgrade level. */
export function toolStrikeWeight (upgrades: ToolUpgrades, recipes: readonly ToolUpgradeRecipe[], toolId: string): number
{
    const level = upgrades.getLevel(toolId);
    if (level === 0) return 1;
    return recipes.find(r => r.targetToolId === toolId && r.targetLevel === level)?.strikeWeight ?? 1;
}

/** Takes the Materials of the next level and raises the tool. Nothing is taken when anything is missing. */
export function upgradeToolUseCase (
    toolId: string,
    recipes: readonly ToolUpgradeRecipe[],
    upgrades: ToolUpgrades,
    backpack: Backpack
): UpgradeToolResult
{
    if (backpack.getItemCount(toolId) < 1) return { success: false, reason: 'not_owned' };
    if (!upgrades.canUpgrade(toolId)) return { success: false, reason: 'max_level' };

    const nextLevel = upgrades.getLevel(toolId) + 1;
    const recipe = recipes.find(r => r.targetToolId === toolId && r.targetLevel === nextLevel);
    if (!recipe) return { success: false, reason: 'no_matching_recipe' };

    if (recipe.ingredients.some(ing => backpack.getItemCount(ing.itemId) < ing.count))
    {
        return { success: false, reason: 'insufficient_ingredients' };
    }

    for (const ing of recipe.ingredients) backpack.removeItem(ing.itemId, ing.count);
    upgrades.upgrade(toolId);

    DomainEvents.emit<ToolUpgradedPayload>(TOOL_UPGRADED_EVENT, { toolId, newLevel: nextLevel });
    return { success: true, newLevel: nextLevel, strikeWeight: recipe.strikeWeight };
}
