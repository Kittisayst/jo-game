import React, { useEffect, useState } from 'react';
import { collectCraftUseCase } from '../../../application/CraftingJobUseCases';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { ItemIcon } from './ItemIcon';
import { formatCraftTime } from '../formatCraftTime';

/**
 * What the Workshop and the Forge are making right now: a bar while it is being built (it counts Game time, so
 * it only moves while playing), and a button to collect it when it is done. One job at a time.
 */
export const CraftingStatus: React.FC<{ onCollected?: () => void }> = ({ onCollected }) =>
{
    const [, setTick] = useState(0);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() =>
    {
        const timer = setInterval(() => setTick(t => t + 1), 500);
        return () => clearInterval(timer);
    }, []);

    const job = entities.crafting.job;
    if (!job) return null;

    const item = entities.itemCatalog.get(job.resultItemId);
    const ready = entities.crafting.isReady;
    const progress = Math.round((1 - job.remainingMs / job.totalMs) * 100);

    const collect = () =>
    {
        const result = collectCraftUseCase(entities.crafting, entities.backpack);
        if (!result.success)
        {
            soundManager.playHurt();
            setNotice('⚠️ ກະເປົາເຕັມ ເກັບຂອງບໍ່ໄດ້');
            return;
        }
        soundManager.playPowerUp();
        setNotice(null);
        EventBus.emit('backpack-changed');
        onCollected?.();
    };

    return (
        <div
            className={`rounded-xl border p-3 flex items-center gap-3 ${ready ? 'bg-emerald-950/40 border-emerald-400' : 'bg-slate-900/60 border-slate-600'}`}
            data-testid="crafting-status"
            data-state={ready ? 'ready' : 'building'}
        >
            <ItemIcon iconImage={item?.iconImage} icon={item?.icon} size={28} />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">
                    {ready ? `✅ ${item?.name ?? job.resultItemId} ສ້າງສຳເລັດ` : `🔨 ກຳລັງສ້າງ ${item?.name ?? job.resultItemId}`}
                </div>
                {!ready && (
                    <div className="mt-1">
                        <div className="h-2 rounded bg-slate-800 overflow-hidden">
                            <div className="h-2 bg-emerald-500" style={{ width: `${progress}%` }} data-testid="crafting-progress" />
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-mono" data-testid="crafting-time">
                            ເຫຼືອ {formatCraftTime(job.remainingMs)} (ນັບເວລາເກມ: ເດີນຕອນຫຼິ້ນເທົ່ານັ້ນ)
                        </div>
                    </div>
                )}
                {notice && <div role="status" className="text-xs text-amber-300 mt-1">{notice}</div>}
            </div>
            {ready && (
                <button
                    type="button"
                    onClick={collect}
                    data-testid="crafting-collect"
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
                >
                    ຮັບຂອງ
                </button>
            )}
        </div>
    );
};
