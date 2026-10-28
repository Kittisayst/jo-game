import { getLevelItem } from '../../phaser/levelCatalog';
import { ObjectiveId } from '../../../domain/utils/nextObjective';

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
    maxBackpackSlots = 20,
}: HudProps)
{
    const levelLabel = getLevelItem(currentLevel)?.hudLabel || currentLevel;

    return (
        <>
            <div className="game-hud">
                {/* Left Cluster: Player Vitals & Stage Progression */}
                <div className="hud-cluster-left">
                    <div className="hud-badge level-badge">
                        <span className="badge-icon">🚩</span>
                        <span className="badge-label">{levelLabel}</span>
                    </div>

                    <div className="hud-badge health-badge">
                        <span className="badge-icon">
                            {'❤️'.repeat(Math.max(0, health)) + '🖤'.repeat(Math.max(0, maxHealth - health))}
                        </span>
                    </div>

                    {objective && (
                        <div className="hud-badge objective-badge" title="ເປົ້າໝາຍຕໍ່ໄປ">
                            <span className="badge-label">{OBJECTIVE_TEXT[objective]}</span>
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
                        <span className="badge-icon">{equippedWeapon.icon}</span>
                        <span className="badge-label">{equippedWeapon.name}</span>
                        <span className="badge-hint">[Q]</span>
                    </button>

                </div>

                {/* Right Cluster: Utility Controls (Achievements, Shop & Pause) */}
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
            {(currentLevel === 'level-3' || currentLevel === 'stage-ch1' || bossHp !== null) && bossHp !== null && (
                <div className="boss-hud-container">
                    <div className="boss-hud-header">
                        <span className="boss-title">
                            {currentLevel === 'stage-ch1' ? '⚡ ຈອມມານຮາດແວບູຮານ (Hardware Overlord)' : '👑 KING SLIME'}
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
