import { AVAILABLE_SKINS, SkinManager } from '../../../domain/entities/Skin';

export interface SkinModalProps
{
    activeSkinId: string;
    walletBalance: number;
    skinManager: SkinManager;
    /** Short message about the last purchase attempt (success or why it failed). */
    notice?: string | null;
    onClose: () => void;
    onBuySkin: (skinId: string) => void;
    onEquipSkin: (skinId: string) => void;
}

export function SkinModal ({
    activeSkinId,
    walletBalance,
    skinManager,
    notice,
    onClose,
    onBuySkin,
    onEquipSkin,
}: SkinModalProps)
{
    return (
        <div className="skin-modal-overlay" onClick={onClose}>
            <div className="skin-modal-card" onClick={e => e.stopPropagation()}>
                <div className="skin-modal-header">
                    <h2>🥋 ຮ້ານຊຸດຕົວລະຄອນ (Skins)</h2>
                    <span className="skin-wallet" title="Credit ຂອງເຈົ້າ">🎓 {walletBalance}</span>
                    <button
                        aria-label="Close"
                        className="skin-close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {notice && <div className="skin-notice" role="status">{notice}</div>}

                <div className="skin-grid">
                    {AVAILABLE_SKINS.map(skin =>
                    {
                        const isOwned = skinManager.isOwned(skin.id);
                        const isEquipped = activeSkinId === skin.id;

                        return (
                            <div
                                key={skin.id}
                                className={`skin-card ${isEquipped ? 'active' : ''} ${!isOwned ? 'locked' : ''}`}
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
                                    <span className={`skin-unlock-info ${isOwned ? 'unlocked' : 'locked'}`}>
                                        {isOwned ? '✅ ເປັນເຈົ້າຂອງແລ້ວ' : `🎓 ${skin.price} Credit`}
                                    </span>
                                    {isEquipped ? (
                                        <button className="skin-btn equipped" disabled type="button">
                                            ໃສ່ຢູ່
                                        </button>
                                    ) : isOwned ? (
                                        <button
                                            className="skin-btn equip"
                                            onClick={() => onEquipSkin(skin.id)}
                                            type="button"
                                        >
                                            ໃສ່
                                        </button>
                                    ) : (
                                        <button
                                            className="skin-btn buy"
                                            onClick={() => onBuySkin(skin.id)}
                                            type="button"
                                        >
                                            ຊື້
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
