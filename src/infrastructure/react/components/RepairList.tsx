import React, { useState } from 'react';
import { repairItemUseCase } from '../../../application/RepairItemUseCase';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { soundManager } from '../../audio/SoundManager';
import { DurabilityBar } from './DurabilityBar';
import { ItemIcon } from './ItemIcon';

interface RepairListProps
{
    /** Which building's repairs to show: the Forge mends swords, the Workshop mends tools. */
    building: 'forge' | 'workshop';
}

/** The weapons or tools the player carries that this building can repair, with what it costs (Materials, never Credit). */
export const RepairList: React.FC<RepairListProps> = ({ building }) =>
{
    const [recipes] = useState(() => getGameContent().repairs.filter(r => r.building === building));
    const [, setRevision] = useState(0);
    const getItem = (id: string) => entities.itemCatalog.get(id);

    const carried = recipes.filter(r => entities.backpack.getDurability(r.itemId) !== null);

    const handleRepair = (itemId: string) =>
    {
        const result = repairItemUseCase(itemId, recipes, entities.backpack);
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
        <div className="space-y-4" data-testid={`${building}-repair-list`}>
            {carried.length === 0 && (
                <p className="text-sm text-slate-400">ຍັງບໍ່ມີອາວຸດ ຫຼື ເຄື່ອງມືທີ່ສ້ອມໄດ້ທີ່ນີ້ໃນກະເປົາ.</p>
            )}
            {carried.map(recipe =>
            {
                const reading = entities.backpack.getDurability(recipe.itemId)!;
                const item = getItem(recipe.itemId);
                const isWorn = reading.current < reading.max;
                const hasIngredients = recipe.ingredients.every(ing => entities.backpack.getItemCount(ing.itemId) >= ing.count);
                const canRepair = isWorn && hasIngredients;

                return (
                    <div
                        key={recipe.itemId}
                        data-testid="repair-row"
                        className="p-5 rounded-xl border bg-slate-800/80 border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3 md:w-1/3">
                            <ItemIcon iconImage={item?.iconImage} icon={item?.icon || '🛠️'} size={36} />
                            <div className="w-full">
                                <h4 className="font-bold text-white text-base">{item?.name}</h4>
                                <DurabilityBar reading={reading} />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <div className="flex flex-wrap gap-2 text-xs">
                                {recipe.ingredients.map(ing =>
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
                                data-testid="repair-button"
                                onClick={() => handleRepair(recipe.itemId)}
                                disabled={!canRepair}
                                className={`px-4 py-2 rounded-lg font-bold text-xs transition shadow ${
                                    canRepair
                                        ? 'bg-orange-600 hover:bg-orange-500 text-white'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                            >
                                {isWorn ? 'ສ້ອມແປງ' : 'ບໍ່ຕ້ອງສ້ອມ'}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
