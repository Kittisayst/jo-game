import React, { useEffect, useState } from 'react';
import { RecipeDefinition, craftRecipeUseCase } from '../../../application/CraftRecipeUseCase';
import { ItemData, loadItemsData, loadRecipesData } from '../../dataLoader';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';

interface WorkshopModalProps
{
    isOpen: boolean;
    onClose: () => void;
}

export const WorkshopModal: React.FC<WorkshopModalProps> = ({ isOpen, onClose }) =>
{
    const [recipes, setRecipes] = useState<RecipeDefinition[]>([]);
    const [items, setItems] = useState<ItemData[]>([]);
    const [, setRevision] = useState(0);

    useEffect(() =>
    {
        loadRecipesData().then(all =>
        {
            const workshopRecipes = all.filter(r => (r as RecipeDefinition).building === 'workshop') as RecipeDefinition[];
            setRecipes(workshopRecipes);
        }).catch(console.error);

        loadItemsData().then(setItems).catch(console.error);
    }, []);

    if (!isOpen) return null;

    // Gather set of unlocked recipes from passed book exams
    const unlockedRecipes = new Set<string>();
    for (const bp of Object.values(entities.books))
    {
        if (bp.examPassed)
        {
            if (bp.bookId === 'book-ch1')
            {
                unlockedRecipes.add('pickaxe-t1');
                unlockedRecipes.add('hammer-t1');
                unlockedRecipes.add('repair-kit');
                unlockedRecipes.add('iron-sword');
            }
            else if (bp.bookId === 'book-ch2')
            {
                unlockedRecipes.add('crystal-sword');
            }
        }
    }

    const getItem = (id: string) => items.find(i => i.id === id);

    const handleCraft = (recipe: RecipeDefinition) =>
    {
        const result = craftRecipeUseCase(
            recipe,
            entities.backpack,
            entities.wallet,
            unlockedRecipes
        );

        if (result.success)
        {
            soundManager.playPowerUp();
            setRevision(r => r + 1);
        }
        else
        {
            soundManager.playHurt();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🔨</span>
                        <div>
                            <h2 className="text-xl font-bold text-emerald-300">ໂຮງຊ່າງຫັດຖະກຳ (Workshop)</h2>
                            <p className="text-xs text-slate-400">ສ້າງເຄື່ອງມືເກັບກ່ຽວຊັບພະຍາກອນ ແລະ ໄອເທັມຊ່ວຍເຫຼືອ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Recipe List */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recipes.map(recipe =>
                        {
                            const resultItem = getItem(recipe.resultItemId);
                            const isLocked = recipe.requiredBookRecipe && !unlockedRecipes.has(recipe.requiredBookRecipe);
                            const canCraft = !isLocked && entities.backpack.canCraftAfterRemoving(
                                recipe.ingredients,
                                recipe.resultItemId,
                                recipe.resultCount
                            );

                            return (
                                <div
                                    key={recipe.id}
                                    className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                                        isLocked
                                            ? 'bg-slate-900/40 border-slate-800 opacity-60'
                                            : canCraft
                                                ? 'bg-slate-800/80 border-emerald-500/40 hover:border-emerald-400'
                                                : 'bg-slate-800/40 border-slate-700/60'
                                    }`}
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{resultItem?.icon || '📦'}</span>
                                                <div>
                                                    <h3 className="font-bold text-white text-base">
                                                        {resultItem?.name || recipe.resultItemId}
                                                    </h3>
                                                    <p className="text-xs text-slate-400">{resultItem?.nameEn}</p>
                                                </div>
                                            </div>

                                            {isLocked && (
                                                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
                                                    🔒 ຕ້ອງສອບເສັງບົດທີ 1
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-300">
                                            {resultItem?.description}
                                        </p>

                                        {/* Ingredients required */}
                                        <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                            <span className="text-xs text-slate-400 font-semibold block mb-1">
                                                ວັດສະດຸທີ່ຕ້ອງການ:
                                            </span>
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
                                                            <span>{ingItem?.icon}</span>
                                                            <span>{ingItem?.name}: {currentCount}/{ing.count}</span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="pt-4">
                                        <button
                                            onClick={() => handleCraft(recipe)}
                                            disabled={!canCraft}
                                            className={`w-full py-2 rounded-lg font-bold text-sm transition shadow ${
                                                canCraft
                                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {isLocked ? 'ຍັງບໍ່ທັນປົດລັອກ' : canCraft ? 'ສ້າງ (Craft)' : 'ວັດສະດຸບໍ່ພໍ ຫຼື ກະເປົາເຕັມ'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Backpack Status */}
                <div className="px-6 py-3 border-t border-slate-700/60 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
                    <span>🎒 ພື້ນທີ່ກະເປົາ: {entities.backpack.usedSlotsCount} / 20 ຊ່ອງ</span>
                    <span>🎓 ເຄຣດິດ: {entities.wallet.balance}</span>
                </div>
            </div>
        </div>
    );
};
