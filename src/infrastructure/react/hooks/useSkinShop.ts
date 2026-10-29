import { useState } from 'react';
import { purchaseSkinUseCase } from '../../../application/PurchaseSkinUseCase';
import { selectSkinUseCase } from '../../../application/SelectSkinUseCase';
import { STARTER_BOOK_CREDIT_RESERVE } from '../../../domain/entities/SaveData';
import { soundManager } from '../../audio/SoundManager';
import { entities, repositories } from '../../composition';
import { autoSaveGame } from '../../saveSnapshot';

/** State and actions behind the skin shop: buying with Credit and wearing a skin. */
export function useSkinShop (onWalletChanged: () => void)
{
    const [activeSkinId, setActiveSkinId] = useState(entities.skinManager.activeSkinId);
    const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
    const [skinNotice, setSkinNotice] = useState<string | null>(null);

    const buySkin = (skinId: string) =>
    {
        // Until the first textbook is bought, its price stays untouchable
        const reserve = entities.books['book-ch1']?.isUnlocked ? 0 : STARTER_BOOK_CREDIT_RESERVE;
        const result = purchaseSkinUseCase(entities.wallet, entities.skinManager, skinId, reserve);

        if (result.success)
        {
            onWalletChanged();
            setSkinNotice('🎉 ຊື້ຊຸດສຳເລັດ! ກົດ "ໃສ່" ເພື່ອໃສ່ຊຸດນີ້');
            soundManager.playBuy();
            autoSaveGame();
            return;
        }

        soundManager.playHurt();
        const reasons: Record<typeof result.reason, string> = {
            unknown_skin: '❌ ບໍ່ພົບຊຸດນີ້',
            already_owned: 'ເຈົ້າມີຊຸດນີ້ແລ້ວ',
            insufficient_credit: '❌ Credit ບໍ່ພໍ — ຮຽນ ແລະ ສອບເພື່ອຫາ Credit ເພີ່ມ',
            reserved_for_textbook: `📚 ເກັບ ${STARTER_BOOK_CREDIT_RESERVE} Credit ໄວ້ຊື້ປຶ້ມຕຳລາບົດທີ 1 ກ່ອນ`,
        };
        setSkinNotice(reasons[result.reason]);
    };

    const equipSkin = (skinId: string) =>
    {
        if (selectSkinUseCase(entities.skinManager, skinId, repositories.skin))
        {
            setActiveSkinId(skinId);
            autoSaveGame();
        }
    };

    const openSkinModal = () => setIsSkinModalOpen(true);

    const closeSkinModal = () =>
    {
        setIsSkinModalOpen(false);
        setSkinNotice(null);
    };

    return {
        activeSkinId,
        setActiveSkinId,
        isSkinModalOpen,
        skinNotice,
        openSkinModal,
        closeSkinModal,
        buySkin,
        equipSkin,
    };
}
