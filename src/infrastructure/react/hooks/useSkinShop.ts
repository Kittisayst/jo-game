import { useEffect, useRef, useState } from 'react';
import { purchaseSkinUseCase } from '../../../application/PurchaseSkinUseCase';
import { selectSkinUseCase } from '../../../application/SelectSkinUseCase';
import { AVAILABLE_SKINS } from '../../../domain/entities/Skin';
import { STARTER_BOOK_CREDIT_RESERVE } from '../../../domain/entities/SaveData';
import { soundManager } from '../../audio/SoundManager';
import { entities, repositories } from '../../composition';
import { EventBus } from '../../EventBus';
import { autoSaveGame } from '../../saveSnapshot';

/**
 * State and actions behind the Skin shop: buying with Credit and wearing a skin.
 * `isShopAvailable` says whether the shop can open right now (only in the village).
 */
export function useSkinShop (onWalletChanged: () => void, isShopAvailable: () => boolean)
{
    const [activeSkinId, setActiveSkinId] = useState(entities.skinManager.activeSkinId);
    const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
    const [skinNotice, setSkinNotice] = useState<string | null>(null);

    // Until the first textbook is bought, its price stays untouchable
    const reservedCredit = entities.books['book-ch1']?.isUnlocked ? 0 : STARTER_BOOK_CREDIT_RESERVE;

    // The shop shows every Skin's sheet, so fetch them up front and it never opens with empty previews
    useEffect(() =>
    {
        for (const skin of AVAILABLE_SKINS)
        {
            new Image().src = `assets/characters/player-skin-${skin.id}.png`;
        }
    }, []);

    // While the shop is open the hero stands still, as during a conversation
    const wasOpen = useRef(false);
    useEffect(() =>
    {
        if (isSkinModalOpen !== wasOpen.current)
        {
            wasOpen.current = isSkinModalOpen;
            EventBus.emit('dialogue-open-state', isSkinModalOpen);
        }
    }, [isSkinModalOpen]);

    const buySkin = (skinId: string) =>
    {
        const result = purchaseSkinUseCase(entities.wallet, entities.skinManager, skinId, reservedCredit);

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

    // The Skin shop is Mina's, in the Village Hub; nothing else may open it
    const openSkinModal = () =>
    {
        if (isShopAvailable()) setIsSkinModalOpen(true);
    };

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
        reservedCredit,
        openSkinModal,
        closeSkinModal,
        buySkin,
        equipSkin,
    };
}
