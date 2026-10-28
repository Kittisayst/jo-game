import { DialogueGraph } from '../../domain/entities/Dialogue';

export const MERCHANT_DIALOGUE: DialogueGraph = {
    id: 'cyber_merchant',
    title: 'ແມ່ຄ້າໄຊເບີ ມິນາ (Cyber Merchant Mina)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ແມ່ຄ້າ ມິນາ (Merchant Mina)',
            avatar: '🛍️',
            line: 'ສະບາຍດີ! ຂ້ອຍແມ່ນ ມິນາ (Mina) ແມ່ຄ້າອາວຸດ ແລະ ໄອເທັມໄຊເບີແຫ່ງໝູ່ບ້ານນີ້! ມີຫຍັງໃຫ້ຂ້ອຍຊ່ວຍບໍ່?',
            choices: [
                {
                    text: '🛒 ເປີດຮ້ານຄ້າ (Open Cyber Shop)',
                    to: 'open_shop_node',
                },
                {
                    text: '⚔️ ອາວຸດແຕ່ລະອັນຕ່າງກັນແນວໃດ?',
                    to: 'weapons_info',
                },
                {
                    text: '⬆️ ການອັບເກຣດຕົວລະຄອນເຮັດວຽກແນວໃດ?',
                    to: 'upgrades_info',
                },
                {
                    text: '👋 ໄວ້ພົບກັນໃໝ່ (Goodbye)',
                    to: 'exit_node',
                },
            ],
        },
        open_shop_node: {
            id: 'open_shop_node',
            speaker: 'ແມ່ຄ້າ ມິນາ (Merchant Mina)',
            avatar: '🛍️',
            line: 'ຍິນດີຕ້ອນຮັບສູ່ຮ້ານຄ້າ! ເລືອກຊື້ອາວຸດໃໝ່, ອັບເກຣດສະແຕັດ, ຫຼື ຢາຟື້ນຟູພະລັງໄດ້ເລີຍ!',
            choices: [
                {
                    text: '✨ ຂອບໃຈຫຼາຍໆ!',
                    to: 'exit_node',
                },
            ],
        },
        weapons_info: {
            id: 'weapons_info',
            speaker: 'ແມ່ຄ້າ ມິນາ (Merchant Mina)',
            avatar: '🛍️',
            line: '🗡️ Cyber Saber: ດາບຟັນໄວ ໄລຍະປະຊິດ\n🔫 Plasma Blaster: ຍິງເລເຊີໄລຍະໄກ\n🔨 Thunder Hammer: ຄ້ອນສາຍຟ້າ ແຮງສອງເທົ່າ\n🥏 Cyber Disc: ຈານບິນບູມເມິແຣງ ບິນກັບມາຫາເຈົ້າ!',
            choices: [
                {
                    text: '🛒 ເບິ່ງຮ້ານຄ້າເລີຍ',
                    to: 'open_shop_node',
                },
                {
                    text: '🔙 ກັບໄປເມນູຫຼັກ',
                    to: 'start',
                },
            ],
        },
        upgrades_info: {
            id: 'upgrades_info',
            speaker: 'ແມ່ຄ້າ ມິນາ (Merchant Mina)',
            avatar: '🛍️',
            line: 'ເຈົ້າສາມາດອັບເກຣດ Max HP (+❤️), ຄວາມແຮງອາວຸດ (+Damage), ຄວາມໄວໂຈມຕີ, ແມ່ເຫຼັກດູດຫຼຽນ (Coin Magnet), ແລະ ທັກສະ Cyber Dash (ກົດ Shift ເພື່ອພຸ່ງຕົວ)!',
            choices: [
                {
                    text: '🛒 ເປີດຮ້ານຄ້າເລີຍ',
                    to: 'open_shop_node',
                },
                {
                    text: '🔙 ກັບໄປເມນູຫຼັກ',
                    to: 'start',
                },
            ],
        },
        exit_node: {
            id: 'exit_node',
            speaker: 'ແມ່ຄ້າ ມິນາ (Merchant Mina)',
            avatar: '🛍️',
            line: 'ຂໍໃຫ້ໂຊກດີໃນການຜະຈົນໄພ! ກົດ [J] ເພື່ອໂຈມຕີ, [Q] ເພື່ອປ່ຽນອາວຸດ, ແລະ [1-3] ເພື່ອໃຊ້ໄອເທັມ!',
        },
    },
};
