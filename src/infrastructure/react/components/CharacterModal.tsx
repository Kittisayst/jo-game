import React, { useState } from 'react';
import { allocateStatPointUseCase, resetStatsUseCase } from '../../../application/HeroStatsUseCases';
import { xpToNext } from '../../../domain/entities/HeroLevel';
import { STAT_IDS, type StatId } from '../../../domain/entities/HeroStats';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { soundManager } from '../../audio/SoundManager';

interface CharacterModalProps
{
    isOpen: boolean;
    onClose: () => void;
    /** Points were spent or taken back (so the HUD hearts and the save are refreshed). */
    onChanged: () => void;
}

const STAT_VIEW: Record<StatId, { icon: string; name: string; hint: string }> = {
    attack: { icon: '⚔️', name: 'ໂຈມຕີ (Attack)', hint: 'ດາເມດຂອງດາບ ແລະສະກິວ' },
    hearts: { icon: '❤️', name: 'ຫົວໃຈ (Hearts)', hint: 'ຫົວໃຈເພີ່ມທຸກໆ 10 ແຕ້ມ' },
    guard: { icon: '🛡️', name: 'ປ້ອງກັນ (Guard)', hint: 'ໂອກາດທີ່ການຕີບໍ່ເຮັດຫຍັງ' },
    agility: { icon: '💨', name: 'ຄວາມໄວ (Agility)', hint: 'ຄວາມໄວໃນການເດີນ' },
};

/** The Character window (C): Hero Level, XP, and the Stat points to spend. Gear stays the main source of strength. */
export const CharacterModal: React.FC<CharacterModalProps> = ({ isOpen, onClose, onChanged }) =>
{
    const [, setRevision] = useState(0);
    const [notice, setNotice] = useState<string | null>(null);

    if (!isOpen) return null;

    const { heroLevel, heroStats, health, backpack, itemCatalog } = entities;
    const { progression, statsTuning } = getGameContent();
    const isMax = heroLevel.isMaxLevel(progression);
    const needed = isMax ? 0 : xpToNext(heroLevel.level, progression);

    const effectText: Record<StatId, string> = {
        attack: `+${Math.round((heroStats.attackMultiplier(statsTuning) - 1) * 100)}% ດາເມດ`,
        hearts: `+${heroStats.bonusHearts(statsTuning)} ຫົວໃຈ (ມີ ${health.max})`,
        guard: `${Math.round(heroStats.blockChance(statsTuning) * 100)}% ກັນໄດ້`,
        agility: `+${((heroStats.speedMultiplier(statsTuning) - 1) * 100).toFixed(1)}% ຄວາມໄວ`,
    };

    const refresh = () =>
    {
        setRevision(r => r + 1);
        onChanged();
    };

    const spend = (id: StatId) =>
    {
        const result = allocateStatPointUseCase(heroLevel, heroStats, health, statsTuning, id);
        if (!result.success)
        {
            soundManager.playHurt();
            setNotice(result.reason === 'no_points' ? '⚠️ ບໍ່ມີແຕ້ມເຫຼືອ (ຂຶ້ນ Level ເພື່ອໄດ້ແຕ້ມ)' : '⚠️ Stat ນີ້ເຕັມແລ້ວ');
            return;
        }
        soundManager.playSelect();
        setNotice(null);
        refresh();
    };

    const reset = () =>
    {
        const result = resetStatsUseCase(heroLevel, heroStats, health, backpack, statsTuning);
        if (!result.success)
        {
            soundManager.playHurt();
            if (result.reason === 'nothing_spent') setNotice('ຍັງບໍ່ໄດ້ໃຊ້ແຕ້ມ');
            else
            {
                const parts = result.missing.map(m => `${itemCatalog.get(m.itemId)?.name ?? m.itemId} ອີກ ${m.count}`);
                setNotice(`⚠️ ວັດຖຸດິບບໍ່ພໍ: ຂາດ ${parts.join(', ')}`);
            }
            return;
        }
        soundManager.playPowerUp();
        setNotice(`ຄືນແຕ້ມ ${result.refunded} ແຕ້ມແລ້ວ`);
        refresh();
    };

    const costText = statsTuning.respec.ingredients.map(i => `${itemCatalog.get(i.itemId)?.name ?? i.itemId} x${i.count}`).join(', ');

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-indigo-400/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" data-testid="character-modal">
                <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-400/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">⭐</span>
                        <div>
                            <h2 className="text-xl font-bold text-indigo-200">ຕົວລະຄອນ (Character)</h2>
                            <p className="text-xs text-slate-400">XP ມາຈາກການຂ້າ monster ເທົ່ານັ້ນ. ອຸປະກອນຈາກຕຳລາບົດຍັງເປັນພະລັງຫຼັກ.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="skin-close-btn" aria-label="Close">✕</button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 space-y-4">
                    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-lg font-bold text-white" data-testid="character-level">Level {heroLevel.level} <span className="text-xs text-slate-400">/ {progression.maxLevel}</span></span>
                            <span className="text-sm text-indigo-200" data-testid="character-points">ແຕ້ມທີ່ເຫຼືອ: {heroLevel.unspentPoints}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
                            <div className="h-full bg-indigo-300" style={{ width: `${isMax ? 100 : Math.round((heroLevel.xp / needed) * 100)}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{isMax ? 'ລະດັບສູງສຸດ' : `XP ${heroLevel.xp} / ${needed}`}</p>
                    </div>

                    {notice && <p role="status" className="text-xs text-amber-300" data-testid="character-notice">{notice}</p>}

                    <div className="space-y-2">
                        {STAT_IDS.map(id =>
                        {
                            const view = STAT_VIEW[id];
                            const max = statsTuning.stats[id].maxPoints;
                            const points = heroStats.pointsIn(id);
                            const full = points >= max;
                            return (
                                <div key={id} className="flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/50 p-3" data-testid={`stat-${id}`} data-points={points}>
                                    <span className="text-2xl">{view.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-white text-sm">{view.name} <span className="text-xs text-slate-400">{points}/{max}</span></div>
                                        <div className="text-xs text-slate-400">{view.hint}</div>
                                        <div className="text-xs text-emerald-300">{effectText[id]}</div>
                                    </div>
                                    <button
                                        type="button"
                                        data-testid={`stat-${id}-add`}
                                        disabled={full || heroLevel.unspentPoints <= 0}
                                        onClick={() => spend(id)}
                                        aria-label={`+1 ${view.name}`}
                                        className="min-w-[44px] min-h-[44px] rounded-lg border border-indigo-400/60 bg-indigo-500/20 text-indigo-100 font-bold disabled:opacity-40 hover:bg-indigo-500/40"
                                    >
                                        +
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                        <span>ເລີ່ມແຕ້ມໃໝ່: {costText} (ບໍ່ໃຊ້ Credit)</span>
                        <button
                            type="button"
                            data-testid="stat-reset"
                            onClick={reset}
                            className="min-h-[44px] px-3 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 hover:border-amber-400"
                        >
                            ຣີເຊັດແຕ້ມ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
