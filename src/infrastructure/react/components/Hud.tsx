import { hudLabelOf } from '../../phaser/levelCatalog';
import { ObjectiveId } from '../../../domain/utils/nextObjective';
import { ItemIcon } from './ItemIcon';
import { DurabilityBar } from './DurabilityBar';
import { formatCraftTime } from '../formatCraftTime';
import type { SkillSlotView } from '../skillSlots';
import type { HeroLevelView } from '../heroLevelView';
import type { WorldTimeView } from '../worldTimeView';
import type { DurabilityReading } from '../../../domain/entities/Backpack';

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
}

export function Hud ({
    currentLevel,
    health,
    maxHealth,
    isGamePaused,
    bossHp,
    bossMaxHp,
    walletBalance,
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
    craftingJob = null,
    activeEffects = [],
    quickSlot = null,
    onDrinkQuickSlot,
    skillSlots = [],
    heroLevel,
    worldTime,
    onOpenCharacter,
    onUseSkill,
}: HudProps)
{
    const levelLabel = hudLabelOf(currentLevel);

    return (
        <>
            <div className="game-hud">
                {/* Left Cluster: Player Vitals & Stage Progression */}
                <div className="hud-cluster-left">
                    <div className="hud-badge level-badge">
                        <span className="badge-icon">🚩</span>
                        <span className="badge-label">{levelLabel}</span>
                    </div>

                    <div className="hud-badge health-badge" data-testid="health-hearts" data-current={health} data-max={maxHealth}>
                        <span className="badge-icon">
                            {'❤️'.repeat(Math.max(0, health)) + '🖤'.repeat(Math.max(0, maxHealth - health))}
                        </span>
                    </div>

                    {armor > 0 && (
                        <div className="hud-badge armor-badge" data-testid="armor-hearts" data-armor={armor} title="ຫົວໃຈເກາະ: ເສຍກ່ອນຫົວໃຈປົກກະຕິ ແລະ ຟື້ນເມື່ອກັບໝູ່ບ້ານ">
                            <span className="badge-icon">{'🛡️'.repeat(Math.min(armor, 10))}</span>
                        </div>
                    )}

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

                    {objective && (
                        <div className="hud-badge objective-badge" title="ເປົ້າໝາຍຕໍ່ໄປ">
                            <span className="badge-label">{OBJECTIVE_TEXT[objective]}</span>
                        </div>
                    )}

                    {tutorialText && (
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
                    )}

                    {heroLevel && (
                        <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); onOpenCharacter?.(); }}
                            className="hud-badge hero-level-badge"
                            data-testid="hero-level"
                            data-level={heroLevel.level}
                            title={heroLevel.xpNeeded > 0 ? `[C] XP ${heroLevel.xp} / ${heroLevel.xpNeeded} (XP ມາຈາກການຂ້າ monster ເທົ່ານັ້ນ, ບໍ່ແມ່ນ Credit)` : 'ລະດັບສູງສຸດ'}
                        >
                            <span className="badge-icon">⭐</span>
                            <span className="badge-value">Lv {heroLevel.level}</span>
                            <span aria-hidden="true" style={{ display: 'inline-block', width: 44, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.35)', overflow: 'hidden' }}>
                                <span data-testid="hero-xp-bar" style={{ display: 'block', height: '100%', width: `${Math.round(heroLevel.fraction * 100)}%`, background: '#a5b4fc' }} />
                            </span>
                        </button>
                    )}

                    {worldTime && (
                        <div className="hud-badge world-time-badge" data-testid="world-time" data-phase={worldTime.phase} title={`${worldTime.label}: ອີກ ${worldTime.countdown} ຈະປ່ຽນ`}>
                            <span className="badge-icon">{worldTime.icon}</span>
                            <span className="badge-label">{worldTime.countdown}</span>
                        </div>
                    )}

                    {/* Permanent Knowledge Credit balance */}
                    <div className="hud-badge wallet-hud-badge" title="ເຄຣດິດຄວາມຮູ້ (Credit - ໄດ້ຮັບຈາກການຮຽນ & ສອບເສັງ)">
                        <span className="badge-icon">🎓</span>
                        <span className="badge-value">{walletBalance}</span>
                    </div>

                    {/* Quick Backpack Button */}
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
                            title="ເປີດກະເປົາ (Backpack)"
                            type="button"
                        >
                            <span className="badge-icon">🎒</span>
                            <span className="badge-label">{backpackCount}/{maxBackpackSlots}</span>
                        </button>
                    )}

                    {/* Quick Personal Textbook Reader Button */}
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
                            title="ເປີດອ່ານປຶ້ມຕຳລາທີ່ຊື້ແລ້ວ (ຊື້ປຶ້ມໄດ້ທີ່ອາຄານຫໍສະໝຸດໃນໝູ່ບ້ານ)"
                            type="button"
                        >
                            <span className="badge-icon">📚</span>
                            <span className="badge-label">ຕຳລາ ({ownedBooksCount})</span>
                        </button>
                    )}

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

                    {skillSlots.map(view => view && (
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

                </div>

                {/* Right Cluster: Utility Controls (Pause) */}
                <div className="hud-cluster-right">
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

            {/* Boss Bar */}
            {bossHp !== null && (
                <div className="boss-hud-container">
                    <div className="boss-hud-header">
                        <span className="boss-title">
                            {currentLevel === 'stage-010' ? '⚡ ຈອມມານຮາດແວບູຮານ (Hardware Overlord)' : '👑 BOSS'}
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
