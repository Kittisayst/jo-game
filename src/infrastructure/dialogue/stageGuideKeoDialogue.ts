import { DialogueGraph } from '../../domain/entities/Dialogue';

export const stageGuideKeoDialogue: DialogueGraph = {
    id: 'stage_guide_keo',
    title: 'ນັກສຳຫຼວດແກ້ວ (Guide Keo)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ນັກສຳຫຼວດແກ້ວ (Keo)',
            avatar: '🧭',
            line: 'ສະບາຍດີເພື່ອນນັກຜະຈົນໄພ! ຂ້ອຍຊື່ ແກ້ວ, ກຳລັງອອກມາສຳຫຼວດປ່າໄມ້ຮອບໆ ໝູ່ບ້ານ. ເຈົ້າກຳລັງມຸ່ງໜ້າໄປທາງໃດ?',
            choices: [
                {
                    text: '🌿 ມີຄຳແນະນຳໃນການຜະຈົນໄພບໍ່?',
                    to: 'advice',
                },
                {
                    text: '🗝️ ເຈົ້າຮູ້ຈັກຄຸກໃຕ້ດິນບູຮານ (Dungeon) ບໍ່?',
                    to: 'dungeon-info',
                },
                {
                    text: '👋 ຂໍໃຫ້ໂຊກດີໃນການເດີນທາງ!',
                    to: 'leave',
                },
            ],
        },
        advice: {
            id: 'advice',
            speaker: 'ນັກສຳຫຼວດແກ້ວ (Keo)',
            avatar: '🧭',
            line: 'ຕົ້ນໄມ້ແລະສະໝຸນໄພຕາມທາງສາມາດເກັບກ່ຽວໄດ້ດ້ວຍປຸ່ມ [E]. ຢ່າລືມລະວັງ Slime ທີ່ກະໂດດໄປມາ, ຖ້າເຂົ້າໃກ້ສາມາດກົດ [J] ເພື່ອໂຈມຕີໄດ້!',
            choices: [
                {
                    text: '🗝️ ແລ້ວຄຸກໃຕ້ດິນລະ?',
                    to: 'dungeon-info',
                },
                {
                    text: '✨ ຂອບໃຈຫຼາຍໆ!',
                    to: 'leave',
                },
            ],
        },
        'dungeon-info': {
            id: 'dungeon-info',
            speaker: 'ນັກສຳຫຼວດແກ້ວ (Keo)',
            avatar: '🧭',
            line: 'ຄຸກໃຕ້ດິນຢູ່ທາງທິດຕາເວັນອອກຂອງໝູ່ບ້ານ! ນາຍພານບຸນມີ ຢູ່ເຝົ້າປາກທາງ. ທາງໃນອັນຕະລາຍຫຼາຍ ມີທັງແມງມຸມພິດ, ເຈຍຖ້ຳ, ແລະໂຄງກະດູກນັກຮົບ!',
            choices: [
                {
                    text: '⚔️ ຂ້ອຍຈະກຽມພ້ອມໄປທົດສອບຄວາມສາມາດ!',
                    to: 'leave',
                },
            ],
        },
        leave: {
            id: 'leave',
            speaker: 'ນັກສຳຫຼວດແກ້ວ (Keo)',
            avatar: '🧭',
            line: 'ຂໍໃຫ້ໂຊກດີ! ຖ້າຕ້ອງການຄວາມຊ່ວຍເຫຼືອ ມາຖາມຂ້ອຍໄດ້ສະເໝີ.',
            end: true,
        },
    },
};
