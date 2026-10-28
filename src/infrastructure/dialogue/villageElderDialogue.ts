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
            line: 'ຕອນນີ້ King Slime ໄດ້ພາລູກສະໝຸນ Slime ບຸກຍຶດຄອງທົ່ງຫຍ້າ ແລະ ເກາະລອຍຟ້າແລ້ວ! ຊາວບ້ານຕ້ອງການຄວາມຊ່ວຍເຫຼືອຈາກເຈົ້າ.',
            next: 'questions',
        },
        questions: {
            id: 'questions',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ເຈົ້າມີຂໍ້ສົງໄສ ຫຼື ຕ້ອງການຄຳແນະນຳຫຍັງກ່ອນອອກເດີນທາງບໍ່?',
            choices: [
                {
                    text: '💡 ແນະນຳວິທີຄວບຄຸມ & ເຕັກນິກການໂດດແດ່?',
                    to: 'controls_tip',
                    set: { askedControls: true },
                },
                {
                    text: '👑 King Slime ຢູ່ໃສ ແລະ ເອົາຊະນະແນວໃດ?',
                    to: 'boss_tip',
                    set: { askedBoss: true },
                },
                {
                    text: '🚀 ຂ້ອຍພ້ອມແລ້ວ, ຈະອອກໄປດຽວນີ້ເລີຍ!',
                    to: 'ready_go',
                },
            ],
        },
        controls_tip: {
            id: 'controls_tip',
            speaker: 'ພໍ່ເຖົ້າຄຳ (Elder Kham)',
            avatar: '👴',
            line: 'ເຈົ້າສາມາດໃຊ້ [A]/[D] ຫຼື ລູກສອນເພື່ອແລ່ນ, ກົດ [W]/[Space] ເພື່ອກະໂດດ! ເກມນີ້ມີລະບົບ Coyote Time (ໂດດໄດ້ແມ່ນແຕ່ຫຼຸດຂອບ) ແລະ Variable Jump (ປ່ອຍປຸ່ມໄວຈະໂດດຕ່ຳ)!',
            choices: [
                {
                    text: '👑 ແລ້ວ King Slime ເດ ເອົາຊະນະແນວໃດ?',
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
            line: 'King Slime ລໍຖ້າເຈົ້າຢູ່ທີ່ Stage 3 Boss Arena! ມັນມີ 5 HP, ເຈົ້າຕ້ອງໂດດຢຽບຫົວມັນໃຫ້ຄົບ 5 ຄັ້ງ ແລະ ຢ່າລືມເກັບດາວ Star ເພື່ອເປັນອຳມະຕະ!',
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
            line: 'ຂໍໃຫ້ໂຊກດີ ຜູ້ກ້າ Jo! ຈົ່ງຍ່າງໄປທາງຂວາສຸດແລ້ວຜ່ານປະຕູ Portal ເພື່ອເລີ່ມຕົ້ນການຜະຈົນໄພໄດ້ເລີຍ!',
            end: true,
        },
    },
};
