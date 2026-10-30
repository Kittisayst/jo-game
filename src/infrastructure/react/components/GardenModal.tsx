import React, { useEffect, useState } from 'react';
import {
    expandGardenUseCase, growMinutesOf, harvestPlotUseCase, nextPlotCost, plantSeedUseCase,
} from '../../../application/GardenUseCases';
import { clock, entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { soundManager } from '../../audio/SoundManager';
import { ItemIcon } from './ItemIcon';

interface GardenModalProps
{
    isOpen: boolean;
    onClose: () => void;
    /** Something in the Garden or the Backpack changed (so the HUD and the save are refreshed). */
    onChanged: (change: 'planted' | 'harvested' | 'expanded') => void;
}

const formatTime = (ms: number): string =>
{
    const seconds = Math.max(1, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/** The Garden of the Village Hub: Plots where Seeds are planted, grow in real time and are harvested. No watering. */
export const GardenModal: React.FC<GardenModalProps> = ({ isOpen, onClose, onChanged }) =>
{
    const [, setTick] = useState(0);
    const [pickerPlot, setPickerPlot] = useState<number | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    // The time left on each Plot counts down on screen
    useEffect(() =>
    {
        if (!isOpen) return;
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    const { garden, backpack, itemCatalog } = entities;
    const getItem = (id: string) => itemCatalog.get(id);
    const minutesOf = growMinutesOf(itemCatalog);
    const now = clock.now();
    const seeds = itemCatalog.all().filter(item => item.plant && backpack.getItemCount(item.id) > 0);
    const expansionCost = nextPlotCost(garden, getGameContent().gardenExpansions);
    const canExpand = expansionCost !== null && expansionCost.every(ing => backpack.getItemCount(ing.itemId) >= ing.count);

    const refresh = (change: 'planted' | 'harvested' | 'expanded') =>
    {
        setNotice(null);
        setPickerPlot(null);
        setTick(t => t + 1);
        onChanged(change);
    };

    const plant = (plotIndex: number, seedItemId: string) =>
    {
        const result = plantSeedUseCase(plotIndex, seedItemId, garden, backpack, itemCatalog, clock);
        if (!result.success)
        {
            soundManager.playHurt();
            return;
        }
        soundManager.playPowerUp();
        refresh('planted');
    };

    const harvest = (plotIndex: number) =>
    {
        const result = harvestPlotUseCase(plotIndex, garden, backpack, itemCatalog, clock);
        if (!result.success)
        {
            soundManager.playHurt();
            if (result.reason === 'backpack_full') setNotice('⚠️ ກະເປົາເຕັມ ເກັບຜົນບໍ່ໄດ້ (ຜົນຍັງຢູ່ໃນແປງ)');
            return;
        }
        soundManager.playCoin();
        refresh('harvested');
    };

    const expand = () =>
    {
        const result = expandGardenUseCase(garden, backpack, getGameContent().gardenExpansions);
        if (!result.success)
        {
            soundManager.playHurt();
            return;
        }
        soundManager.playPowerUp();
        refresh('expanded');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 border-2 border-emerald-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" data-testid="garden-modal">
                <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🌱</span>
                        <div>
                            <h2 className="text-xl font-bold text-emerald-300">ສວນຜັກ (Garden)</h2>
                            <p className="text-xs text-slate-400">ປູກເມັດ ລໍເວລາ ແລ້ວເກັບຜົນ — ບໍ່ຕ້ອງຫົດນ້ຳ. ເມັດໄດ້ຈາກພືດໃນດ່ານ.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="skin-close-btn" aria-label="Close">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {notice && <p role="status" className="text-xs text-amber-300">{notice}</p>}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Array.from({ length: garden.plotCount }, (_, index) =>
                        {
                            const status = garden.statusOf(index, now, minutesOf);
                            const seedDef = status.state === 'empty' ? undefined : getItem(status.seedItemId);
                            const harvestPreview = status.state === 'empty' ? [] : seedDef?.plant?.harvest ?? [];

                            return (
                                <div
                                    key={index}
                                    data-testid={`plot-${index}`}
                                    data-state={status.state}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 min-h-[132px] justify-between ${
                                        status.state === 'ready'
                                            ? 'bg-emerald-900/50 border-emerald-400'
                                            : status.state === 'growing'
                                                ? 'bg-slate-800/70 border-slate-600'
                                                : 'bg-amber-950/30 border-amber-900/60'
                                    }`}
                                >
                                    <span className="text-[10px] uppercase tracking-wide text-slate-400">ແປງ {index + 1}</span>

                                    {status.state === 'empty' && (
                                        <>
                                            <span className="text-2xl opacity-60">🟫</span>
                                            <button
                                                type="button"
                                                data-testid={`plant-${index}`}
                                                onClick={() => setPickerPlot(pickerPlot === index ? null : index)}
                                                className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                                            >
                                                ປູກເມັດ
                                            </button>
                                        </>
                                    )}

                                    {status.state === 'growing' && seedDef && (
                                        <>
                                            <ItemIcon iconImage={seedDef.iconImage} icon="🌱" size={28} />
                                            <span className="text-xs text-slate-300">{seedDef.name}</span>
                                            <span className="text-xs text-amber-300 font-mono" data-testid={`plot-time-${index}`}>
                                                🌱 ໃຫຍ່ໃນ {formatTime(status.remainingMs)}
                                            </span>
                                        </>
                                    )}

                                    {status.state === 'ready' && (
                                        <>
                                            <span className="text-2xl">🌿</span>
                                            <span className="text-xs text-emerald-300 font-bold">
                                                ✅ ພ້ອມເກັບ: {harvestPreview.map(d => `${getItem(d.itemId)?.name ?? d.itemId} ×${d.count}`).join(', ')}
                                            </span>
                                            <button
                                                type="button"
                                                data-testid={`harvest-${index}`}
                                                onClick={() => harvest(index)}
                                                className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
                                            >
                                                ເກັບຜົນ
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {pickerPlot !== null && (
                        <div className="rounded-xl border border-emerald-500/40 bg-slate-900/80 p-4 space-y-2" data-testid="seed-picker">
                            <h3 className="text-sm font-bold text-emerald-300">ເລືອກເມັດທີ່ຈະປູກໃນແປງ {pickerPlot + 1}</h3>
                            {seeds.length === 0 ? (
                                <p className="text-xs text-slate-400">ຍັງບໍ່ມີເມັດໃນກະເປົາ. ເກັບສະໝຸນໄພ, ຫຍ້າເສັ້ນໃຍ ຫຼືຕັດຕົ້ນໄມ້ໃນດ່ານເພື່ອໄດ້ເມັດ.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {seeds.map(seed => (
                                        <button
                                            key={seed.id}
                                            type="button"
                                            data-testid={`seed-${seed.id}`}
                                            onClick={() => plant(pickerPlot, seed.id)}
                                            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-white flex items-center gap-2"
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
                    )}

                    {/* More Plots, for Materials: never Credit */}
                    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
                        {expansionCost === null ? (
                            <span className="text-xs text-slate-400">ສວນໃຫຍ່ສຸດແລ້ວ ({garden.plotCount} ແປງ)</span>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-slate-300">ຂະຫຍາຍເປັນ {garden.plotCount + 1} ແປງ:</span>
                                    {expansionCost.map(ing =>
                                    {
                                        const have = backpack.getItemCount(ing.itemId);
                                        const item = getItem(ing.itemId);
                                        return (
                                            <span
                                                key={ing.itemId}
                                                className={`px-2 py-1 rounded border flex items-center gap-1 ${
                                                    have >= ing.count ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                                }`}
                                            >
                                                <ItemIcon iconImage={item?.iconImage} icon={item?.icon} size={14} />
                                                {item?.name}: {have}/{ing.count}
                                            </span>
                                        );
                                    })}
                                </div>
                                <button
                                    type="button"
                                    data-testid="expand-garden"
                                    onClick={expand}
                                    disabled={!canExpand}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold ${canExpand ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                >
                                    ຂະຫຍາຍສວນ
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
