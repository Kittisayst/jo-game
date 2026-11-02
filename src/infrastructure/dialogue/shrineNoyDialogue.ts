import { DialogueGraph } from '../../domain/entities/Dialogue';

export const shrineNoyDialogue: DialogueGraph = {
    id: 'shrine_noy',
    title: 'ນາງນ້ອຍ (Shrine Maiden Noy)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ນາງນ້ອຍ (Shrine Maiden Noy)',
            avatar: '⛩️',
            line: 'ສະບາຍດີຜູ້ກ້າ Jo. ຍິນດີຕ້ອນຮັບສູ່ສານປົກປ້ອງໝູ່ບ້ານທາງທິດຕາເວັນອອກ. ແສງແຫ່ງຄວາມສະຫງົບຈະຄຸ້ມຄອງເຈົ້າ...',
            choices: [
                {
                    text: '⛩️ ສານແຫ່ງນີ້ມີຄວາມສຳຄັນແນວໃດ?',
                    to: 'shrine_lore',
                },
                {
                    text: '🌙 ສັດຕູໃນຍາມກາງຄືນ (Night Creatures)?',
                    to: 'night_warning',
                },
                {
                    text: '🥠 ຂໍຄຳທຳນວາຍໂຊກຊະຕາ (Fortune Slip)?',
                    to: 'fortune_slip',
                },
                {
                    text: '✨ ຂໍພອນກ່ອນອອກເດີນທາງ',
                    to: 'blessing',
                    action: 'give-shrine-blessing',
                },
            ],
        },
        shrine_lore: {
            id: 'shrine_lore',
            speaker: 'ນາງນ້ອຍ (Shrine Maiden Noy)',
            avatar: '⛩️',
            line: 'ສານແຫ່ງນີ້ສ້າງຂຶ້ນເພື່ອປົກປັກຮັກສາເຂດແດນຂອງໝູ່ບ້ານ. ພະລັງແຫ່ງສານຈະຂັບໄລ່ໄອມະຫັນຕະໄພ ບໍ່ໃຫ້ສັດຕູຊົ່ວຮ້າຍກ້າວຂ້າມເຂົ້າມາໃນເຂດບ້ານໄດ້.',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'start',
                },
                {
                    text: '🌙 ລະວັງສັດຕູຕອນກາງຄືນແນວໃດ?',
                    to: 'night_warning',
                },
            ],
        },
        night_warning: {
            id: 'night_warning',
            speaker: 'ນາງນ້ອຍ (Shrine Maiden Noy)',
            avatar: '⛩️',
            line: 'ເມື່ອຕາເວັນຕົກດິນ, ຄວາມມືດຈະຄອບງຳດ່ານຜະຈົນໄພ. ຝູງດວງໄຟວິນຍານ (Night Wisp), ງູເງົາ (Night Shade) ແລະ ແມງຄາມກາງຄືນ ຈະອອກມາລ່າ. ຈົ່ງກຽມອາວຸດໃຫ້ພ້ອມ ຫຼື ນອນພັກທີ່ຕຽງ!',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'start',
                },
                {
                    text: '🥠 ຂໍຄຳທຳນວາຍໂຊກຊະຕາ?',
                    to: 'fortune_slip',
                },
            ],
        },
        fortune_slip: {
            id: 'fortune_slip',
            speaker: 'ນາງນ້ອຍ (Shrine Maiden Noy)',
            avatar: '⛩️',
            line: '🥠 "ໃບຊຽມຊີເລກທີ 9: ດວງດາວແຫ່ງປັນຍາສ່ອງສະຫວ່າງ! ວັນນີ້ການສຳຫຼວດດັນຈ້ຽນ ແລະ ການສອບເສັງຈະປະສົບຜົນສຳເລັດອັນຍິ່ງໃຫຍ່!"',
            choices: [
                {
                    text: '✨ ຂໍພອນກ່ອນອອກເດີນທາງ',
                    to: 'blessing',
                    action: 'give-shrine-blessing',
                },
                {
                    text: '🙏 ຂອບໃຈນາງນ້ອຍ!',
                    to: 'goodbye',
                },
            ],
        },
        blessing: {
            id: 'blessing',
            speaker: 'ນາງນ້ອຍ (Shrine Maiden Noy)',
            avatar: '⛩️',
            line: 'ຂໍໃຫ້ສາຍລົມແຫ່ງປັນຍາ ແລະ ຄວາມກ້າຫານ ປົກປ້ອງຄຸ້ມຄອງເຈົ້າໃນທຸກບາດກ້າວຂອງການເດີນທາງ!',
            end: true,
        },
        goodbye: {
            id: 'goodbye',
            speaker: 'ນາງນ້ອຍ (Shrine Maiden Noy)',
            avatar: '⛩️',
            line: 'ຂໍໃຫ້ໂຊກດີ ແລະ ກັບມາຢ້ຽມຢາມສານແຫ່ງນີ້ອີກເດີ Jo.',
            end: true,
        },
    },
};

