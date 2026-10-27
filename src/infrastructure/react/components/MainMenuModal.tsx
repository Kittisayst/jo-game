import { formatTime } from '../utils/formatTime';

export interface MainMenuModalProps
{
    highScore: number;
    bestTime: number | null;
    activeSkinName: string;
    onStartGame: (stageKey?: string) => void;
    onOpenStageSelect: () => void;
    onOpenSkinModal: () => void;
    onOpenSettings: () => void;
}

export function MainMenuModal ({
    highScore,
    bestTime,
    activeSkinName,
    onStartGame,
    onOpenStageSelect,
    onOpenSkinModal,
    onOpenSettings,
}: MainMenuModalProps)
{
    return (
        <div className="main-menu-overlay">
            <div className="main-menu-card">
                <h1 className="main-menu-title">⚡ JO RUNNER ⚡</h1>
                <p className="main-menu-subtitle">Cyberpunk Slime Invasion</p>

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
                        <span className="menu-stat-label">🥋 Skin</span>
                        <span className="menu-stat-val">{activeSkinName}</span>
                    </div>
                </div>

                <div className="menu-buttons-list">
                    <button
                        className="menu-action-btn primary"
                        onClick={() => onStartGame('level-1')}
                        type="button"
                    >
                        ▶️ ເຂົ້າເກມ (Play Game)
                    </button>
                    <button
                        className="menu-action-btn secondary"
                        onClick={onOpenStageSelect}
                        type="button"
                    >
                        🚩 ເລືອກດ່ານ (Select Stage)
                    </button>
                    <button
                        className="menu-action-btn secondary"
                        onClick={onOpenSkinModal}
                        type="button"
                    >
                        🥋 ເລືອກຊຸດ (Skins & Costumes)
                    </button>
                    <button
                        className="menu-action-btn secondary"
                        onClick={onOpenSettings}
                        type="button"
                    >
                        ⚙️ ຕັ້ງຄ່າ (Settings)
                    </button>
                </div>
            </div>
        </div>
    );
}
