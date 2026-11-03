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

export interface RecipeGridProps {
    building: 'workshop' | 'forge';
    onChanged: () => void;
    selectedRecipeId?: string | null;
    onSelectRecipe?: (id: string) => void;
}

/** Left Page: List of crafting recipes with selection and quick actions */
export const RecipeListView: React.FC<{
    building: 'workshop' | 'forge';
    selectedRecipeId: string | null;
    onSelectRecipe: (id: string) => void;
    onChanged: () => void;
}> = ({ building, selectedRecipeId, onSelectRecipe, onChanged }) => {
    const recipes = useMemo<RecipeDefinition[]>(() => getGameContent().recipes.filter(
        (r): r is RecipeDefinition => r.building === building && 'resultItemId' in r
    ), [building]);
    const items = entities.itemCatalog.all();
    const unlockedRecipes = unlockedRecipeIds();
    const getItem = (id: string) => items.find(i => i.id === id);
    const isForge = building === 'forge';

    const handleCraft = (e: React.MouseEvent, recipe: RecipeDefinition) => {
        e.stopPropagation();
        const result = startCraftUseCase(recipe, entities.backpack, entities.wallet, unlockedRecipes, entities.crafting);
        if (result.success) {
            soundManager.playPowerUp();
            EventBus.emit('backpack-changed');
            onChanged();
        } else {
            soundManager.playHurt();
        }
    };

    return (
        <div className="space-y-2.5" data-testid={`recipes-${building}`}>
            <div className="flex items-center justify-between pb-1 border-b border-[#d6c7a7]/60">
                <span className="book-subheading text-xs uppercase tracking-wider">
                    {isForge ? '🗡️ ສູດຫຼອມອາວຸດ & ເກາະ' : '🔨 ສູດສ້າງເຄື່ອງມື & ຢາ'} ({recipes.length})
                </span>
                <span className="text-[11px] text-[#78350f]">ກົດເພື່ອເບິ່ງລາຍລະອຽດ</span>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {recipes.map(recipe => {
                    const resultItem = getItem(recipe.resultItemId);
                    const isLocked = recipe.requiredBookRecipe && !unlockedRecipes.has(recipe.requiredBookRecipe);
                    const seconds = craftSecondsOf(recipe);
                    const busy = seconds > 0 && entities.crafting.isBusy;
                    const canCraft = !isLocked && !busy &&
                        entities.wallet.canAfford(recipe.creditCost) &&
                        entities.backpack.canCraftAfterRemoving(recipe.ingredients, recipe.resultItemId, recipe.resultCount);
                    const isSelected = selectedRecipeId === recipe.id;

                    return (
                        <div
                            key={recipe.id}
                            onClick={() => {
                                soundManager.playSelect();
                                onSelectRecipe(recipe.id);
                            }}
                            className={`book-card cursor-pointer flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition ${
                                isSelected ? 'book-card-selected' : ''
                            } ${isLocked ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-1 rounded-lg bg-amber-950/20 border border-amber-900/30 flex-shrink-0">
                                    <ItemIcon iconImage={resultItem?.iconImage} icon={resultItem?.icon || '📦'} size={28} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="book-heading text-sm font-bold truncate">
                                        {resultItem?.name || recipe.resultItemId}
                                    </h4>
                                    <p className="text-[11px] book-text-muted truncate">
                                        {resultItem?.category === 'armor'
                                            ? `🛡️ +${resultItem.armorHearts}`
                                            : resultItem?.category === 'weapon'
                                                ? `⚔️ ATK ${resultItem.baseDamage}`
                                                : resultItem?.nameEn}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isLocked ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/20 text-amber-900 font-bold border border-amber-800/30">
                                        🔒 ຍັງບໍ່ຮຽນ
                                    </span>
                                ) : recipe.creditCost > 0 ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold border border-amber-300">
                                        {recipe.creditCost} 🎓
                                    </span>
                                ) : null}

                                <button
                                    onClick={e => handleCraft(e, recipe)}
                                    disabled={!canCraft}
                                    className={`min-h-[44px] min-w-[44px] text-xs px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm flex items-center justify-center ${
                                        canCraft
                                            ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                                            : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isLocked
                                        ? '🔒'
                                        : busy
                                            ? 'ກຳລັງສ້າງອັນອື່ນຢູ່'
                                            : canCraft
                                                ? (seconds > 0
                                                    ? `${isForge ? 'ເລີ່ມຫຼອມ' : 'ເລີ່ມສ້າງ'} (${formatCraftTime(seconds * 1000)})`
                                                    : 'ສ້າງ')
                                                : 'ບໍ່ພໍ'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/** Right Page: Minecraft Legends style item inspection and craft action */
export const RecipeInspectorView: React.FC<{
    building: 'workshop' | 'forge';
    recipe: RecipeDefinition | null;
    onChanged: () => void;
}> = ({ building, recipe, onChanged }) => {
    const items = entities.itemCatalog.all();
    const unlockedRecipes = unlockedRecipeIds();
    const getItem = (id: string) => items.find(i => i.id === id);
    const isForge = building === 'forge';

    if (!recipe) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center book-text-muted">
                <span className="text-4xl mb-2">📜</span>
                <p className="text-sm font-bold">ເລືອກສູດຄຣາຟຈາກໜ້າຊ້າຍ</p>
                <p className="text-xs">ເພື່ອເບິ່ງລາຍລະອຽດ, ວັດຖຸດິບ ແລະ ຄຸນສົມບັດ</p>
            </div>
        );
    }

    const resultItem = getItem(recipe.resultItemId);
    const isLocked = recipe.requiredBookRecipe && !unlockedRecipes.has(recipe.requiredBookRecipe);
    const seconds = craftSecondsOf(recipe);
    const busy = seconds > 0 && entities.crafting.isBusy;
    const canCraft = !isLocked && !busy &&
        entities.wallet.canAfford(recipe.creditCost) &&
        entities.backpack.canCraftAfterRemoving(recipe.ingredients, recipe.resultItemId, recipe.resultCount);
    const missing = missingIngredients(recipe.ingredients);

    const handleCraft = () => {
        const result = startCraftUseCase(recipe, entities.backpack, entities.wallet, unlockedRecipes, entities.crafting);
        if (result.success) {
            soundManager.playPowerUp();
            EventBus.emit('backpack-changed');
            onChanged();
        } else {
            soundManager.playHurt();
        }
    };

    return (
        <div className="h-full flex flex-col justify-between space-y-3">
            <div className="space-y-3">
                {/* Large Item Banner */}
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-amber-950/10 border border-[#d6c7a7]">
                    <div className="p-2 rounded-xl bg-[#2b1810] border-2 border-[#ca8a04] shadow-md flex-shrink-0">
                        <ItemIcon iconImage={resultItem?.iconImage} icon={resultItem?.icon || '📦'} size={52} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="book-heading text-lg font-bold truncate">
                                {resultItem?.name || recipe.resultItemId}
                            </h3>
                            {isLocked ? (
                                <span className="book-badge">🔒 ຍັງບໍ່ໄດ້ຮຽນ</span>
                            ) : recipe.creditCost > 0 ? (
                                <span className="book-badge">🎓 {recipe.creditCost} Credit</span>
                            ) : null}
                        </div>
                        <p className="text-xs book-subheading">{resultItem?.nameEn}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {resultItem?.category === 'armor' && (
                                <span className="text-xs font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                                    🛡️ ເກາະປ້ອງກັນ +{resultItem.armorHearts}
                                </span>
                            )}
                            {resultItem?.category === 'weapon' && (
                                <span className="text-xs font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                                    ⚔️ ພະລັງໂຈມຕີ ATK {resultItem.baseDamage}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lore / Description */}
                {resultItem?.description && (
                    <p className="book-text text-xs italic px-1">
                        "{resultItem.description}"
                    </p>
                )}

                <div className="book-filigree-divider" />

                {/* Required Ingredients Checklist (Minecraft Legends style) */}
                <div className="space-y-1.5">
                    <span className="book-subheading text-xs uppercase tracking-wide block">
                        📦 ວັດຖຸດິບທີ່ຕ້ອງການ (Required Materials):
                    </span>

                    <div className="space-y-1.5">
                        {recipe.ingredients.map(ing => {
                            const ingItem = getItem(ing.itemId);
                            const count = entities.backpack.getItemCount(ing.itemId);
                            const hasEnough = count >= ing.count;

                            return (
                                <div
                                    key={ing.itemId}
                                    className={`book-ingredient-row ${
                                        hasEnough ? 'book-ingredient-ok' : 'book-ingredient-missing'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <ItemIcon iconImage={ingItem?.iconImage} icon={ingItem?.icon} size={20} />
                                        <span className="font-medium text-xs">{ingItem?.name || ing.itemId}</span>
                                    </div>
                                    <span className="font-mono font-bold text-xs">
                                        {count} / {ing.count} {hasEnough ? '✅' : '❌'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {!isLocked && !canCraft && missing.length > 0 && (
                        <p className="text-xs text-rose-700 font-semibold pt-1" data-testid="missing-ingredients">
                            ຂາດ: {missing.map(m => `${getItem(m.itemId)?.name ?? m.itemId} ອີກ ${m.missing}`).join(', ')}
                        </p>
                    )}
                </div>
            </div>

            {/* Giant Craft Button */}
            <div className="pt-2">
                <button
                    onClick={handleCraft}
                    disabled={!canCraft}
                    className="book-btn-craft w-full"
                >
                    <span>{isForge ? '🔨' : '⚒️'}</span>
                    <span>
                        {isLocked
                            ? 'ຍັງບໍ່ທັນປົດລັອກ'
                            : busy
                                ? 'ກຳລັງສ້າງອັນອື່ນຢູ່'
                                : canCraft
                                    ? (seconds > 0
                                        ? `${isForge ? 'ເລີ່ມຫຼອມ' : 'ເລີ່ມສ້າງ'} (${formatCraftTime(seconds * 1000)})`
                                        : (isForge ? 'ຫຼອມອາວຸດ (Craft)' : 'ສ້າງ (Craft)'))
                                    : 'ວັດສະດຸ ຫຼື ເຄຣດິດບໍ່ພໍ'}
                    </span>
                </button>
            </div>
        </div>
    );
};

/** Default unified RecipeGrid component for backward compatibility */
export const RecipeGrid: React.FC<RecipeGridProps> = ({
    building,
    onChanged,
    selectedRecipeId,
    onSelectRecipe,
}) => {
    const recipes = useMemo<RecipeDefinition[]>(() => getGameContent().recipes.filter(
        (r): r is RecipeDefinition => r.building === building && 'resultItemId' in r
    ), [building]);
    const [localSelectedId, setLocalSelectedId] = React.useState<string | null>(recipes[0]?.id || null);

    const activeId = selectedRecipeId !== undefined ? selectedRecipeId : localSelectedId;
    const setActiveId = onSelectRecipe || setLocalSelectedId;
    const activeRecipe = recipes.find(r => r.id === activeId) || recipes[0] || null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <RecipeListView
                building={building}
                selectedRecipeId={activeId}
                onSelectRecipe={setActiveId}
                onChanged={onChanged}
            />
            <div className="p-3 rounded-xl bg-amber-900/10 border border-[#d6c7a7]/80">
                <RecipeInspectorView
                    building={building}
                    recipe={activeRecipe}
                    onChanged={onChanged}
                />
            </div>
        </div>
    );
};
