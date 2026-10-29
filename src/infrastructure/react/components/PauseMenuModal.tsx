import { getLevelItem } from '../../phaser/levelCatalog';

export interface PauseMenuModalProps
{
    currentLevel: string;
    isMuted: boolean;
    isMusicMuted: boolean;
    onResume: () => void;
    onToggleMute: () => void;
    onToggleMusic: () => void;
    onOpenSettings: () => void;
    onRestartLevel: () => void;
    onExitToMainMenu: () => void;
}

export function PauseMenuModal ({
    currentLevel,
    isMuted,
    isMusicMuted,
    onResume,
    onToggleMute,
    onToggleMusic,
    onOpenSettings,
    onRestartLevel,
    onExitToMainMenu,
}: PauseMenuModalProps)
{
    const levelLabel = getLevelItem(currentLevel)?.shortTitle || currentLevel;

    return (
        <div className="pause-menu-overlay" onClick={onResume}>
            <div className="pause-menu-card" onClick={e => e.stopPropagation()}>
                <div className="pause-header">
                    <div>
                        <h2 className="pause-title">⏸️ ຢຸດເກມຊົ່ວຄາວ</h2>
                        <span className="pause-subtitle">PAUSE MENU • ກົດ Esc / P ເພື່ອສືບຕໍ່</span>
                    </div>
                    <button
                        className="skin-close-btn"
                        onClick={onResume}
                        title="Close & Resume Game (Esc)"
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <div className="pause-stats-banner">
                    <div className="pause-stat-item">
                        <span className="pause-stat-label">🚩 ດ່ານ</span>
                        <span className="pause-stat-val">{levelLabel}</span>
                    </div>
                </div>

                {/* Quick Sound & Music Settings inside Pause Menu */}
                <div className="pause-audio-box">
                    <div className="pause-audio-row">
                        <div className="pause-audio-info">
                            <span className="pause-audio-icon">{isMuted ? '🔇' : '🔊'}</span>
                            <span className="pause-audio-name">ສຽງ Effect (SFX)</span>
                        </div>
                        <button
                            className={`settings-switch-btn ${isMuted ? 'off' : 'on'}`}
                            onClick={onToggleMute}
                            type="button"
                        >
                            {isMuted ? 'OFF' : 'ON'}
                        </button>
                    </div>

                    <div className="pause-audio-row">
                        <div className="pause-audio-info">
                            <span className="pause-audio-icon">{isMusicMuted ? '🔇' : '🎵'}</span>
                            <span className="pause-audio-name">ເພງ BGM Chiptune</span>
                        </div>
                        <button
                            className={`settings-switch-btn ${isMusicMuted ? 'off' : 'on'}`}
                            onClick={onToggleMusic}
                            type="button"
                        >
                            {isMusicMuted ? 'OFF' : 'ON'}
                        </button>
                    </div>
                </div>

                {/* Menu Actions */}
                <div className="pause-buttons-list">
                    <button
                        autoFocus
                        className="menu-action-btn primary pulse"
                        onClick={onResume}
                        type="button"
                    >
                        ▶️ ສືບຕໍ່ຫຼິ້ນ (Resume Game)
                    </button>

                    <button
                        className="menu-action-btn secondary"
                        onClick={onOpenSettings}
                        type="button"
                    >
                        ⚙️ ຕັ້ງຄ່າ & ຄູ່ມືບັງຄັບ (Settings & Guide)
                    </button>

                    <button
                        className="menu-action-btn secondary"
                        onClick={onRestartLevel}
                        type="button"
                    >
                        🔄 ເລີ່ມດ່ານນີ້ໃໝ່ (Restart Level)
                    </button>

                    <button
                        id="btn-exit-main-menu"
                        className="menu-action-btn danger"
                        onClick={onExitToMainMenu}
                        type="button"
                    >
                        🏠 ກັບໄປໜ້າຫຼັກ (Exit to Main Menu)
                    </button>
                </div>
            </div>
        </div>
    );
}
