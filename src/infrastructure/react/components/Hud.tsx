import { hudLabelOf } from '../../phaser/levelCatalog';
import { ObjectiveId } from '../../../domain/utils/nextObjective';
import { ItemIcon } from './ItemIcon';
import { DurabilityBar } from './DurabilityBar';
import { formatCraftTime } from '../formatCraftTime';
import type { SkillSlotView } from '../skillSlots';
import type { HeroLevelView } from '../heroLevelView';
import type { WorldTimeView } from '../worldTimeView';
import type { DurabilityReading } from '../../../domain/entities/Backpack';
import { isTouchLayout } from '../../touchLayout';

const OBJECTIVE_TEXT: Record<ObjectiveId, string> = {
    'buy-book': '📚 ຊື້ປຶ້ມຕຳລາບົດທີ 1 ທີ່ຫໍສະໝຸດ',
    'read-book': '📖 ອ່ານປຶ້ມໃຫ້ຄົບທຸກໜ້າ',
    'pass-exam': '📝 ໄປສອບເສັງທີ່ສະຖາບັນ',
    'craft-pickaxe': '⛏️ ເກັບໄມ້ ແລະ ຫີນ ແລ້ວສ້າງຈົກທີ່ໂຮງຊ່າງ',
    'craft-hammer': '🔨 ຂຸດແຮ່ເຫຼັກ ແລ້ວສ້າງຄ້ອນທີ່ໂຮງຊ່າງ',
    'craft-repair-kit': '🧰 ປາບ Cave Guardian ເອົາຜລຶກ ແລ້ວສ້າງ Repair Kit',
    'repair-gate': '🚪 ໄປສ້ອມປະຕູພັງໃນດ່ານບົດທີ 1',
    'defeat-boss': '👑 ປາບ Boss ທີ່ລານ Boss',
    'chapter-cleared': '🏆 ບົດທີ 1 ສຳເລັດ! ທົບທວນ ແລະ ຝຶກປະຈຳວັນຕໍ່ໄປ',
};

export interface EquippedWeaponView
{
    id: string;
    name: string;
    icon: string;
    iconImage?: string;
    /** How worn the sword is; missing for one that never wears (the wooden sword). */
    durability?: DurabilityReading;
}

export interface HudProps
{
    currentLevel: string;
    health: number;
    maxHealth: number;
    isGamePaused: boolean;
    bossHp: number | null;
    bossMaxHp: number;
    walletBalance: number;
    equippedWeapon: EquippedWeaponView;
    /** What the player should do next, shown as a short hint. */
    objective?: ObjectiveId;
    onTogglePause: () => void;
    onCycleWeapon: () => void;
    onOpenBackpack?: () => void;
    onOpenLibrary?: () => void;
    ownedBooksCount?: number;
    backpackCount?: number;
    maxBackpackSlots?: number;
    /** The hint of the first Stage the player has not done yet; nothing once they have or skipped it. */
    tutorialText?: string;
    onDismissTutorial?: () => void;
    /** Armor hearts left (they are lost before the hearts of Health). */
    armor?: number;
    /** Timed Potion effects running, with the seconds left. */
    activeEffects?: { effect: 'strength' | 'speed'; remainingSeconds: number }[];
    /** How many Garden Plots are ready to harvest. */
    gardenReadyCount?: number;
    /** Quests finished and waiting for reward claim. */
    questClaimableCount?: number;
    /** What the Workshop/Forge is making, or null. */
    craftingJob?: { resultItemId: string; remainingMs: number } | null;
    /** Story Materials waiting for a free Backpack slot. */
    pendingRewardsCount?: number;
    /** The Potion chosen to be drunk with R, with how many are left. */
    quickSlot?: { id: string; name: string; icon: string; iconImage?: string; count: number } | null;
    onDrinkQuickSlot?: () => void;
    /** The skills on K and L (null = empty slot), with their cooldown. */
    skillSlots?: (SkillSlotView | null)[];
    /** The Hero Level and the XP towards the next one. */
    heroLevel?: HeroLevelView;
    /** The time of day (a sun or a moon and the time to the next change). */
    worldTime?: WorldTimeView;
    onOpenCharacter?: () => void;
    onUseSkill?: (slot: number) => void;
    stageProgress?: { percent: number } | null;
}

export function Hud ({
    currentLevel,
    health,
    maxHealth,
    isGamePaused,
    bossHp,
    bossMaxHp,
    // walletBalance is not shown in the HUD any more (the Credit badge was removed)
    equippedWeapon,
    objective,
    onTogglePause,
    onCycleWeapon,
    onOpenBackpack,
    onOpenLibrary,
    ownedBooksCount = 0,
    backpackCount = 0,
    maxBackpackSlots = 30,
    tutorialText,
    onDismissTutorial,
    armor = 0,
    pendingRewardsCount = 0,
    gardenReadyCount = 0,
    questClaimableCount = 0,
    craftingJob = null,
    activeEffects = [],
    quickSlot = null,
    onDrinkQuickSlot,
    skillSlots = [],
    heroLevel,
    worldTime,
    onOpenCharacter,
    onUseSkill,
    stageProgress = null,
}: HudProps)
{
    const levelLabel = hudLabelOf(currentLevel);
    const touch = isTouchLayout();
    // The notices row exists only while there is something to say: a build, ripe plants, waiting rewards, a Potion, a hint
    const hasNotices = Boolean(craftingJob) || gardenReadyCount > 0 || pendingRewardsCount > 0 || activeEffects.length > 0 || questClaimableCount > 0 || Boolean(tutorialText) || Boolean(objective);

    return (
        <>
            <div className="game-hud">
                {/* Left: what the player must watch (stage, hearts, level, time), then one quiet line of notices */}
                <div className="hud-cluster-left">
                    <div className="hud-row" data-testid="hud-vitals">
                        {/* Unified Player Status: Level Circle (XP progress ring + number inside) + Hearts extending to the right */}
                        <div className="hud-player-vitals" data-testid="hud-player-vitals">
                            <button
                                type="button"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); onOpenCharacter?.(); }}
                                className="hud-level-circle-btn hero-level-badge"
                                data-testid="hero-level"
                                data-level={heroLevel?.level ?? 1}
                                title={heroLevel && heroLevel.xpNeeded > 0 ? `[C] XP ${heroLevel.xp} / ${heroLevel.xpNeeded} (XP ມາຈາກການຂ້າ monster ເທົ່ານັ້ນ)` : (heroLevel ? 'ລະດັບສູງສຸດ' : 'Hero Level')}
                                aria-label={`Hero Level ${heroLevel?.level ?? 1}`}
                            >
                                <svg className="hud-level-svg" viewBox="0 0 44 44" aria-hidden="true">
                                    <defs>
                                        <linearGradient id="hud-xp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#38bdf8" />
                                            <stop offset="100%" stopColor="#818cf8" />
                                        </linearGradient>
                                    </defs>
                                    <circle
                                        className="hud-level-ring-bg"
                                        cx="22"
                                        cy="22"
                                        r="18"
                                        fill="none"
                                        strokeWidth="3.5"
                                    />
                                    <circle
                                        className="hud-level-ring-fill"
                                        cx="22"
                                        cy="22"
                                        r="18"
                                        fill="none"
                                        stroke="url(#hud-xp-gradient)"
                                        strokeWidth="3.5"
                                        strokeDasharray={113.097}
                                        strokeDashoffset={113.097 * (1 - Math.min(1, Math.max(0, heroLevel?.fraction ?? 0)))}
                                        strokeLinecap="round"
                                        transform="rotate(-90 22 22)"
                                    />
                                </svg>
                                <div className="hud-level-number-wrap">
                                    <span className="hud-level-number">{heroLevel?.level ?? 1}</span>
                                </div>
                                <span
                                    data-testid="hero-xp-bar"
                                    style={{ display: 'none' }}
                                    aria-hidden="true"
                                />
                            </button>

                            <div
                                className="hud-vitals-pill health-badge"
                                data-testid="health-hearts"
                                data-current={health}
                                data-max={maxHealth}
                                title={`ພະລັງຊີວິດ: ${health}/${maxHealth}`}
                            >
                                <span className="hud-hearts-icons">
                                    {'❤️'.repeat(Math.max(0, health)) + '🖤'.repeat(Math.max(0, maxHealth - health))}
                                </span>

                                {armor > 0 && (
                                    <div
                                        className="hud-armor-subpill armor-badge"
                                        data-testid="armor-hearts"
                                        data-armor={armor}
                                        title="ຫົວໃຈເກາະ: ເສຍກ່ອນຫົວໃຈປົກກະຕິ ແລະ ຟື້ນເມື່ອກັບໝູ່ບ້ານ"
                                    >
                                        <span className="badge-icon">{'🛡️'.repeat(Math.min(armor, 10))}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* The name of the place is not shown any more; it stays for screen readers */}
                        <span className="level-badge hud-sr-only" data-testid="level-label">{levelLabel}</span>

                        {worldTime && (
                            <div className="hud-badge world-time-badge" data-testid="world-time" data-phase={worldTime.phase} title={`${worldTime.label}: ອີກ ${worldTime.countdown} ຈະປ່ຽນ`}>
                                <span className="badge-icon">{worldTime.icon}</span>
                                <span className="badge-label">{worldTime.countdown}</span>
                            </div>
                        )}
                    </div>

                    {hasNotices && (
                        <div className="hud-row hud-notices" data-testid="hud-notices">
                            {craftingJob && (
                                <div
                                    className="hud-badge crafting-badge"
                                    data-testid="crafting-badge"
                                    data-state={craftingJob.remainingMs <= 0 ? 'ready' : 'building'}
                                    title="ໂຮງຊ່າງ/ໂຮງຕີເຫຼັກກຳລັງສ້າງ: ເວລານັບຕອນຫຼິ້ນເກມເທົ່ານັ້ນ"
                                >
                                    <span className="badge-icon">{craftingJob.remainingMs <= 0 ? '✅' : '🔨'}</span>
                                    <span className="badge-label">
                                        {craftingJob.remainingMs <= 0 ? 'ສ້າງສຳເລັດ ໄປຮັບຂອງ' : `ກຳລັງສ້າງ ${formatCraftTime(craftingJob.remainingMs)}`}
                                    </span>
                                </div>
                            )}

                            {gardenReadyCount > 0 && (
                                <div className="hud-badge garden-badge" data-testid="garden-ready" title="ມີຜົນໃນສວນພ້ອມເກັບ: ໄປທີ່ປະຕູສວນໃນໝູ່ບ້ານ">
                                    <span className="badge-icon">🌿</span>
                                    <span className="badge-label">ສວນພ້ອມເກັບ {gardenReadyCount}</span>
                                </div>
                            )}

                            {pendingRewardsCount > 0 && (
                                <div
                                    className="hud-badge pending-badge"
                                    data-testid="pending-rewards"
                                    title="ວັດສະດຸເນື້ອເລື່ອງ (ເສດປະຕູ, ແກນບອສ, ຜລຶກ) ທີ່ກະເປົາເຕັມ ເກັບໄວ້ໃຫ້ ຈະເຂົ້າກະເປົາເມື່ອມີຊ່ອງວ່າງ"
                                >
                                    <span className="badge-icon">📦</span>
                                    <span className="badge-label">ລໍຮັບ {pendingRewardsCount} (ກະເປົາເຕັມ)</span>
                                </div>
                            )}

                            {(questClaimableCount ?? 0) > 0 && (
                                <div
                                    className="hud-badge quest-claimable-badge"
                                    data-testid="quest-claimable"
                                    title="ມີພາລະກິດສຳເລັດແລ້ວ: ໄປຮັບລາງວັນທີ່ກະດານພາລະກິດໃນໝູ່ບ້ານ"
                                >
                                    <span className="badge-icon">📜</span>
                                    <span className="badge-label">ຮັບລາງວັນພາລະກິດ {questClaimableCount}</span>
                                </div>
                            )}

                            {activeEffects.map(active => (
                                <div
                                    key={active.effect}
                                    className="hud-badge effect-badge"
                                    data-testid={`effect-${active.effect}`}
                                    title={active.effect === 'strength' ? 'ພະລັງໂຈມຕີ +50%' : 'ຄວາມໄວ +30%'}
                                >
                                    <span className="badge-icon">{active.effect === 'strength' ? '💪' : '💨'}</span>
                                    <span className="badge-label">{active.remainingSeconds}s</span>
                                </div>
                            ))}

                            {/* One hint at a time: the tutorial step while there is one, otherwise the next objective */}
                            {tutorialText ? (
                                <div className="hud-badge tutorial-badge" data-testid="tutorial-hint" title="ຄຳແນະນຳສຳລັບຜູ້ຫຼິ້ນໃໝ່">
                                    <span className="badge-label">{tutorialText}</span>
                                    {onDismissTutorial && (
                                        <button
                                            type="button"
                                            className="tutorial-skip"
                                            data-testid="tutorial-skip"
                                            onClick={e => { e.preventDefault(); e.stopPropagation(); onDismissTutorial(); }}
                                            title="ຂ້າມຄຳແນະນຳ"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ) : objective ? (
                                <div className="hud-badge objective-badge" title="ເປົ້າໝາຍຕໍ່ໄປ">
                                    <span className="badge-label">{OBJECTIVE_TEXT[objective]}</span>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Right: Credit, the Backpack and the Textbooks as small buttons, and the menu */}
                <div className="hud-cluster-right">
                    {/* How far along the Stage the hero is (not shown in the village) */}
                    {stageProgress && (
                        <div
                            className="hud-badge stage-progress-badge"
                            data-testid="stage-progress"
                            title={`ໄລຍະທາງໃນດ່ານ: ${stageProgress.percent}%`}
                        >
                            <span className="badge-icon">🏃</span>
                            <span className="badge-label">{stageProgress.percent}%</span>
                            <div className="stage-progress-track" aria-hidden="true">
                                <div
                                    className="stage-progress-fill"
                                    style={{ width: `${stageProgress.percent}%` }}
                                />
                            </div>
                            <span className="badge-target">🌀</span>
                        </div>
                    )}

                    {onOpenBackpack && (
                        <button
                            id="hud-backpack-btn"
                            className="hud-badge backpack-hud-btn"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                e.stopPropagation();
                                onOpenBackpack();
                            }}
                            title={`ເປີດກະເປົາ (Backpack) [I] · ${backpackCount}/${maxBackpackSlots} ຊ່ອງ`}
                            aria-label={`ກະເປົາ ${backpackCount}/${maxBackpackSlots}`}
                            type="button"
                        >
                            <span className="badge-icon">🎒</span>
                        </button>
                    )}

                    {onOpenLibrary && (
                        <button
                            id="hud-library-btn"
                            className="hud-badge library-hud-btn"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                e.stopPropagation();
                                onOpenLibrary();
                            }}
                            title={`ເປີດອ່ານປຶ້ມຕຳລາທີ່ຊື້ແລ້ວ (ມີ ${ownedBooksCount} ຫົວ; ຊື້ໄດ້ທີ່ອາຄານຫໍສະໝຸດໃນໝູ່ບ້ານ)`}
                            aria-label="ຕຳລາ"
                            type="button"
                        >
                            <span className="badge-icon">📚</span>
                        </button>
                    )}

                    <button
                        id="hud-menu-btn"
                        className={`hud-badge hud-menu-btn ${isGamePaused ? 'paused-active' : ''}`}
                        onClick={(e) =>
                        {
                            e.preventDefault();
                            e.stopPropagation();
                            onTogglePause();
                        }}
                        title="In-Game Menu & Pause (Esc / P)"
                        type="button"
                    >
                        <span className="badge-icon">{isGamePaused ? '▶️' : '⏸️'}</span>
                        <span className="badge-label">{isGamePaused ? 'ສືບຕໍ່' : 'ເມນູ'}</span>
                    </button>
                </div>
            </div>

            {/* Bottom centre: the things used in a fight (the sword, the Skills and the Potion). On a phone the touch
                buttons already have the sword and the Skills, so only the Potion is here. */}
            {(quickSlot || !touch) && (
                <div className="hud-hotbar" data-testid="hud-hotbar">
                    {quickSlot && (
                        <button
                            className="hud-badge quick-slot-badge"
                            data-testid="quick-slot"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); onDrinkQuickSlot?.(); }}
                            title={`ດື່ມ ${quickSlot.name} (ກົດ R)`}
                            type="button"
                        >
                            <span className="badge-icon flex items-center">
                                <ItemIcon iconImage={quickSlot.iconImage} icon={quickSlot.icon} size={20} />
                            </span>
                            <span className="badge-label">x{quickSlot.count}</span>
                            <span className="badge-hint">[R]</span>
                        </button>
                    )}

                    {!touch && skillSlots.map(view => view && (
                        <button
                            className="hud-badge skill-slot-badge"
                            data-testid={`skill-slot-${view.key}`}
                            data-state={view.cooldown > 0 ? 'cooling' : 'ready'}
                            key={view.slot}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); onUseSkill?.(view.slot); }}
                            title={`${view.name} (ກົດ ${view.key})`}
                            type="button"
                        >
                            <span className="badge-icon">{view.icon}</span>
                            <span className="badge-hint">[{view.key}]</span>
                            <span className="skill-cooldown" style={{ height: `${Math.round(view.cooldown * 100)}%` }} />
                        </button>
                    ))}

                    {/* Equipped Weapon Badge with Cycle button */}
                    {!touch && (
                        <button
                            className="hud-badge weapon-hud-badge"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                e.stopPropagation();
                                onCycleWeapon();
                            }}
                            title="ປ່ຽນອາວຸດ (ກົດ Q)"
                            type="button"
                        >
                            <span className="badge-icon flex items-center">
                                <ItemIcon iconImage={equippedWeapon.iconImage} icon={equippedWeapon.icon} size={20} />
                            </span>
                            <span className="badge-label">{equippedWeapon.name}</span>
                            {equippedWeapon.durability && <DurabilityBar reading={equippedWeapon.durability} compact />}
                            <span className="badge-hint">[Q]</span>
                        </button>
                    )}
                </div>
            )}

            {/* Boss Bar */}
            {bossHp !== null && (
                <div className="boss-hud-container">
                    <div className="boss-hud-header">
                        <span className="boss-title">
                            {currentLevel === 'stage-010' ? '⚡ ຈອມມານຮາດແວບູຮານ (Hardware Overlord)' : currentLevel === 'dungeon' ? '🕷️ ພະຍາແມງມຸມ (Spider Queen)' : '👑 BOSS'}
                        </span>
                        <span className="boss-hp-number">{bossHp} / {bossMaxHp} HP</span>
                    </div>
                    <div className="boss-hp-bar">
                        <div
                            className="boss-hp-fill"
                            style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
