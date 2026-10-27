export interface StageSelectModalProps
{
    currentLevel: string;
    onClose: () => void;
    onSelectStage: (stageKey: string) => void;
}

export function StageSelectModal ({
    currentLevel,
    onClose,
    onSelectStage,
}: StageSelectModalProps)
{
    return (
        <div className="skin-modal-overlay" onClick={onClose}>
            <div className="settings-modal-card" onClick={e => e.stopPropagation()}>
                <div className="skin-modal-header">
                    <h2>🚩 ເລືອກດ່ານ (Select Stage)</h2>
                    <button
                        className="skin-close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                <div className="stage-select-grid">
                    <div
                        className={`stage-select-card ${currentLevel === 'level-1' ? 'active-stage' : ''}`}
                        onClick={() => onSelectStage('level-1')}
                    >
                        <div>
                            <strong>ດ່ານ 1: Green Plains</strong>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                ທົ່ງຫຍ້າຂຽວ, ເກັບຫຼຽນ, ຢຽບ Slime
                            </div>
                        </div>
                        <span>▶️ ຫຼິ້ນ</span>
                    </div>

                    <div
                        className={`stage-select-card ${currentLevel === 'level-2' ? 'active-stage' : ''}`}
                        onClick={() => onSelectStage('level-2')}
                    >
                        <div>
                            <strong>ດ່ານ 2: Sky Islands</strong>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                ພື້ນເລື່ອນ Hover, ດົງໜາມ Spikes, Power-ups
                            </div>
                        </div>
                        <span>▶️ ຫຼິ້ນ</span>
                    </div>

                    <div
                        className={`stage-select-card ${currentLevel === 'level-3' ? 'active-stage' : ''}`}
                        onClick={() => onSelectStage('level-3')}
                    >
                        <div>
                            <strong>ດ່ານ 3: King Slime Boss Arena 👑</strong>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                ສູ້ Boss ຍັກ King Slime, ແຖບເລືອດ Boss HP
                            </div>
                        </div>
                        <span>▶️ ຫຼິ້ນ</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
