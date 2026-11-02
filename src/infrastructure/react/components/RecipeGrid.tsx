import React, { useMemo } from 'react';
import type { RecipeDefinition } from '../../../application/CraftRecipeUseCase';
import { craftSecondsOf, startCraftUseCase } from '../../../application/CraftingJobUseCases';
import { getGameContent } from '../../content/ContentCatalog';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { ItemIcon } from './ItemIcon';
import { formatCraftTime } from '../formatCraftTime';
import { EventBus } from '../../EventBus';
import { missingIngredients, unlockedRecipeIds } from '../recipeUnlocks';

interface RecipeGridProps
{
    /** Which recipes of `recipes.json` this grid lists: the tool bench or the forge. */
    building: 'workshop' | 'forge';
    onChanged: () => void;
}

/** The recipes a building makes: ingredients, the Credit some of them ask for, and the Craft button. */
export const RecipeGrid: React.FC<RecipeGridProps> = ({ building, onChanged }) =>
{
    // Recomputed when the tab changes: the same grid is reused for the Workshop and the Forge
    const recipes = useMemo<RecipeDefinition[]>(() => getGameContent().recipes.filter(
        (r): r is RecipeDefinition => r.building === building && 'resultItemId' in r
    ), [building]);
    const items = entities.itemCatalog.all();
    const unlockedRecipes = unlockedRecipeIds();
    const getItem = (id: string) => items.find(i => i.id === id);
    const isForge = building === 'forge';

    const handleCraft = (recipe: RecipeDefinition) =>
    {
        const result = startCraftUseCase(recipe, entities.backpack, entities.wallet, unlockedRecipes, entities.crafting);
        if (result.success)
        {
            soundManager.playPowerUp();
            EventBus.emit('backpack-changed');
            onChanged();
        }
        else
        {
            soundManager.playHurt();
        }
    };

    return (
        <div className="gw-grid grid grid-cols-1 md:grid-cols-2 gap-4" data-testid={`recipes-${building}`}>
            {recipes.map(recipe =>
            {
                const resultItem = getItem(recipe.resultItemId);
                const isLocked = recipe.requiredBookRecipe && !unlockedRecipes.has(recipe.requiredBookRecipe);
                const seconds = craftSecondsOf(recipe);
                const busy = seconds > 0 && entities.crafting.isBusy;
                const canCraft = !isLocked && !busy &&
                    entities.wallet.canAfford(recipe.creditCost) &&
                    entities.backpack.canCraftAfterRemoving(recipe.ingredients, recipe.resultItemId, recipe.resultCount);
                const missing = missingIngredients(recipe.ingredients);
                const cardClass = isLocked
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : canCraft
                        ? (isForge ? 'bg-slate-800/80 border-orange-500/50' : 'bg-slate-800/80 border-emerald-500/40 hover:border-emerald-400')
                        : 'bg-slate-800/40 border-slate-700/60';
                const buttonClass = canCraft
                    ? (isForge ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white')
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed';

                return (
                    <div
                        key={recipe.id}
                        className={`gw-card p-4 rounded-xl border flex flex-col justify-between transition ${cardClass}`}
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <ItemIcon iconImage={resultItem?.iconImage} icon={resultItem?.icon || '📦'} size={32} />
                                    <div>
                                        <h3 className="font-bold text-white text-base">{resultItem?.name || recipe.resultItemId}</h3>
                                        <p className="text-xs text-slate-400">
                                            {resultItem?.category === 'armor'
                                                ? `🛡️ +${resultItem.armorHearts}`
                                                : resultItem?.category === 'weapon' ? `ATK ${resultItem.baseDamage}` : resultItem?.nameEn}
                                        </p>
                                    </div>
                                </div>
                                {isLocked && (
                                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                                        🔒 ຍັງບໍ່ໄດ້ຮຽນ
                                    </span>
                                )}
                                {!isLocked && recipe.creditCost > 0 && (
                                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                                        {recipe.creditCost} 🎓 Credit
                                    </span>
                                )}
                            </div>

                            <p className="gw-card-desc text-xs text-slate-300">{resultItem?.description}</p>

                            {!isLocked && !canCraft && missing.length > 0 && (
                                <p className="text-xs text-rose-300" data-testid="missing-ingredients">
                                    ຂາດ: {missing.map(m => `${getItem(m.itemId)?.name ?? m.itemId} ອີກ ${m.missing}`).join(', ')}
                                </p>
                            )}

                            <div className="gw-ingredients space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                <span className="text-xs text-slate-400 font-semibold block mb-1">ວັດສະດຸທີ່ຕ້ອງການ:</span>
                                <div className="flex flex-wrap gap-2">
                                    {recipe.ingredients.map(ing =>
                                    {
                                        const ingItem = getItem(ing.itemId);
                                        const currentCount = entities.backpack.getItemCount(ing.itemId);
                                        const hasEnough = currentCount >= ing.count;
                                        return (
                                            <span
                                                key={ing.itemId}
                                                className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 font-mono ${
                                                    hasEnough
                                                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                                }`}
                                            >
                                                <ItemIcon iconImage={ingItem?.iconImage} icon={ingItem?.icon} size={16} />
                                                <span>{ingItem?.name}: {currentCount}/{ing.count}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => handleCraft(recipe)}
                                disabled={!canCraft}
                                className={`w-full py-2 rounded-lg font-bold text-sm transition shadow ${buttonClass}`}
                            >
                                {isLocked
                                    ? 'ຍັງບໍ່ທັນປົດລັອກ'
                                    : busy
                                        ? 'ກຳລັງສ້າງອັນອື່ນຢູ່'
                                        : canCraft
                                            ? (seconds > 0
                                                ? `${isForge ? 'ເລີ່ມຫຼອມ' : 'ເລີ່ມສ້າງ'} (${formatCraftTime(seconds * 1000)})`
                                                : (isForge ? 'ຫຼອມອາວຸດ (Craft)' : 'ສ້າງ (Craft)'))
                                            : 'ວັດສະດຸ ຫຼື ເຄຣດິດບໍ່ພໍ'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
