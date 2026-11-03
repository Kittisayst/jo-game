import React, { useState } from 'react';
import { allocateStatPointUseCase, resetStatsUseCase } from '../../../application/HeroStatsUseCases';
import { xpToNext } from '../../../domain/entities/HeroLevel';
import { STAT_IDS, type StatId } from '../../../domain/entities/HeroStats';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { soundManager } from '../../audio/SoundManager';
import { BookFrame } from './book/BookFrame';

interface CharacterModalProps {
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

/** The Character window (C): Hero Level, XP, and the Stat points to spend. Dual-page Hero Chronicle. */
export const CharacterModal: React.FC<CharacterModalProps> = ({ isOpen, onClose, onChanged }) => {
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

    const refresh = () => {
        setRevision(r => r + 1);
        onChanged();
    };

    const spend = (id: StatId) => {
        const result = allocateStatPointUseCase(heroLevel, heroStats, health, statsTuning, id);
        if (!result.success) {
            soundManager.playHurt();
            setNotice(result.reason === 'no_points' ? '⚠️ ບໍ່ມີແຕ້ມເຫຼືອ (ຂຶ້ນ Level ເພື່ອໄດ້ແຕ້ມ)' : '⚠️ Stat ນີ້ເຕັມແລ້ວ');
            return;
        }
        soundManager.playSelect();
        setNotice(null);
        refresh();
    };

    const reset = () => {
        const result = resetStatsUseCase(heroLevel, heroStats, health, backpack, statsTuning);
        if (!result.success) {
            soundManager.playHurt();
            if (result.reason === 'nothing_spent') setNotice('ຍັງບໍ່ໄດ້ໃຊ້ແຕ້ມ');
            else {
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

    // Left Page: Hero Profile & Progression
    const leftPage = (
        <div className="h-full flex flex-col justify-between space-y-3">
            <div className="space-y-3">
                {/* Hero Profile Header */}
                <div className="flex items-center gap-3 pb-2 border-b border-[#d6c7a7]">
                    <div className="text-3xl p-2 rounded-xl bg-[#2b1810] border-2 border-[#ca8a04] shadow flex items-center justify-center">
                        🧙‍♂️
                    </div>
                    <div>
                        <h3 className="book-heading text-lg font-bold">ນັກຜະຈົນໄພ (Hero)</h3>
                        <p className="text-xs book-subheading">Knowledge Explorer</p>
                    </div>
                </div>

                {/* Level & XP Card */}
                <div className="book-card p-3 rounded-xl space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="book-heading font-bold text-base" data-testid="character-level">
                            Level {heroLevel.level} <span className="text-xs book-text-muted">/ {progression.maxLevel}</span>
                        </span>
                        <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-mono" data-testid="character-points">
                            ແຕ້ມທີ່ເຫຼືອ: {heroLevel.unspentPoints}
                        </span>
                    </div>

                    <div className="rounded-full overflow-hidden h-2.5 bg-[#2b1810] border border-[#78350f]" data-testid="character-xp-bar">
                        <div
                            style={{
                                height: '100%',
                                background: '#d97706',
                                width: `${isMax ? 100 : Math.round((heroLevel.xp / needed) * 100)}%`,
                                transition: 'width 0.3s',
                            }}
                        />
                    </div>
                    <p className="text-xs book-text-muted">
                        {isMax ? 'ລະດັບສູງສຸດ' : `XP ${heroLevel.xp} / ${needed}`}
                    </p>
                </div>

                <div className="book-filigree-divider" />

                {/* Live Combat Attributes */}
                <div className="book-card p-3 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="book-text-muted">❤️ ພະລັງຊີວິດ (Health):</span>
                        <span className="font-mono font-bold text-rose-800">{health.current} / {health.max}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="book-text-muted">⚔️ ພະລັງໂຈມຕີ (ATK):</span>
                        <span className="font-mono font-bold text-amber-900">{entities.equipment.currentAttackPower} DMG</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="book-text-muted">🛡️ ເກາະປ້ອງກັນ (Armor Hearts):</span>
                        <span className="font-mono font-bold text-sky-800">+{entities.armorContext.totalHearts}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="book-text-muted">💨 ຄວາມໄວການເດີນ:</span>
                        <span className="font-mono font-bold text-emerald-800">{effectText.agility}</span>
                    </div>
                </div>
            </div>

            {/* Respec Action */}
            <div className="pt-2 border-t border-[#d6c7a7] space-y-1.5">
                <div className="flex items-center justify-between text-xs book-text-muted">
                    <span>ຄ່າຣີເຊັດ: {costText}</span>
                </div>
                <button
                    type="button"
                    data-testid="stat-reset"
                    onClick={reset}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold text-xs border border-stone-400 transition flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                >
                    <span>🔄</span>
                    <span>ຣີເຊັດແຕ້ມຄືນທັງໝົດ</span>
                </button>
            </div>
        </div>
    );

    // Right Page: Stat Points Allocation
    const rightPage = (
        <div className="h-full flex flex-col justify-between space-y-3">
            <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#d6c7a7]">
                    <span className="book-subheading text-xs uppercase tracking-wider">
                        ⭐ ພັດທະນາຄ່າພະລັງ (Stat Upgrades)
                    </span>
                    <span className="text-[11px] font-bold text-[#78350f]">
                        {heroLevel.unspentPoints > 0 ? `+${heroLevel.unspentPoints} ແຕ້ມພ້ອມໃຊ້` : 'ບໍ່ມີແຕ້ມ'}
                    </span>
                </div>

                {notice && (
                    <p role="status" className="text-xs text-amber-900 bg-amber-100 p-1.5 rounded-lg border border-amber-300 text-center font-bold" data-testid="character-notice">
                        {notice}
                    </p>
                )}

                <div className="space-y-2">
                    {STAT_IDS.map(id => {
                        const view = STAT_VIEW[id];
                        const max = statsTuning.stats[id].maxPoints;
                        const points = heroStats.pointsIn(id);
                        const full = points >= max;
                        const disabledAdd = full || heroLevel.unspentPoints <= 0;

                        return (
                            <div
                                key={id}
                                className="book-card flex items-center gap-3 p-2.5 rounded-xl border"
                                data-testid={`stat-${id}`}
                                data-points={points}
                            >
                                <span className="text-2xl p-1.5 rounded-lg bg-amber-950/20 border border-amber-900/30 flex items-center justify-center flex-shrink-0">
                                    {view.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="book-heading font-bold text-sm flex items-center gap-1.5">
                                        <span>{view.name}</span>
                                        <span className="text-xs book-text-muted font-mono font-normal">({points}/{max})</span>
                                    </div>
                                    <div className="text-xs book-text-muted">{view.hint}</div>
                                    <div className="text-xs font-bold text-emerald-800">{effectText[id]}</div>
                                </div>
                                <button
                                    type="button"
                                    data-testid={`stat-${id}-add`}
                                    disabled={disabledAdd}
                                    onClick={() => spend(id)}
                                    aria-label={`+1 ${view.name}`}
                                    className={`min-w-[44px] min-h-[44px] rounded-xl font-bold text-xl flex items-center justify-center transition shadow-sm ${
                                        disabledAdd
                                            ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-50'
                                            : 'bg-amber-600 hover:bg-amber-500 text-white active:scale-95'
                                    }`}
                                >
                                    +
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="text-xs book-text-muted italic text-center p-1 border-t border-[#d6c7a7]">
                XP ມາຈາກການຂ້າ monster ເທົ່ານັ້ນ. ອຸປະກອນຈາກຕຳລາບົດຍັງເປັນພະລັງຫຼັກ.
            </p>
        </div>
    );

    return (
        <BookFrame
            isOpen={isOpen}
            onClose={onClose}
            title="ຕົວລະຄອນ (Character)"
            icon="⭐"
            subtitle="XP ມາຈາກການຂ້າ monster ເທົ່ານັ້ນ. ອຸປະກອນຈາກຕຳລາບົດຍັງເປັນພະລັງຫຼັກ."
            leftPage={leftPage}
            rightPage={rightPage}
            windowTestId="character-modal"
            footer={
                <div className="flex items-center justify-between w-full font-mono text-xs text-[#eedec2]">
                    <span>⭐ Level {heroLevel.level} Adventurer</span>
                    <span>🎓 ເຄຣດິດ: {entities.wallet.balance}</span>
                </div>
            }
        />
    );
};
