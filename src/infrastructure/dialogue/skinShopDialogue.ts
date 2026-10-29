import { DialogueGraph } from '../../domain/entities/Dialogue';
import { STARTER_BOOK_CREDIT_RESERVE } from '../../domain/entities/SaveData';

/** The action Mina's "look at the outfits" choice announces; the UI answers by opening the Skin shop. */
export const OPEN_SKIN_SHOP_ACTION = 'open-skin-shop';

/**
 * What Mina says when the player talks to her. Until the first textbook is bought she also
 * reminds the player to keep its price, because the shop refuses to spend that Credit.
 */
export function createSkinShopDialogue (hasBoughtFirstBook: boolean): DialogueGraph
{
    const greeting = 'ຍິນດີຕ້ອນຮັບ! ຊຸດໃໝ່ຊ່ວຍໃຫ້ເຈົ້າເດັ່ນໃນການເດີນທາງ ແຕ່ຈ່າຍດ້ວຍ Credit ທີ່ໄດ້ຈາກການຮຽນເທົ່ານັ້ນນະ.';
    const reminder = ` ເກັບ ${STARTER_BOOK_CREDIT_RESERVE} Credit ໄວ້ຊື້ປຶ້ມຕຳລາກ່ອນນະ.`;

    return {
        id: 'skin_shop',
        title: 'Mina ຜູ້ຂາຍຊຸດ (Skin shop)',
        startNodeId: 'start',
        nodes: {
            start: {
                id: 'start',
                speaker: 'Mina',
                avatar: '🛍️',
                line: hasBoughtFirstBook ? greeting : greeting + reminder,
                choices: [
                    { text: '👗 ເບິ່ງຊຸດ', to: 'end', action: OPEN_SKIN_SHOP_ACTION },
                    { text: '👋 ໄວ້ກ່ອນ', to: 'end' },
                ],
            },
        },
    };
}
