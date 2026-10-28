import { formatTime } from '../utils/formatTime';
import { getLevelItem } from '../../phaser/levelCatalog';

export interface InventorySlotView
{
    id: string;
    name: string;
    icon: string;
    count: number;
}

export interface EquippedWeaponView
{
    id: string;
    name: string;
    icon: string;
}

export interface HudProps
{
    currentLevel: string;
    lives: number;
    maxLives: number;
    coinsCount: number;
    score: number;
    elapsedSeconds: number;
    highScore: number;
    starTimer: number;
    springTimer: number;
    isGamePaused: boolean;
    bossHp: number | null;
    bossMaxHp: number;
    walletBalance: number;
    equippedWeapon: EquippedWeaponView;
    inventorySlots: InventorySlotView[];
    onTogglePause: () => void;
    onCycleWeapon: () => void;
    onUseItem: (itemId: string) => void;
    onOpenShop?: () => void;
    onOpenAchievements?: () => void;
    unclaimedAchievementsCount?: number;
}

export function Hud ({
    currentLevel,
    lives,
    maxLives,
    coinsCount,
    score,
    elapsedSeconds,
    highScore,
    starTimer,
    springTimer,
    isGamePaused,
    bossHp,
    bossMaxHp,
    walletBalance,
    equippedWeapon,
    inventorySlots,
    onTogglePause,
    onCycleWeapon,
    onUseItem,
    onOpenShop,
    onOpenAchievements,
    unclaimedAchievementsCount,
}: HudProps)
{
    const levelLabel = getLevelItem(currentLevel)?.hudLabel || currentLevel;
    const isVillage = currentLevel === 'village';

    return (
        <>
            <div className="game-hud">
                {/* Left Cluster: Player Vitals & Stage Progression */}
                <div className="hud-cluster-left">
                    <div className="hud-badge level-badge">
                        <span className="badge-icon">🚩</span>
                        <span className="badge-label">{levelLabel}</span>
                    </div>

                    <div className="hud-badge lives-badge">
                        <span className="badge-icon">
                            {'❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, maxLives - lives))}
                        </span>
                    </div>

                    {/* Permanent Wallet balance */}
                    <div className="hud-badge wallet-hud-badge" title="ເງິນໃນກະເປົາ (Wallet)">
                        <span className="badge-icon">🪙</span>
                        <span className="badge-value">{walletBalance}</span>
                    </div>

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

                    {!isVillage && (
                        <>
                            <div className="hud-badge coin-badge">
                                <span className="badge-icon">💰</span>
                                <span className="badge-label">Stage</span>
                                <span className="badge-value">{coinsCount}</span>
                            </div>
                            <div className="hud-badge score-badge">
                                <span className="badge-icon">⭐</span>
                                <span className="badge-label">Score</span>
                                <span className="badge-value">{score}</span>
                            </div>
                            <div className="hud-badge timer-badge">
                                <span className="badge-icon">⏱️</span>
                                <span className="badge-value">{formatTime(elapsedSeconds)}</span>
                            </div>
                            <div className="hud-badge high-score-badge">
                                <span className="badge-icon">🏆</span>
                                <span className="badge-label">Best</span>
                                <span className="badge-value">{highScore}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Center Cluster: Active Timers & Buffs */}
                <div className="hud-cluster-center">
                    {starTimer > 0 && (
                        <div className="hud-badge star-power-badge">
                            <span className="badge-icon">⭐</span>
                            <span className="badge-label">Star</span>
                            <span className="badge-value">{starTimer}s</span>
                        </div>
                    )}

                    {springTimer > 0 && (
                        <div className="hud-badge spring-power-badge">
                            <span className="badge-icon">⚡</span>
                            <span className="badge-label">Jump+</span>
                            <span className="badge-value">{springTimer}s</span>
                        </div>
                    )}
                </div>

                {/* Right Cluster: Utility Controls (Achievements, Shop & Pause) */}
                <div className="hud-cluster-right">
                    {onOpenAchievements && (
                        <button
                            id="hud-achievements-btn"
                            className="hud-badge achievements-hud-btn"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                e.stopPropagation();
                                onOpenAchievements();
                            }}
                            title="ຜົນສຳເລັດ & ພາລະກິດ (Achievements)"
                            type="button"
                        >
                            <span className="badge-icon">🏆</span>
                            <span className="badge-label">ພາລະກິດ</span>
                            {unclaimedAchievementsCount !== undefined && unclaimedAchievementsCount > 0 && (
                                <span className="unclaimed-badge-count">{unclaimedAchievementsCount}</span>
                            )}
                        </button>
                    )}

                    {onOpenShop && (
                        <button
                            className="hud-badge shop-hud-btn"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                e.stopPropagation();
                                onOpenShop();
                            }}
                            title="ເປີດຮ້ານຄ້າ (Shop)"
                            type="button"
                        >
                            <span className="badge-icon">🛒</span>
                            <span className="badge-label">ຮ້ານຄ້າ</span>
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

            {/* Consumable Items Hotbar (bottom left/center) */}
            <div className="hud-hotbar">
                {inventorySlots.map((slot, index) => (
                    <button
                        key={slot.id}
                        className={`hotbar-slot ${slot.count === 0 ? 'slot-empty' : ''}`}
                        disabled={slot.count === 0}
                        onClick={() => onUseItem(slot.id)}
                        title={`${slot.name} (${slot.count}) - ກົດປຸ່ມ [${index + 1}]`}
                        type="button"
                    >
                        <span className="slot-key">[{index + 1}]</span>
                        <span className="slot-icon">{slot.icon}</span>
                        <span className="slot-count">{slot.count}</span>
                    </button>
                ))}
            </div>

            {/* Boss Bar */}
            {(currentLevel === 'level-3' || bossHp !== null) && (
                <div className="boss-hud-container">
                    <div className="boss-hud-header">
                        <span className="boss-title">👑 KING SLIME</span>
                        <span className="boss-hp-number">{(bossHp ?? 5)} / {bossMaxHp} HP</span>
                    </div>
                    <div className="boss-hp-bar">
                        <div
                            className="boss-hp-fill"
                            style={{ width: `${Math.max(0, ((bossHp ?? 5) / bossMaxHp) * 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
