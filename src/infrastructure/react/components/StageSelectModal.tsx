import { LEVEL_CATALOG } from '../../phaser/levelCatalog';

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
                    {LEVEL_CATALOG.map(level =>
                    {
                        const isActive = currentLevel === level.key;
                        return (
                            <div
                                key={level.key}
                                className={`stage-select-card ${isActive ? 'active-stage' : ''}`}
                                onClick={() => onSelectStage(level.key)}
                            >
                                <div>
                                    <strong>{level.name}</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        {level.description}
                                    </div>
                                </div>
                                <span>▶️ ຫຼິ້ນ</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
