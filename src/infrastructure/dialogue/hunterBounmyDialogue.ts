import { DialogueGraph } from '../../domain/entities/Dialogue';

export const HUNTER_BOUNMY_DIALOGUE: DialogueGraph = {
    id: 'hunter_bounmy',
    title: 'ນາຍພານ ບຸນມີ (Hunter Bounmy - Dungeon Guide)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ນາຍພານ ບຸນມີ (Hunter Bounmy)',
            avatar: '🏹',
            line: 'ຢຸດກ່ອນ ນັກຮົບ Jo! ທາງຂ້າງໜ້າຄື ປະຕູຄຸກໃຕ້ດິນບູຮານ (Ancient Catacombs)... ມັນເຕັມໄປດ້ວຍອັນຕະລາຍ!',
            next: 'intro_choices',
        },
        intro_choices: {
            id: 'intro_choices',
            speaker: 'ນາຍພານ ບຸນມີ (Hunter Bounmy)',
            avatar: '🏹',
            line: 'ເພື່ອນຮ່ວມງານຂອງຂ້ອຍ "ນັກບູຮານຄະດີ ສົມຊາຍ" ລົງໄປສຳຫຼວດຂ້າງໃນແລ້ວຍັງບໍ່ກັບມາເລີຍ... ເຈົ້າກ້າຫານພໍທີ່ຈະຊ່ວຍລາວບໍ່?',
            choices: [
                {
                    text: '🦇 ໃນຄຸກໃຕ້ດິນມີມອນສເຕີຫຍັງແດ່?',
                    to: 'monsters_info',
                },
                {
                    text: '⚔️ ຂ້ອຍພ້ອມແລ້ວ! ເປີດປະຕູດັນຈ້ຽນໃຫ້ຂ້ອຍແນ່',
                    to: 'enter_dungeon',
                    action: 'enter-dungeon',
                },
                {
                    text: '📜 ຂ້ອຍຢາກກວດເບິ່ງກະດານພາລະກິດກ່ອນ',
                    to: 'open_quests',
                    action: 'open-quest-board',
                },
                {
                    text: '👋 ຂໍກຽມຕົວອີກໜ້ອຍໜຶ່ງກ່ອນ',
                    to: 'farewell',
                },
            ],
        },
        monsters_info: {
            id: 'monsters_info',
            speaker: 'ນາຍພານ ບຸນມີ (Hunter Bounmy)',
            avatar: '🏹',
            line: 'ລະວັງ 3 ສັດຮ້າຍ: 1) "ເຈຍຖ້ຳ" ບິນໂສບຈາກເພດານ, 2) "ແມງມຸມຄຸກ" ໄວ ແລະ ກະໂດດພຸ່ງກັດ, 3) "ໂຄງກະດູກນັກຮົບ" ຖືດາບກະດູກຕີໜັກຫຼາຍ!',
            choices: [
                {
                    text: '⚔️ ເຂົ້າໃຈແລ້ວ! ສົ່ງຂ້ອຍລົງດັນຈ້ຽນເລີຍ',
                    to: 'enter_dungeon',
                    action: 'enter-dungeon',
                },
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'intro_choices',
                },
            ],
        },
        enter_dungeon: {
            id: 'enter_dungeon',
            speaker: 'ນາຍພານ ບຸນມີ (Hunter Bounmy)',
            avatar: '🏹',
            line: 'ຂໍໃຫ້ເທບແຫ່ງປັນຍາຄຸ້ມຄອງເຈົ້າ! ຊອກຫາ ສົມຊາຍ ທີ່ແຄ້ມໄຟກາງດັນຈ້ຽນໃຫ້ພົບເດີ!',
            end: true,
        },
        open_quests: {
            id: 'open_quests',
            speaker: 'ນາຍພານ ບຸນມີ (Hunter Bounmy)',
            avatar: '🏹',
            line: 'ເຈົ້າສາມາດຮັບລາງວັນພິເສດຈາກການປາບມອນສເຕີໃນດັນຈ້ຽນໄດ້ທີ່ກະດານພາລະກິດ.',
            end: true,
        },
        farewell: {
            id: 'farewell',
            speaker: 'ນາຍພານ ບຸນມີ (Hunter Bounmy)',
            avatar: '🏹',
            line: 'ກຽມອາວຸດ, ຢາຮັກສາ ແລະ ຊຸດເກາະໃຫ້ພ້ອມແລ້ວກັບມາຫາຂ້ອຍເດີ.',
            end: true,
        },
    },
};

