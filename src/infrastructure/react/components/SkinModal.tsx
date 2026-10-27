import { AVAILABLE_SKINS, SkinManager } from '../../../domain/entities/Skin';
import { skinUnlockScore } from '../../../application/SelectSkinUseCase';

export interface SkinModalProps
{
    score: number;
    highScore: number;
    activeSkinId: string;
    skinManager: SkinManager;
    onClose: () => void;
    onEquipSkin: (skinId: string) => void;
}

export function SkinModal ({
    score,
    highScore,
    activeSkinId,
    skinManager,
    onClose,
    onEquipSkin,
}: SkinModalProps)
{
    return (
        <div className="skin-modal-overlay" onClick={onClose}>
            <div className="skin-modal-card" onClick={e => e.stopPropagation()}>
                <div className="skin-modal-header">
                    <h2>🥋 Character Skins & Costumes</h2>
                    <button
                        className="skin-close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>
                <div className="skin-grid">
                    {AVAILABLE_SKINS.map(skin =>
                    {
                        const playerBestScore = skinUnlockScore(score, highScore);
                        const isUnlocked = skinManager.isSkinUnlocked(skin.id, playerBestScore);
                        const isEquipped = activeSkinId === skin.id;

                        return (
                            <div
                                key={skin.id}
                                className={`skin-card ${isEquipped ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
                            >
                                <div className="skin-card-header">
                                    <div
                                        className="skin-swatch"
                                        style={{ background: skin.colorHex }}
                                    />
                                    <div className="skin-title-wrap">
                                        <span className="skin-name">{skin.name}</span>
                                        <span className="skin-desc">{skin.description}</span>
                                    </div>
                                </div>
                                <div className="skin-footer">
                                    <span className={`skin-unlock-info ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                        {isUnlocked ? '✅ Unlocked' : `🔒 Needs ${skin.unlockScore} pts`}
                                    </span>
                                    {isEquipped ? (
                                        <button className="skin-btn equipped" disabled type="button">
                                            Equipped
                                        </button>
                                    ) : isUnlocked ? (
                                        <button
                                            className="skin-btn equip"
                                            onClick={() => onEquipSkin(skin.id)}
                                            type="button"
                                        >
                                            Equip
                                        </button>
                                    ) : (
                                        <button className="skin-btn locked" disabled type="button">
                                            Locked
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
