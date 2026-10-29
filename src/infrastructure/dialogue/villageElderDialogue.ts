import { DialogueGraph } from '../../domain/entities/Dialogue';

export const VILLAGE_ELDER_DIALOGUE: DialogueGraph = {
    id: 'village_elder',
    title: 'ພໍ່ເຖົ້າຄຳແຫ່ງໝູ່ບ້ານໄຊເບີ (Elder Kham of Cyber Village)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ສະບາຍດີ ຜູ້ກ້າ Jo! ຍິນດີຕ້ອນຮັບສູ່ໝູ່ບ້ານໄຊເບີ (Cyber Village)!',
            next: 'story_intro',
        },
        story_intro: {
            id: 'story_intro',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ຈອມມານຮາດແວບູຮານ (Hardware Overlord) ຍຶດຄອງປ່າ ແລະ ຖ້ຳສາຍແຮ່ ແລະປະຕູໃຫຍ່ກໍຖືກຫັກພັງ! ເຮົາຕ້ອງການຄວາມຮູ້ ແລະ ອາວຸດຂອງເຈົ້າ.',
            next: 'questions',
        },
        questions: {
            id: 'questions',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ເຈົ້າມີຂໍ້ສົງໄສ ຫຼື ຕ້ອງການຄຳແນະນຳຫຍັງກ່ອນອອກເດີນທາງບໍ່?',
            choices: [
                {
                    text: '📚 ເລີ່ມຕົ້ນແນວໃດ? (ຮຽນ → ສ້າງ → ສຳຫຼວດ)',
                    to: 'learn_tip',
                },
                {
                    text: '⌨️ ແນະນຳວິທີຄວບຄຸມ ແລະການສູ້ແດ່?',
                    to: 'controls_tip',
                    set: { askedControls: true },
                },
                {
                    text: '👗 ມີບ່ອນປ່ຽນຊຸດບໍ?',
                    to: 'skin_tip',
                },
                {
                    text: '👑 Hardware Overlord ຢູ່ໃສ ແລະ ເອົາຊະນະແນວໃດ?',
                    to: 'boss_tip',
                    set: { askedBoss: true },
                },
                {
                    text: '🚀 ຂ້ອຍພ້ອມແລ້ວ, ຈະອອກໄປດຽວນີ້ເລີຍ!',
                    to: 'ready_go',
                },
            ],
        },
        skin_tip: {
            id: 'skin_tip',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'Mina ຂາຍຊຸດຕົວລະຄອນ ຢືນຢູ່ຕະຫຼາດນ້ອຍທາງຂວາ ໃກ້ປະຕູມິຕິ. ເຈົ້າຊື້ ແລະປ່ຽນຊຸດໄດ້ທີ່ນາງເທົ່ານັ້ນ ດ້ວຍ Credit ທີ່ໄດ້ຈາກການຮຽນ.',
            choices: [
                {
                    text: '📚 ຖາມເລື່ອງອື່ນຕໍ່',
                    to: 'questions',
                },
                {
                    text: '✨ ຂອບໃຈ ຂ້ອຍພ້ອມລຸຍ!',
                    to: 'ready_go',
                },
            ],
        },
        learn_tip: {
            id: 'learn_tip',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ຊື້ປຶ້ມຕຳລາທີ່ຫໍສະໝຸດ (20 Credit) ອ່ານໃຫ້ຄົບ ແລ້ວສອບທີ່ສະຖາບັນເພື່ອປົດລັອກສູດ. ຈາກນັ້ນສ້າງ Pickaxe, ຄ້ອນ ແລະ ຊຸດສ້ອມແປງທີ່ໂຮງຊ່າງ, ໄປເກັບວັດສະດຸໃນດ່ານ ແລ້ວກັບມາຕີດາບທີ່ໂຮງຕີເຫຼັກ.',
            choices: [
                {
                    text: '⌨️ ແລ້ວວິທີຄວບຄຸມ ແລະການສູ້ເດ?',
                    to: 'controls_tip',
                },
                {
                    text: '✨ ເຂົ້າໃຈແລ້ວ ຂ້ອຍພ້ອມລຸຍ!',
                    to: 'ready_go',
                },
            ],
        },
        controls_tip: {
            id: 'controls_tip',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ໃຊ້ [A]/[D] ຫຼື ລູກສອນເພື່ອແລ່ນ, [W]/[Space] ເພື່ອໂດດ (ປ່ອຍໄວຈະໂດດຕ່ຳ), [J]/[Z] ເພື່ອຟັນດາບ, [Q] ສັບດາບ, [E] ເພື່ອໂຕ້ຕອບ ແລະ [I] ເປີດກະເປົາ. ການແຕະຕົວສັດຕູເສຍຫົວໃຈ ຈຶ່ງຄວນຟັນຈາກໄລຍະໄກ ແລະຖອຍຫຼັງຕີ!',
            choices: [
                {
                    text: '👑 ແລ້ວ Hardware Overlord ເດ ເອົາຊະນະແນວໃດ?',
                    to: 'boss_tip',
                },
                {
                    text: '✨ ຂອບໃຈຫຼາຍໆ ຂ້ອຍພ້ອມລຸຍແລ້ວ!',
                    to: 'ready_go',
                },
            ],
        },
        boss_tip: {
            id: 'boss_tip',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ຈອມມານຢູ່ລານສຸດທ້າຍຫຼັງປະຕູໃຫຍ່ ແລະມີ 300 HP. ເຈົ້າຕ້ອງມີຄ້ອນ + ຊຸດສ້ອມແປງ ແລະຕອບຄຳຖາມເພື່ອເປີດປະຕູ. ເມື່ອມັນໃກ້ຕາຍຈະມີຄຳຖາມປິດສາກ: ຕອບຖືກຈຶ່ງຊະນະ ແລະໄດ້ Credit ເພີ່ມ, ຕອບຜິດມັນຈະຟື້ນພະລັງ!',
            choices: [
                {
                    text: '💡 ຂໍຖາມເລື່ອງການຄວບຄຸມແດ່',
                    to: 'controls_tip',
                },
                {
                    text: '⚔️ ຮັບຊາບ! ຂ້ອຍຈະໄປປາບມັນເອງ!',
                    to: 'ready_go',
                },
            ],
        },
        ready_go: {
            id: 'ready_go',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ຂໍໃຫ້ໂຊກດີ ຜູ້ກ້າ Jo! ເມື່ອພ້ອມແລ້ວ ຈົ່ງຍ່າງໄປທາງຂວາສຸດ ແລະເຂົ້າປະຕູມິຕິ (World Gate) ເພື່ອເລີ່ມຜະຈົນໄພ!',
            end: true,
        },
    },
};
