export interface SettingsModalProps
{
    isMuted: boolean;
    isMusicMuted: boolean;
    onClose: () => void;
    onToggleMute: () => void;
    onToggleMusic: () => void;
    onClearAllData: () => void;
}

export function SettingsModal ({
    isMuted,
    isMusicMuted,
    onClose,
    onToggleMute,
    onToggleMusic,
    onClearAllData,
}: SettingsModalProps)
{
    return (
        <div className="skin-modal-overlay" onClick={onClose}>
            <div className="settings-modal-card" onClick={e => e.stopPropagation()}>
                <div className="skin-modal-header">
                    <h2>⚙️ ຕັ້ງຄ່າ (Game Settings)</h2>
                    <button
                        className="skin-close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <div className="settings-section">
                    <div className="settings-section-title">🔊 Audio Preferences</div>
                    <div className="settings-toggle-row">
                        <span className="settings-row-label">
                            {isMuted ? '🔇' : '🔊'} Master Sound (SFX)
                        </span>
                        <button
                            className={`settings-switch-btn ${isMuted ? 'off' : 'on'}`}
                            onClick={onToggleMute}
                            type="button"
                        >
                            {isMuted ? 'OFF' : 'ON'}
                        </button>
                    </div>
                    <div className="settings-toggle-row">
                        <span className="settings-row-label">
                            {isMusicMuted ? '🔇' : '🎵'} 8-Bit Chiptune Music (BGM)
                        </span>
                        <button
                            className={`settings-switch-btn ${isMusicMuted ? 'off' : 'on'}`}
                            onClick={onToggleMusic}
                            type="button"
                        >
                            {isMusicMuted ? 'OFF' : 'ON'}
                        </button>
                    </div>
                </div>

                <div className="settings-section">
                    <div className="settings-section-title">🎮 Controls Guide</div>
                    <div className="controls-guide-grid">
                        <div className="control-item">
                            <span className="control-key">⬅️ ➡️ / A D</span>
                            <span>Move Left/Right</span>
                        </div>
                        <div className="control-item">
                            <span className="control-key">⬆️ / W / Space</span>
                            <span>Jump / Double Jump</span>
                        </div>
                        <div className="control-item">
                            <span className="control-key">M</span>
                            <span>Mute Audio</span>
                        </div>
                        <div className="control-item">
                            <span className="control-key">B</span>
                            <span>Toggle BGM</span>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <div className="settings-section-title">⚠️ Data Management</div>
                    <button
                        className="menu-action-btn secondary"
                        onClick={onClearAllData}
                        style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        type="button"
                    >
                        🗑️ ລ້າງຄະແນນ & ຂໍ້ມູນທັງໝົດ (Reset Saved Data)
                    </button>
                </div>
            </div>
        </div>
    );
}
