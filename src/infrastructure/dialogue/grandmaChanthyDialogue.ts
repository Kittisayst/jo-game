import { DialogueGraph } from '../../domain/entities/Dialogue';

export const grandmaChanthyDialogue: DialogueGraph = {
    id: 'grandma_chanthy',
    title: 'ແມ່ເຖົ້າ ຈັນທີ (Grandma Chanthy)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ແມ່ເຖົ້າ ຈັນທີ (Grandma Chanthy)',
            avatar: '🌿',
            line: 'ໂອ້ ຫຼານ Jo! ມາກິນນ້ຳສະໝູນໄພນຳແມ່ເຖົ້າກ່ອນແມ. ສວນຜັກທາງຂ້າງນີ້ມີພືດຢາດີຫຼາຍຊະນິດເລີຍນະ!',
            choices: [
                {
                    text: '🛒 ຂໍເບິ່ງຮ້ານຂອງແມ່ເຖົ້າແດ່ (ແລກວັດຖຸດິບ)',
                    to: 'open_shop',
                    action: 'open-shop',
                },
                {
                    text: '🌱 ພືດ ແລະ ສະໝູນໄພໃຊ້ເຮັດຫຍັງໄດ້ແດ່?',
                    to: 'herbs_info',
                },
                {
                    text: '🌾 ວິທີປູກ ແລະ ເກັບກ່ຽວໃນສວນຜັກ?',
                    to: 'garden_tips',
                },
                {
                    text: '🎁 ແມ່ເຖົ້າພໍມີເມັດພັນແບ່ງປັນບໍ່?',
                    to: 'give_gift',
                    action: 'give-herbalist-gift',
                },
                {
                    text: '👵 ດູແລສຸຂະພາບເດີແມ່ເຖົ້າ, ຂ້ອຍຂໍໂຕກ່ອນ!',
                    to: 'goodbye',
                },
            ],
        },
        open_shop: {
            id: 'open_shop',
            speaker: 'ແມ່ເຖົ້າ ຈັນທີ (Grandma Chanthy)',
            avatar: '🌿',
            line: 'ເບິ່ງເອົາຕາມໃຈເດີ້ຫຼານ! ແມ່ເຖົ້າບໍ່ເອົາເງິນດອກ, ເອົາພຽງສະໝູນໄພ ແລະ ແຮ່ທີ່ຫຼານເກັບມາແລກກັນ. ມື້ນີ້ມີຂອງພິເສດນຳນະ.',
            end: true,
        },
        herbs_info: {
            id: 'herbs_info',
            speaker: 'ແມ່ເຖົ້າ ຈັນທີ (Grandma Chanthy)',
            avatar: '🌿',
            line: 'ສະໝູນໄພສົດ (Herb) ສາມາດນຳໄປປຸງເປັນ ຢາຮັກສາ (Herb Potion) ຟື້ນຟູ 2 ຫົວໃຈ. ຫຼື ຖ້າປະສົມກັບປີກເຈຍ ຈະໄດ້ ຢາຂົນນົກ Feather Fall ເພີ່ມຄວາມໄວແລ່ນພຸ່ງ!',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'start',
                },
                {
                    text: '🌾 ວິທີປູກໃນສວນເດ?',
                    to: 'garden_tips',
                },
            ],
        },
        garden_tips: {
            id: 'garden_tips',
            speaker: 'ແມ່ເຖົ້າ ຈັນທີ (Grandma Chanthy)',
            avatar: '🌿',
            line: 'ເຂົ້າໄປໃນສວນຜັກ (Garden), ໃຊ້ຈົກພວນດິນ ຖ້າດິນພ້ອມແລ້ວໃຫ້ກົດຫວ່ານເມັດພັນ (Seed). ລໍຖ້າເວລາພືດຈະໃຫຍ່ແລ້ວໃຊ້ກ່ຽວເກັບເອົາຜົນຜະລິດໄດ້ຕະຫຼອດ!',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'start',
                },
                {
                    text: '🎁 ແມ່ເຖົ້າພໍມີເມັດພັນແບ່ງປັນບໍ່?',
                    to: 'give_gift',
                    action: 'give-herbalist-gift',
                },
            ],
        },
        give_gift: {
            id: 'give_gift',
            speaker: 'ແມ່ເຖົ້າ ຈັນທີ (Grandma Chanthy)',
            avatar: '🌿',
            line: 'ມີແທ້! ແມ່ເຖົ້າແບ່ງ ສະໝູນໄພ 2 ອັນ ແລະ ເມັດພັນສະໝູນໄພ 2 ຊຸດ ໃຫ້ຫຼານເອົາໄປທົດລອງປູກເດີ. ຂໍໃຫ້ຈະເລີນງອກງາມ!',
            choices: [
                {
                    text: '💚 ຂອບໃຈຫຼາຍໆເດີແມ່ເຖົ້າ!',
                    to: 'goodbye',
                },
            ],
        },
        goodbye: {
            id: 'goodbye',
            speaker: 'ແມ່ເຖົ້າ ຈັນທີ (Grandma Chanthy)',
            avatar: '🌿',
            line: 'ເດີນທາງປອດໄພເດີຫຼານ! ຢ່າລືມແວ່ມາກິນຊາສະໝູນໄພອີກເດີ.',
            end: true,
        },
    },
};

