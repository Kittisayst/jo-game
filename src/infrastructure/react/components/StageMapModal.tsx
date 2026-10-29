import { LEVEL_CATALOG, LevelCatalogItem } from '../../phaser/levelCatalog';
import { StageProgression } from '../../../domain/entities/StageProgression';
import { soundManager } from '../../audio/SoundManager';

export interface StageMapModalProps
{
    currentLevel: string;
    stageProgression: StageProgression;
    onClose: () => void;
    onSelectStage: (stageKey: string) => void;
}

export function StageMapModal ({
    currentLevel,
    stageProgression,
    onClose,
    onSelectStage,
}: StageMapModalProps)
{
    const handleSelect = (stage: LevelCatalogItem) =>
    {
        const isUnlocked = stageProgression.isStageUnlocked(stage.key);
        if (!isUnlocked)
        {
            soundManager.playHurt();
            return;
        }

        soundManager.playCoin();
        onSelectStage(stage.key);
    };

    return (
        <div className="stage-map-overlay" onClick={onClose}>
            <div className="stage-map-card" onClick={e => e.stopPropagation()}>
                <div className="stage-map-header">
                    <div className="stage-map-title-group">
                        <span className="stage-map-icon">🗺️</span>
                        <div>
                            <h2>ແຜນທີ່ດ່ານຜະຈົນໄພ (World Map)</h2>
                            <p className="stage-map-subtitle">ເລືອກດ່ານທີ່ຕ້ອງການເດີນທາງໄປ ຫຼື ຫຼິ້ນຊ້ຳ</p>
                        </div>
                    </div>
                    <button
                        className="skin-close-btn"
                        onClick={onClose}
                        type="button"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="stage-map-roadmap">
                    {LEVEL_CATALOG.map((stage, idx) =>
                    {
                        const isUnlocked = stageProgression.isStageUnlocked(stage.key);
                        const isCompleted = stageProgression.isStageCompleted(stage.key);
                        const isCurrent = currentLevel === stage.key;

                        let statusBadge = (
                            <span className="stage-badge status-locked">
                                🔒 ຍັງລັອກຢູ່
                            </span>
                        );

                        if (isCompleted)
                        {
                            statusBadge = (
                                <span className="stage-badge status-completed">
                                    ⭐ ຜ່ານແລ້ວ
                                </span>
                            );
                        }
                        else if (isUnlocked)
                        {
                            statusBadge = (
                                <span className="stage-badge status-unlocked">
                                    ▶️ ພ້ອມຫຼິ້ນ
                                </span>
                            );
                        }

                        const cardClass = [
                            'stage-map-node',
                            isUnlocked ? 'node-unlocked' : 'node-locked',
                            isCompleted ? 'node-completed' : '',
                            isCurrent ? 'node-current' : '',
                        ]
                            .filter(Boolean)
                            .join(' ');

                        return (
                            <div key={stage.key} className="stage-map-step">
                                <div
                                    className={cardClass}
                                    onClick={() => isUnlocked && handleSelect(stage)}
                                    role="button"
                                    tabIndex={isUnlocked ? 0 : -1}
                                >
                                    <div className="stage-node-header">
                                        <span className="stage-tag">{stage.tag}</span>
                                        {statusBadge}
                                    </div>

                                    <div className="stage-node-icon-wrapper">
                                        <span className="stage-large-icon">{stage.badgeIcon}</span>
                                        {isCurrent && (
                                            <span className="stage-current-pin">📍 ປັດຈຸບັນ</span>
                                        )}
                                    </div>

                                    <div className="stage-node-info">
                                        <h3 className="stage-node-name">{stage.name}</h3>
                                        <p className="stage-node-desc">{stage.description}</p>
                                    </div>

                                    <div className="stage-node-actions">
                                        {isUnlocked ? (
                                            <button
                                                className={`stage-action-btn ${isCurrent ? 'btn-current' : isCompleted ? 'btn-replay' : 'btn-enter'}`}
                                                type="button"
                                                onClick={e =>
                                                {
                                                    e.stopPropagation();
                                                    handleSelect(stage);
                                                }}
                                            >
                                                {isCurrent
                                                    ? '▶️ ດ່ານປັດຈຸບັນ'
                                                    : isCompleted
                                                        ? '🔄 ຫຼິ້ນຊ້ຳ'
                                                        : '⚔️ ເຂົ້າຫຼິ້ນ'}
                                            </button>
                                        ) : (
                                            <button
                                                className="stage-action-btn btn-locked"
                                                type="button"
                                                disabled
                                            >
                                                🔒 ຕ້ອງຜ່ານດ່ານກ່ອນໜ້າ
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {idx < LEVEL_CATALOG.length - 1 && (
                                    <div
                                        className={`stage-connector ${stageProgression.isStageCompleted(stage.key) ? 'connector-active' : ''}`}
                                    >
                                        <span className="connector-arrow">➔</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="stage-map-footer">
                    <span>💡 ຄຳແນະນຳ: ຜ່ານແຕ່ລະດ່ານເພື່ອປົດລັອກດ່ານຕໍ່ໄປ! ຍ່າງເຂົ້າປະຕູ Portal ໃນໝູ່ບ້ານໄດ້ຕະຫຼອດເວລາ.</span>
                </div>
            </div>
        </div>
    );
}
