import { useEffect, useState } from 'react';
import { AVAILABLE_SKINS, SkinDefinition, SkinManager } from '../../../domain/entities/Skin';

export interface SkinModalProps
{
    activeSkinId: string;
    walletBalance: number;
    /** Credit the shop will not spend (the price of the first textbook, until it is bought). */
    reservedCredit: number;
    skinManager: SkinManager;
    /** Short message about the last purchase attempt (success or why it failed). */
    notice?: string | null;
    onClose: () => void;
    onBuySkin: (skinId: string) => void;
    onEquipSkin: (skinId: string) => void;
}

/** A skin sheet is 12 frames of 32×48; frames 0–3 are the idle loop. */
function SkinSprite ({ skinId, scale }: { skinId: string; scale: number })
{
    return (
        <span
            className="outfit-sprite"
            aria-hidden="true"
            style={{
                width: 32 * scale,
                height: 48 * scale,
                backgroundImage: `url('assets/characters/player-skin-${skinId}.png')`,
                backgroundSize: `${384 * scale}px ${48 * scale}px`,
                ['--frames-width' as string]: `${-128 * scale}px`,
            } as React.CSSProperties}
        />
    );
}

type Standing = 'equipped' | 'owned' | 'buy' | 'too-poor' | 'reserved';

function standingOf (skin: SkinDefinition, isOwned: boolean, isEquipped: boolean, balance: number, reserved: number): Standing
{
    if (isEquipped) return 'equipped';
    if (isOwned) return 'owned';
    if (balance < skin.price) return 'too-poor';
    if (balance - skin.price < reserved) return 'reserved';
    return 'buy';
}

/**
 * Mina's shop: the list of Skins on the left, a large preview on the right. Moving the highlight
 * only tries a Skin on inside this window; the hero changes when "wear" is pressed.
 * Up/Down (or W/S) choose, Enter buys or wears, and the mouse works as usual. Esc is handled by the app.
 */
export function SkinModal ({
    activeSkinId,
    walletBalance,
    reservedCredit,
    skinManager,
    notice,
    onClose,
    onBuySkin,
    onEquipSkin,
}: SkinModalProps)
{
    const [previewId, setPreviewId] = useState(activeSkinId);
    const preview = AVAILABLE_SKINS.find(s => s.id === previewId) ?? AVAILABLE_SKINS[0];

    const isOwned = skinManager.isOwned(preview.id);
    const isEquipped = activeSkinId === preview.id;
    const standing = standingOf(preview, isOwned, isEquipped, walletBalance, reservedCredit);

    const act = () =>
    {
        if (standing === 'owned') onEquipSkin(preview.id);
        else if (standing === 'buy' || standing === 'too-poor' || standing === 'reserved') onBuySkin(preview.id);
    };

    useEffect(() =>
    {
        const onKeyDown = (e: KeyboardEvent) =>
        {
            const index = AVAILABLE_SKINS.findIndex(s => s.id === previewId);
            if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S')
            {
                e.preventDefault();
                setPreviewId(AVAILABLE_SKINS[(index + 1) % AVAILABLE_SKINS.length].id);
            }
            else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W')
            {
                e.preventDefault();
                setPreviewId(AVAILABLE_SKINS[(index - 1 + AVAILABLE_SKINS.length) % AVAILABLE_SKINS.length].id);
            }
            else if (e.key === 'Enter')
            {
                e.preventDefault();
                act();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    });

    const reasons: Record<Standing, string | null> = {
        'equipped': null,
        'owned': null,
        'buy': null,
        'too-poor': `Credit ບໍ່ພໍ ຂາດອີກ ${preview.price - walletBalance} (ຮຽນ ແລະສອບເພື່ອຫາ Credit ເພີ່ມ)`,
        'reserved': `ເກັບ ${reservedCredit} Credit ໄວ້ຊື້ປຶ້ມຕຳລາບົດທີ 1 ກ່ອນ`,
    };

    return (
        <div className="outfit-overlay" onClick={onClose}>
            <div className="outfit-card" role="dialog" aria-modal="true" aria-label="ຮ້ານຊຸດຂອງ Mina" onClick={e => e.stopPropagation()}>
                <header className="outfit-header">
                    <span className="outfit-avatar" aria-hidden="true">🛍️</span>
                    <div className="outfit-title">
                        <h2>ຮ້ານຊຸດຂອງ Mina</h2>
                        <p>ຊື້ແລ້ວເປັນຂອງເຈົ້າຕະຫຼອດ · ລອງໃສ່ໄດ້ໂດຍບໍ່ເສຍ Credit</p>
                    </div>
                    <span className="outfit-wallet" title="Credit ຂອງເຈົ້າ">🎓 {walletBalance}</span>
                    <button className="outfit-close" aria-label="Close" onClick={onClose} type="button">✕</button>
                </header>

                <div className="outfit-body">
                    <ul className="outfit-list" role="listbox" aria-label="ຊຸດ">
                        {AVAILABLE_SKINS.map(skin =>
                        {
                            const owned = skinManager.isOwned(skin.id);
                            return (
                                <li key={skin.id} role="option" aria-selected={skin.id === previewId}>
                                    <button
                                        className={`outfit-row${skin.id === previewId ? ' is-selected' : ''}`}
                                        data-skin-id={skin.id}
                                        onClick={() => setPreviewId(skin.id)}
                                        onMouseEnter={() => setPreviewId(skin.id)}
                                        type="button"
                                    >
                                        <SkinSprite skinId={skin.id} scale={1.5} />
                                        <span className="outfit-row-text">
                                            <span className="outfit-row-name">{skin.name}</span>
                                            <span className={`outfit-row-tag${activeSkinId === skin.id ? ' is-worn' : owned ? ' is-owned' : ''}`}>
                                                {activeSkinId === skin.id ? 'ໃສ່ຢູ່' : owned ? 'ເປັນຂອງເຈົ້າ' : `🎓 ${skin.price}`}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    <section className="outfit-detail" aria-live="polite">
                        <div className="outfit-stage">
                            <SkinSprite skinId={preview.id} scale={6} />
                            <span className="outfit-pedestal" aria-hidden="true" />
                        </div>

                        <h3>{preview.name}</h3>
                        <p className="outfit-desc">{preview.description}</p>

                        {!isEquipped && (
                            <p className="outfit-tryon">👁 ກຳລັງລອງໃສ່ ຕົວລະຄອນໃນເກມຍັງບໍ່ປ່ຽນ</p>
                        )}

                        {!isOwned && (
                            <p className="outfit-price">
                                ລາຄາ <strong>🎓 {preview.price}</strong>
                                <span className="outfit-after">
                                    Credit ຫຼັງຊື້: {Math.max(0, walletBalance - preview.price)}
                                </span>
                            </p>
                        )}

                        {reasons[standing] && <p className="outfit-reason" role="status">{reasons[standing]}</p>}

                        <button
                            className={`outfit-action is-${standing}`}
                            disabled={standing === 'equipped'}
                            onClick={act}
                            type="button"
                        >
                            {standing === 'equipped' && 'ໃສ່ຢູ່ແລ້ວ'}
                            {standing === 'owned' && 'ໃສ່ຊຸດນີ້ [Enter]'}
                            {standing === 'buy' && `ຊື້ 🎓 ${preview.price} [Enter]`}
                            {(standing === 'too-poor' || standing === 'reserved') && `ຊື້ 🎓 ${preview.price}`}
                        </button>

                        {notice && <p className="outfit-notice" role="status">{notice}</p>}
                    </section>
                </div>

                <footer className="outfit-footer">
                    <span><kbd>↑</kbd><kbd>↓</kbd> ເລືອກ</span>
                    <span><kbd>Enter</kbd> ຊື້ / ໃສ່</span>
                    <span><kbd>Esc</kbd> ປິດ</span>
                </footer>
            </div>
        </div>
    );
}
