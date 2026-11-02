import { DialogueGraph } from '../../domain/entities/Dialogue';

export const uncleThongDialogue: DialogueGraph = {
    id: 'uncle_thong',
    title: 'ລຸງທອງ ນັກຂຸດຄົ້ນ (Uncle Thong)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ລຸງທອງ ນັກຂຸດຄົ້ນ (Uncle Thong)',
            avatar: '⛏️',
            line: 'ຢຸດກ່ອນຫຼານຊາຍ! ທາງຂ້າງໜ້າມີ "Cave Guardian" ຜູ້ປົກປ້ອງຖ້ຳຫີນຍັກ ຂວາງທາງຢູ່! ລົດເຂັນຂົນແຮ່ຂອງລຸງຕິດຢູ່ຫັ້ນໜີບໍ່ໄດ້ເລີຍ.',
            choices: [
                {
                    text: '⚠️ Cave Guardian ມັນໂຈມຕີແນວໃດແດ່?',
                    to: 'boss_attacks',
                },
                {
                    text: '💡 ມີວິທີຮັບມື ຫຼື ຈຸດອ່ອນຂອງມັນບໍ່?',
                    to: 'tips',
                },
                {
                    text: '⚔️ ບໍ່ຕ້ອງຫ່ວງລຸງ! ຂ້ອຍຈະໄປປາບມັນເອງ',
                    to: 'leave',
                },
            ],
        },
        boss_attacks: {
            id: 'boss_attacks',
            speaker: 'ລຸງທອງ ນັກຂຸດຄົ້ນ (Uncle Thong)',
            avatar: '⛏️',
            line: 'ມັນມັກໂຍນກ້ອນຫີນໃຫຍ່ໃສ່ເຮົາໃນໄລຍະໄກ ແລະ ເມື່ອມັນເຫັນເຮົາ ມັນຈະງ້າງໂຕແລ້ວ "ພຸ່ງຊົນຢ່າງແຮງ (Charge)" ດ້ວຍຄວາມໄວສູງ!',
            choices: [
                {
                    text: '💡 ແລ້ວເຮົາຈະຫຼົບ ແລະ ໂຈມຕີມັນແນວໃດ?',
                    to: 'tips',
                },
                {
                    text: '✨ ເຂົ້າໃຈແລ້ວ ຂອບໃຈຫຼາຍໆລຸງ!',
                    to: 'leave',
                },
            ],
        },
        tips: {
            id: 'tips',
            speaker: 'ລຸງທອງ ນັກຂຸດຄົ້ນ (Uncle Thong)',
            avatar: '⛏️',
            line: 'ຕອນມັນພຸ່ງຊົນ ໃຫ້ກົດ Space ກະໂດດຂ້າມຫົວມັນ ຫຼື ກົດ Shift ພຸ່ງຫຼົບ! ເມື່ອມັນຊົນພາດ ມັນຈະ "ມຶນງົງ (Dazed)" ຢູ່ຊົ່ວຄາວ — ນັ້ນຄືໂອກາດດຽວທີ່ຈະຟັນມັນ!',
            choices: [
                {
                    text: '🔥 ສຸດຍອດເລີຍ! ຂ້ອຍພ້ອມສູ້ແລ້ວ',
                    to: 'leave',
                },
            ],
        },
        leave: {
            id: 'leave',
            speaker: 'ລຸງທອງ ນັກຂຸດຄົ້ນ (Uncle Thong)',
            avatar: '⛏️',
            line: 'ຂໍໃຫ້ໂຊກດີເດີນັກຮົບ! ຖ້າປາບມັນໄດ້ ລຸງຈະມອບລາງວັນໃຫ້ຢ່າງງາມ!',
            end: true,
        },
    },
};

