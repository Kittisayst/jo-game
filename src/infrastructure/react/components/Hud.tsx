import { formatTime } from '../utils/formatTime';
import { getLevelItem } from '../../phaser/levelCatalog';

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
    onTogglePause: () => void;
    onCycleWeapon: () => void;
    onOpenAchievements?: () => void;
    unclaimedAchievementsCount?: number;
    onOpenBackpack?: () => void;
    onOpenLibrary?: () => void;
    ownedBooksCount?: number;
    backpackCount?: number;
    maxBackpackSlots?: number;
}

export function Hud ({
    currentLevel,
    lives,
    maxLives,
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
    onTogglePause,
    onCycleWeapon,
    onOpenAchievements,
    unclaimedAchievementsCount,
    onOpenBackpack,
    onOpenLibrary,
    ownedBooksCount = 0,
    backpackCount = 0,
    maxBackpackSlots = 20,
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

                    {!isVillage && (
                        <>
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
