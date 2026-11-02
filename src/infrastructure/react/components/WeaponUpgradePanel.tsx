import React, { useState } from 'react';
import { WeaponUpgradeRecipe, upgradeWeaponTierUseCase } from '../../../application/UpgradeWeaponTierUseCase';
import { getGameContent } from '../../content/ContentCatalog';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { ItemIcon } from './ItemIcon';

interface WeaponUpgradePanelProps
{
    onChanged: () => void;
}

/** Raises the tier of the iron and crystal swords (+1 to +3) for Materials and Credit. */
export const WeaponUpgradePanel: React.FC<WeaponUpgradePanelProps> = ({ onChanged }) =>
{
    const [upgradeRecipes] = useState<WeaponUpgradeRecipe[]>(() => getGameContent().recipes.filter(
        (r): r is WeaponUpgradeRecipe => r.building === 'forge' && 'targetWeaponId' in r
    ));
    const items = entities.itemCatalog.all();
    const getItem = (id: string) => items.find(i => i.id === id);

    const handleUpgrade = (weaponId: string) =>
    {
        const result = upgradeWeaponTierUseCase(weaponId, upgradeRecipes, entities.equipment, entities.backpack, entities.wallet);
        if (result.success)
        {
            soundManager.playPowerUp();
            onChanged();
        }
        else
        {
            soundManager.playHurt();
        }
    };

    return (
        <div className="space-y-4" data-testid="weapon-upgrades">
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
                            <ItemIcon iconImage={wItem?.iconImage} icon={wItem?.icon || '⚔️'} size={36} />
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
                                                className={`px-2 py-1 rounded border flex items-center gap-1 ${
                                                    ok ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                                }`}
                                            >
                                                <ItemIcon iconImage={itm?.iconImage} icon={itm?.icon} size={14} />
                                                <span>{itm?.name}: {count}/{ing.count}</span>
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
    );
};
