import { useEffect, useState } from 'react';
import { allowPortrait, isPortraitBlocked, onOrientationChange } from '../../orientation';

/** The full-screen "turn your phone sideways" message. Shown only on a touch screen held upright (see orientation.ts). */
export function RotateOverlay ()
{
    const [blocked, setBlocked] = useState(isPortraitBlocked);

    useEffect(() => onOrientationChange(() => setBlocked(isPortraitBlocked())), []);

    if (!blocked) return null;

    return (
        <div className="rotate-overlay" role="alertdialog" aria-modal="true" aria-label="ຫັນໂທລະສັບເປັນແນວນອນ" data-testid="rotate-overlay">
            <div className="rotate-phone" aria-hidden="true">
                <div className="rotate-phone-body" />
            </div>
            <h2 className="rotate-title">ຫັນໂທລະສັບເປັນແນວນອນ</h2>
            <p className="rotate-text">ເກມນີ້ຫຼິ້ນໃນແນວນອນ. ເປີດ auto-rotate ແລ້ວຫັນໂທລະສັບ, ເກມຖືກຢຸດໄວ້ໃຫ້ກ່ອນ.</p>
            <p className="rotate-text-en">Rotate your phone sideways to play</p>
            <button type="button" className="rotate-continue" data-testid="rotate-continue" onClick={allowPortrait}>
                ຫຼິ້ນແນວຕັ້ງຕໍ່ (Keep playing upright)
            </button>
        </div>
    );
}
