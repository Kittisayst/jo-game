import React, { useState } from 'react';
import { RecipeDefinition, craftRecipeUseCase } from '../../../application/CraftRecipeUseCase';
import { WeaponUpgradeRecipe, upgradeWeaponTierUseCase } from '../../../application/UpgradeWeaponTierUseCase';
import { getGameContent } from '../../content/ContentCatalog';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';

interface ForgeModalProps
{
    isOpen: boolean;
    onClose: () => void;
}

export const ForgeModal: React.FC<ForgeModalProps> = ({ isOpen, onClose }) =>
{
    const [activeTab, setActiveTab] = useState<'craft' | 'upgrade'>('craft');
    const [craftRecipes] = useState<RecipeDefinition[]>(() => getGameContent().recipes.filter(
        (r): r is RecipeDefinition => r.building === 'forge' && 'resultItemId' in r
    ));
    const [upgradeRecipes] = useState<WeaponUpgradeRecipe[]>(() => getGameContent().recipes.filter(
        (r): r is WeaponUpgradeRecipe => r.building === 'forge' && 'targetWeaponId' in r
    ));
    const items = entities.itemCatalog.all();
    const [, setRevision] = useState(0);

    if (!isOpen) return null;

    const isForgeUnlocked = entities.forgeUnlocked || entities.books['book-ch1']?.examPassed;

    // Gather unlocked recipes
    const unlockedRecipes = new Set<string>();
    for (const bp of Object.values(entities.books))
    {
        if (bp.examPassed)
        {
            if (bp.bookId === 'book-ch1') unlockedRecipes.add('iron-sword');
            if (bp.bookId === 'book-ch2') unlockedRecipes.add('crystal-sword');
        }
    }

    const getItem = (id: string) => items.find(i => i.id === id);

    const handleCraft = (recipe: RecipeDefinition) =>
    {
        const result = craftRecipeUseCase(recipe, entities.backpack, entities.wallet, unlockedRecipes);
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

    const handleUpgrade = (weaponId: string) =>
    {
        const result = upgradeWeaponTierUseCase(weaponId, upgradeRecipes, entities.equipment, entities.backpack, entities.wallet);
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
            <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-orange-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⚔️</span>
                        <div>
                            <h2 className="text-xl font-bold text-orange-300">ໂຮງຕີເຫຼັກພະລັງງານ (The Forge)</h2>
                            <p className="text-xs text-slate-400">ຫຼອມ ແລະ ອັບເກຣດລະດັບອາວຸດເພື່ອເພີ່ມພະລັງໂຈມຕີ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                    >
                        ✕
                    </button>
                </div>

                {!isForgeUnlocked ? (
                    /* Locked Overlay */
                    <div className="p-12 text-center space-y-4">
                        <span className="text-6xl">🔒</span>
                        <h3 className="text-2xl font-bold text-slate-200">ໂຮງຕີເຫຼັກຍັງບໍ່ທັນເປີດໃຊ້ງານ</h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            ຊ່າງຕີເຫຼັກຕ້ອງການນັກຮົບທີ່ມີພື້ນຖານຄວາມຮູ້! ທ່ານຕ້ອງສອບເສັງຜ່ານ <span className="text-amber-400 font-bold">ບົດທີ 1</span> ທີ່ສະຖາບັນກ່ອນ ຈຶ່ງຈະສາມາດເຂົ້ານຳໃຊ້ໂຮງຕີເຫຼັກໄດ້.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition"
                        >
                            ເຂົ້າໃຈແລ້ວ
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-4 px-6 pt-3 border-b border-slate-700/60 bg-slate-900/40">
                            <button
                                onClick={() => setActiveTab('craft')}
                                className={`pb-2.5 font-bold text-sm transition flex items-center gap-2 border-b-2 ${
                                    activeTab === 'craft'
                                        ? 'border-orange-400 text-orange-300'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <span>🗡️</span>
                                <span>ຫຼອມອາວຸດໃໝ່ (Craft Weapons)</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('upgrade')}
                                className={`pb-2.5 font-bold text-sm transition flex items-center gap-2 border-b-2 ${
                                    activeTab === 'upgrade'
                                        ? 'border-orange-400 text-orange-300'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <span>✨</span>
                                <span>ອັບເກຣດຂັ້ນອາວຸດ (Upgrade Tier +1..+3)</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {activeTab === 'craft' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {craftRecipes.map(recipe =>
                                    {
                                        const resultItem = getItem(recipe.resultItemId);
                                        const isLocked = recipe.requiredBookRecipe && !unlockedRecipes.has(recipe.requiredBookRecipe);
                                        const canCraft = !isLocked &&
                                            entities.wallet.canAfford(recipe.creditCost) &&
                                            entities.backpack.canCraftAfterRemoving(
                                                recipe.ingredients,
                                                recipe.resultItemId,
                                                recipe.resultCount
                                            );

                                        return (
                                            <div
                                                key={recipe.id}
                                                className="p-4 rounded-xl border bg-slate-800/80 border-slate-700/80 flex flex-col justify-between space-y-3"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">{resultItem?.icon || '⚔️'}</span>
                                                            <div>
                                                                <h4 className="font-bold text-white">{resultItem?.name}</h4>
                                                                <span className="text-xs text-orange-400 font-semibold">
                                                                    ATK {resultItem?.baseDamage}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
                                                            {recipe.creditCost} 🎓 Credit
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-300 mt-2">{resultItem?.description}</p>

                                                    {/* Ingredients */}
                                                    <div className="mt-3 space-y-1 bg-slate-900/60 p-2 rounded-lg text-xs">
                                                        <span className="text-slate-400 block mb-1">ວັດສະດຸທີ່ຕ້ອງການ:</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {recipe.ingredients.map(ing =>
                                                            {
                                                                const count = entities.backpack.getItemCount(ing.itemId);
                                                                const ok = count >= ing.count;
                                                                const itm = getItem(ing.itemId);
                                                                return (
                                                                    <span
                                                                        key={ing.itemId}
                                                                        className={`px-1.5 py-0.5 rounded border text-xs ${
                                                                            ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                                                        }`}
                                                                    >
                                                                        {itm?.name}: {count}/{ing.count}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleCraft(recipe)}
                                                    disabled={!canCraft}
                                                    className={`w-full py-2 rounded-lg font-bold text-sm transition ${
                                                        canCraft
                                                            ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-md'
                                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {isLocked ? 'ຍັງບໍ່ທັນປົດລັອກ' : canCraft ? 'ຫຼອມອາວຸດ (Craft)' : 'ວັດສະດຸ ຫຼື ເຄຣດິດບໍ່ພໍ'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Upgrade Tab */
                                <div className="space-y-4">
                                    {['iron-sword', 'crystal-sword'].map(weaponId =>
                                    {
                                        const currentLevel = entities.equipment.getUpgradeLevel(weaponId);
                                        const currentDmg = entities.equipment.getWeaponDamage(weaponId);
                                        const nextLevel = currentLevel + 1;
                                        const nextRecipe = upgradeRecipes.find(r => r.targetWeaponId === weaponId && r.targetLevel === nextLevel);
                                        const wItem = getItem(weaponId);
                                        const canUpgrade = entities.equipment.canUpgradeWeapon(weaponId);

                                        const hasCredit = nextRecipe ? entities.wallet.canAfford(nextRecipe.creditCost) : false;
                                        const hasIngredients = nextRecipe
                                            ? nextRecipe.ingredients.every(ing => entities.backpack.getItemCount(ing.itemId) >= ing.count)
                                            : false;

                                        return (
                                            <div
                                                key={weaponId}
                                                className="p-5 rounded-xl border bg-slate-800/80 border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">{wItem?.icon || '⚔️'}</span>
                                                    <div>
                                                        <h4 className="font-bold text-white text-base">
                                                            {wItem?.name} {currentLevel > 0 ? `+${currentLevel}` : ''}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                                                            <span>ພະລັງໂຈມຕີ: <b className="text-orange-400">{currentDmg}</b></span>
                                                            {canUpgrade && nextRecipe && (
                                                                <>
                                                                    <span>➔</span>
                                                                    <span className="text-emerald-400 font-bold">
                                                                        {currentDmg + nextRecipe.bonusDamage} (+{nextRecipe.bonusDamage})
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {canUpgrade && nextRecipe ? (
                                                    <div className="flex flex-col md:flex-row items-center gap-3">
                                                        <div className="flex flex-wrap gap-2 text-xs">
                                                            <span className={`px-2 py-1 rounded border ${
                                                                hasCredit ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                                            }`}>
                                                                {nextRecipe.creditCost} 🎓 Credit
                                                            </span>
                                                            {nextRecipe.ingredients.map(ing =>
                                                            {
                                                                const count = entities.backpack.getItemCount(ing.itemId);
                                                                const ok = count >= ing.count;
                                                                const itm = getItem(ing.itemId);
                                                                return (
                                                                    <span
                                                                        key={ing.itemId}
                                                                        className={`px-2 py-1 rounded border ${
                                                                            ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                                                        }`}
                                                                    >
                                                                        {itm?.name}: {count}/{ing.count}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>

                                                        <button
                                                            onClick={() => handleUpgrade(weaponId)}
                                                            disabled={!hasCredit || !hasIngredients}
                                                            className={`px-4 py-2 rounded-lg font-bold text-xs transition shadow ${
                                                                hasCredit && hasIngredients
                                                                    ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            ອັບເກຣດເປັນ +{nextLevel}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700">
                                                        ອັບເກຣດເຕັມແລ້ວ (+3 MAX)
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-slate-700/60 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
                            <span>⚔️ ອາວຸດທີ່ຕິດຕັ້ງ: {entities.equipment.equippedWeaponId} (ATK: {entities.equipment.currentAttackPower})</span>
                            <span>🎓 ເຄຣດິດ: {entities.wallet.balance}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
