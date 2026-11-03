import { useEffect, useState } from 'react';
import { StageProgression } from '../../../domain/entities/StageProgression';
import { BOSS_STAGE_IN_REALM, MINIBOSS_STAGE_IN_REALM, STAGES_PER_REALM } from '../../../domain/entities/StageNumber';
import { soundManager } from '../../audio/SoundManager';
import { getGameContent } from '../../content/ContentCatalog';
import { isStageReady, StageDefinition } from '../../phaser/stages/StageDefinition';

export interface StageMapModalProps {
    currentLevel: string;
    stageProgression: StageProgression;
    onClose: () => void;
    onSelectStage: (stageKey: string) => void;
    /** Realms opened so far (Realm 1 always). */
    openedRealms: ReadonlySet<number>;
    /** How many of each Portal block the hero carries, by item id. */
    blockCounts: Readonly<Record<string, number>>;
    /** Places the Portal block that opens `realm`; says whether it worked. */
    onPlaceBlock: (realm: number) => boolean;
}

type CellState = 'placeholder' | 'locked' | 'open' | 'cleared';

function describe (stage: StageDefinition, state: CellState): string {
    if (state === 'placeholder') return `${stage.name} · ກຳລັງສ້າງ`;
    if (state === 'locked') return `${stage.name} · 🔒 ຕ້ອງຜ່ານດ່ານກ່ອນໜ້າ`;
    if (state === 'cleared') return `${stage.name} · ⭐ ຜ່ານແລ້ວ`;
    return `${stage.name} · ▶️ ພ້ອມຫຼິ້ນ`;
}

const BrassCorner: React.FC<{ className?: string; rotate?: number }> = ({ className, rotate = 0 }) => (
    <svg
        className={className}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: `rotate(${rotate}deg)` }}
    >
        <path d="M0 0 L32 0 L32 8 L8 8 L8 32 L0 32 Z" fill="#d97706" stroke="#78350f" strokeWidth="1" />
        <path d="M2 2 L30 2 L30 6 L6 6 L6 30 L2 30 Z" fill="#fbbf24" opacity="0.8" />
        <circle cx="4" cy="4" r="1.5" fill="#fef08a" stroke="#78350f" strokeWidth="0.5" />
        <circle cx="20" cy="4" r="1.2" fill="#fef08a" stroke="#78350f" strokeWidth="0.5" />
        <circle cx="4" cy="20" r="1.2" fill="#fef08a" stroke="#78350f" strokeWidth="0.5" />
    </svg>
);

/**
 * StageMapModal: World Atlas Map converted to Antique Cartographer's Journal
 * 10 Realms x 10 Stages = 100 Stages + Village + Dungeon
 */
export function StageMapModal ({
    currentLevel,
    stageProgression,
    onClose,
    onSelectStage,
    openedRealms,
    blockCounts,
    onPlaceBlock,
}: StageMapModalProps) {
    const { realms, stages } = getGameContent();
    const [justOpened, setJustOpened] = useState<number | null>(null);

    useEffect(() => {
        soundManager.playPageTurn();
    }, []);

    const placeBlock = (realm: number) => {
        if (!onPlaceBlock(realm)) return;
        setJustOpened(realm);
        setTimeout(() => setJustOpened(null), 1800);
    };

    const stateOf = (stage: StageDefinition): CellState => {
        if (!isStageReady(stage)) return 'placeholder';
        if (stageProgression.isStageCompleted(stage.id)) return 'cleared';
        return stageProgression.isStageUnlocked(stage.id) ? 'open' : 'locked';
    };

    const handleSelect = (stageKey: string, state: CellState) => {
        if (state === 'placeholder' || state === 'locked') {
            soundManager.playHurt();
            return;
        }

        soundManager.playCoin();
        onSelectStage(stageKey);
    };

    return (
        <div className="gw-overlay stage-map-overlay" onClick={onClose}>
            <div
                className="gw-window stage-map-card relative book-window flex flex-col max-h-[92vh] max-w-4xl"
                onClick={e => e.stopPropagation()}
            >
                {/* 4 Brass Corners */}
                <BrassCorner className="book-corner-tl" rotate={0} />
                <BrassCorner className="book-corner-tr" rotate={90} />
                <BrassCorner className="book-corner-bl" rotate={270} />
                <BrassCorner className="book-corner-br" rotate={180} />

                {/* Header */}
                <div className="gw-header stage-map-header flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 bg-[#1e1008] border-b-2 border-[#78350f]">
                    <div className="stage-map-title-group flex items-center gap-3">
                        <span className="gw-icon stage-map-icon text-3xl">🗺️</span>
                        <div>
                            <h2 className="text-base sm:text-xl font-bold text-amber-200">
                                ແຜນທີ່ 100 ດ່ານ (World Map Atlas)
                            </h2>
                            <p className="gw-subtitle stage-map-subtitle text-xs text-amber-100/70">
                                10 ມິຕິ × 10 ດ່ານ · ເລືອກດ່ານທີ່ເປີດແລ້ວ ຫຼື ຄຸກໃຕ້ດິນ ເພື່ອເດີນທາງ
                            </p>
                        </div>
                    </div>
                    <button
                        className="skin-close-btn gw-close rounded-xl p-2 text-amber-200/70 hover:text-amber-100 hover:bg-amber-950/60 transition"
                        onClick={onClose}
                        type="button"
                        aria-label="Close"
                        title="ປິດ (Escape)"
                    >
                        ✕
                    </button>
                </div>

                {/* The World Gate: ten Portal slots */}
                <div className="portal-gate px-4 sm:px-6 py-2 bg-[#2c1810] border-b border-[#78350f]" data-testid="portal-gate">
                    <span className="portal-gate-title text-xs font-bold text-amber-200 flex items-center gap-1.5 mb-1.5">
                        <span>🌀</span> ປະຕູມິຕິ (World Gate): ໃສ່ກ້ອນປະຕູເພື່ອເປີດມິຕິຖັດໄປ
                    </span>
                    <div className="portal-slots flex gap-1.5 overflow-x-auto pb-1">
                        {realms.map(realm => {
                            const isFinal = realm.number === realms.length;
                            const filled = !isFinal && openedRealms.has(realm.number + 1);
                            const carried = blockCounts[realm.blockItem] ?? 0;
                            const ready = !isFinal && !filled && openedRealms.has(realm.number) && carried > 0;
                            const state = isFinal ? 'final' : filled ? 'filled' : ready ? 'ready' : 'empty';

                            return (
                                <button
                                    key={realm.number}
                                    type="button"
                                    data-testid={`portal-slot-${realm.number}`}
                                    data-state={state}
                                    className={`portal-slot portal-${state} ${justOpened === realm.number + 1 ? 'portal-burst' : ''} min-h-[44px] min-w-[44px]`}
                                    style={{ ['--realm-color' as string]: realm.color }}
                                    disabled={!ready}
                                    onClick={() => placeBlock(realm.number + 1)}
                                    title={isFinal
                                        ? 'ປະຕູສຸດທ້າຍ: ຍັງບໍ່ມີມິຕິຖັດໄປ'
                                        : filled
                                            ? `ມິຕິ ${realm.number + 1} ເປີດແລ້ວ`
                                            : ready
                                                ? `ໃສ່ກ້ອນປະຕູ ເພື່ອເປີດມິຕິ ${realm.number + 1}`
                                                : `ຕ້ອງມີກ້ອນປະຕູ ${realm.name}${openedRealms.has(realm.number) ? '' : ` (ມິຕິ ${realm.number} ຕ້ອງເປີດກ່ອນ)`}`}
                                >
                                    <span className="portal-slot-icon">{filled ? '🌀' : ready ? '⬆️' : isFinal ? '⭐' : '▫️'}</span>
                                    <span className="portal-slot-label">{ready ? 'ໃສ່ກ້ອນ' : filled ? `→ ${realm.number + 1}` : realm.number}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Map Body */}
                <div className="realm-map flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#fbf3df]">
                    {/* Village & Dungeon Navigation Signposts */}
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            className={`realm-village-btn ${currentLevel === 'village' ? 'is-current' : ''} min-h-[44px] rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2`}
                            type="button"
                            onClick={() => handleSelect('village', 'open')}
                            style={{ flex: 1 }}
                        >
                            <span>🏡</span>
                            <span>ໝູ່ບ້ານ (Village Hub)</span>
                        </button>
                        <button
                            className={`realm-village-btn realm-dungeon-btn ${currentLevel === 'dungeon' ? 'is-current' : ''} min-h-[44px] rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2`}
                            type="button"
                            onClick={() => handleSelect('dungeon', 'open')}
                            style={{
                                flex: 1,
                            }}
                        >
                            <span>🏰</span>
                            <span>ຄຸກໃຕ້ດິນ (Dungeon-001)</span>
                        </button>
                    </div>

                    {/* 10 Realms */}
                    {realms.map(realm => {
                        const realmStages = stages.filter(stage => stage.realm === realm.number);
                        const builtCount = realmStages.filter(isStageReady).length;
                        const isOpen = openedRealms.has(realm.number);
                        const previous = realms[realm.number - 2];

                        return (
                            <section
                                key={realm.number}
                                className={`realm-row ${isOpen ? '' : 'realm-closed'} ${justOpened === realm.number ? 'realm-opening' : ''} rounded-xl border border-[#d4c5a9] bg-[#fffdfa]/80 p-2.5 sm:p-3 shadow-sm`}
                                data-testid={`realm-row-${realm.number}`}
                                data-open={isOpen}
                                style={{ ['--realm-color' as string]: realm.color }}
                                aria-label={`ມິຕິ ${realm.number}: ${realm.name}`}
                            >
                                <header className="realm-row-header flex items-center justify-between pb-1.5 border-b border-[#e2d5bd]">
                                    <div className="flex items-center gap-2">
                                        <span className="realm-row-icon text-lg sm:text-xl">{realm.icon}</span>
                                        <span className="realm-row-name font-bold text-xs sm:text-sm text-amber-950">
                                            ມິຕິ {realm.number}: {realm.name}
                                        </span>
                                        <span className="realm-row-subject text-[11px] text-amber-800/80 hidden sm:inline">
                                            ({realm.subject})
                                        </span>
                                    </div>
                                    {isOpen ? (
                                        <span className="realm-row-count text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                            {builtCount}/{STAGES_PER_REALM} ດ່ານ
                                        </span>
                                    ) : (
                                        <span
                                            className="realm-row-count realm-row-locked text-[11px] text-amber-900/70 font-semibold flex items-center gap-1"
                                            data-testid={`realm-locked-${realm.number}`}
                                        >
                                            🔒 ຕ້ອງໃຊ້ກ້ອນປະຕູ <span className="portal-dot inline-block w-2.5 h-2.5 rounded-full border border-black/20" style={{ background: previous?.color }} /> ຂອງມິຕິ {realm.number - 1}
                                        </span>
                                    )}
                                </header>

                                <div className="realm-cells grid grid-cols-10 gap-1 sm:gap-1.5 pt-2">
                                    {realmStages.map(stage => {
                                        const state = stateOf(stage);
                                        const position = ((stage.number - 1) % STAGES_PER_REALM) + 1;
                                        const mark = position === BOSS_STAGE_IN_REALM
                                            ? '👑'
                                            : position === MINIBOSS_STAGE_IN_REALM ? '⚔️' : '';
                                        const isCurrent = currentLevel === stage.id;

                                        return (
                                            <button
                                                key={stage.id}
                                                type="button"
                                                className={`realm-cell cell-${state} ${isCurrent ? 'is-current' : ''} min-h-[44px] rounded-lg border font-bold text-xs sm:text-sm flex flex-col items-center justify-center relative transition`}
                                                title={describe(stage, state)}
                                                aria-label={describe(stage, state)}
                                                aria-disabled={state === 'placeholder' || state === 'locked'}
                                                onClick={() => handleSelect(stage.id, state)}
                                            >
                                                <span className="realm-cell-number">{stage.number}</span>
                                                {mark && <span className="realm-cell-mark text-[10px]">{mark}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
