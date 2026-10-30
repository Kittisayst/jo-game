import React from 'react';
import { plantSeedUseCase } from '../../../application/GardenUseCases';
import { clock, entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { ItemIcon } from './ItemIcon';

interface GardenSeedPickerProps
{
    isOpen: boolean;
    /** The empty Plot the hero is standing at, counted from 0. */
    plotIndex: number | null;
    onClose: () => void;
    /** A Seed was planted (so the HUD and the save are refreshed). */
    onPlanted: () => void;
}

/** What to plant in the Plot the hero pressed E at in the Garden. The Plots themselves are in the game world. */
export const GardenSeedPicker: React.FC<GardenSeedPickerProps> = ({ isOpen, plotIndex, onClose, onPlanted }) =>
{
    if (!isOpen || plotIndex === null) return null;

    const { garden, backpack, itemCatalog } = entities;
    const getItem = (id: string) => itemCatalog.get(id);
    const seeds = itemCatalog.all().filter(item => item.plant && backpack.getItemCount(item.id) > 0);

    const plant = (seedItemId: string) =>
    {
        const result = plantSeedUseCase(plotIndex, seedItemId, garden, backpack, itemCatalog, clock);
        if (!result.success)
        {
            soundManager.playHurt();
            return;
        }
        soundManager.playPowerUp();
        onPlanted();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 animate-fade-in">
            <div
                className="relative w-full max-w-lg rounded-2xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                data-testid="seed-picker"
            >
                <div className="flex items-center justify-between px-5 py-3 border-b border-emerald-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🌱</span>
                        <h2 className="text-lg font-bold text-emerald-300">ເລືອກເມັດທີ່ຈະປູກໃນແປງ {plotIndex + 1}</h2>
                    </div>
                    <button type="button" onClick={onClose} className="skin-close-btn" aria-label="Close">✕</button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-2">
                    {seeds.length === 0 ? (
                        <p className="text-xs text-slate-400">ຍັງບໍ່ມີເມັດໃນກະເປົາ. ເກັບສະໝຸນໄພ, ຫຍ້າເສັ້ນໃຍ ຫຼືຕັດຕົ້ນໄມ້ໃນດ່ານເພື່ອໄດ້ເມັດ.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {seeds.map(seed => (
                                <button
                                    key={seed.id}
                                    type="button"
                                    data-testid={`seed-${seed.id}`}
                                    onClick={() => plant(seed.id)}
                                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-white flex items-center gap-2 text-left"
                                >
                                    <ItemIcon iconImage={seed.iconImage} icon={seed.icon} size={20} />
                                    <span>{seed.name} ×{backpack.getItemCount(seed.id)}</span>
                                    <span className="text-slate-400">
                                        ({seed.plant!.minutes} ນາທີ ➜ {seed.plant!.harvest.map(d => `${getItem(d.itemId)?.name ?? d.itemId} ×${d.count}`).join(', ')})
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
