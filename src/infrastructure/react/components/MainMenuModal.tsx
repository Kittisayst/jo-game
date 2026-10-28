import { useEffect } from 'react';
import { formatTime } from '../utils/formatTime';

export interface MainMenuModalProps
{
    highScore: number;
    bestTime: number | null;
    activeSkinName: string;
    walletBalance?: number;
    onStartGame: (stageKey?: string) => void;
    onOpenStageSelect: () => void;
    onOpenSkinModal: () => void;
    onOpenSettings: () => void;
    onOpenShop?: () => void;
    onOpenAchievements?: () => void;
    unclaimedAchievementsCount?: number;
}

export function MainMenuModal ({
    highScore,
    bestTime,
    activeSkinName,
    walletBalance = 0,
    onStartGame,
    onOpenStageSelect,
    onOpenSkinModal,
    onOpenSettings,
    onOpenShop,
    onOpenAchievements,
    unclaimedAchievementsCount = 0,
}: MainMenuModalProps)
{
    // Enable Enter / Space key to quick-start the game
    useEffect(() =>
    {
        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === 'Enter')
            {
                e.preventDefault();
                onStartGame('village');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onStartGame]);

    return (
        <div className="main-menu-overlay" role="dialog" aria-modal="true" aria-label="Main Menu">
            <div className="main-menu-card">
                {/* Cyberpunk Header */}
                <div className="title-hero-header">
                    <div className="title-edition-badge">CYBER EDITION • v1.2.0</div>
                    <h1 className="main-menu-title">⚡ JO RUNNER ⚡</h1>
                    <p className="main-menu-subtitle">Cyberpunk Slime Invasion</p>
                </div>

                {/* Player Stats Dock */}
                <div className="menu-stats-bar">
                    <div className="menu-stat">
                        <span className="menu-stat-label">🏆 High Score</span>
                        <span className="menu-stat-val">{highScore}</span>
                    </div>
                    <div className="menu-stat">
                        <span className="menu-stat-label">⏱️ Best Time</span>
                        <span className="menu-stat-val">{formatTime(bestTime)}</span>
                    </div>
                    <div className="menu-stat">
                        <span className="menu-stat-label">🪙 ຫຼຽນ</span>
                        <span className="menu-stat-val text-gold">{walletBalance}</span>
                    </div>
                    <div className="menu-stat">
                        <span className="menu-stat-label">🥋 ຊຸດ</span>
                        <span className="menu-stat-val text-cyan">{activeSkinName}</span>
                    </div>
                </div>

                {/* Main Action Menu */}
                <div className="menu-buttons-list">
                    {/* Primary Play Game Button -> Starter Village */}
                    <button
                        autoFocus
                        id="btn-play-game"
                        className="menu-action-btn primary btn-play-village"
                        onClick={() => onStartGame('village')}
                        type="button"
                    >
                        <div className="play-btn-content">
                            <span className="play-btn-icon">▶️</span>
                            <div className="play-btn-text-group">
                                <span className="play-btn-title">ເຂົ້າເກມ (Play Game)</span>
                                <span className="play-btn-subtitle">ເລີ່ມຕົ້ນທີ່: ໝູ່ບ້ານ (Starter Village 🏡)</span>
                            </div>
                        </div>
                    </button>

                    {/* Secondary Navigation Options Grid */}
                    <div className="menu-sub-grid">
                        {onOpenShop && (
                            <button
                                id="menu-shop-btn"
                                className="menu-action-btn secondary shop-menu-btn"
                                onClick={onOpenShop}
                                type="button"
                            >
                                <span className="btn-icon">🛒</span>
                                <span>ຮ້ານຄ້າ (Shop)</span>
                            </button>
                        )}

                        {onOpenAchievements && (
                            <button
                                id="menu-achievements-btn"
                                className="menu-action-btn secondary achievements-menu-btn"
                                onClick={onOpenAchievements}
                                type="button"
                            >
                                <span className="btn-icon">🏆</span>
                                <span>ຜົນສຳເລັດ (Achievements)</span>
                                {unclaimedAchievementsCount > 0 && (
                                    <span className="menu-unclaimed-badge">{unclaimedAchievementsCount}</span>
                                )}
                            </button>
                        )}

                        <button
                            id="menu-stage-select-btn"
                            className="menu-action-btn secondary"
                            onClick={onOpenStageSelect}
                            type="button"
                        >
                            <span className="btn-icon">🚩</span>
                            <span>ເລືອກດ່ານ (Stage Map)</span>
                        </button>

                        <button
                            id="menu-skins-btn"
                            className="menu-action-btn secondary"
                            onClick={onOpenSkinModal}
                            type="button"
                        >
                            <span className="btn-icon">🥋</span>
                            <span>ປ່ຽນຊຸດ (Skins)</span>
                        </button>
                    </div>

                    {/* Settings & Save Management Button */}
                    <button
                        id="menu-settings-btn"
                        className="menu-action-btn secondary full-width"
                        onClick={onOpenSettings}
                        type="button"
                    >
                        <span className="btn-icon">⚙️</span>
                        <span>ຕັ້ງຄ່າ & ຈັດການ Save Slots (Settings)</span>
                    </button>
                </div>

                {/* Footer Controls Tip */}
                <div className="main-menu-footer-tip">
                    <span>💡 ກົດ <strong>[Enter]</strong> ເພື່ອເຂົ້າເກມທັນທີ | ໃຊ້ <strong>[A/D/←/→]</strong> ເຄື່ອນທີ່, <strong>[W/Space]</strong> ໂດດ, <strong>[J]</strong> ໂຈມຕີ</span>
                </div>
            </div>
        </div>
    );
}
