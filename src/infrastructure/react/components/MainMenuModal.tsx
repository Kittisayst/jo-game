import { useEffect } from 'react';

export interface MainMenuModalProps
{
    walletBalance?: number;
    onStartGame: (stageKey?: string) => void;
    onOpenStageSelect: () => void;
    onOpenSettings: () => void;
}

export function MainMenuModal ({
    walletBalance = 0,
    onStartGame,
    onOpenStageSelect,
    onOpenSettings,
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
                        <span className="menu-stat-label">🎓 Credit</span>
                        <span className="menu-stat-val text-gold">{walletBalance}</span>
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
                        <button
                            id="menu-stage-select-btn"
                            className="menu-action-btn secondary"
                            onClick={onOpenStageSelect}
                            type="button"
                        >
                            <span className="btn-icon">🚩</span>
                            <span>ເລືອກດ່ານ (Stage Map)</span>
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
