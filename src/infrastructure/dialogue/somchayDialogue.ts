import { DialogueGraph } from '../../domain/entities/Dialogue';

export const ARCHAEOLOGIST_SOMCHAY_DIALOGUE: DialogueGraph = {
    id: 'somchay',
    title: 'ນັກບູຮານຄະດີ ສົມຊາຍ (Archaeologist Somchay)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ນັກບູຮານຄະດີ ສົມຊາຍ (Archaeologist Somchay)',
            avatar: '🧭',
            line: 'ໂອ້! ເຈົ້າຄືຜູ້ກ້າທີ່ນາຍພານ ບຸນມີ ສົ່ງມາແມ່ນບໍ່? ຂອບໃຈຫຼາຍໆທີ່ລົງມາຊ່ວຍຂ້ອຍ!',
            next: 'status',
        },
        status: {
            id: 'status',
            speaker: 'ນັກບູຮານຄະດີ ສົມຊາຍ (Archaeologist Somchay)',
            avatar: '🧭',
            line: 'ຂ້ອຍຖືກຝູງເຈຍ ແລະ ແມງມຸມໂຈມຕີຈົນຂາເຈັບໜີບໍ່ໄດ້. ແຖມທາງຂ້າງໜ້າຍັງມີໂຄງກະດູກເຝົ້າຫີບສົມບັດບູຮານ ແລະ ປະຕູສູ່ຮັງພະຍາແມງມຸມ!',
            choices: [
                {
                    text: '🦇 ວິທີຮັບມືກັບສັດຕູໃນນີ້?',
                    to: 'tips',
                },
                {
                    text: '🎁 ຫີບສົມບັດບູຮານຢູ່ໃສ?',
                    to: 'chest_info',
                },
                {
                    text: '🗝️ ປະຕູໃຫຍ່ຫຼັງຫີບສົມບັດແມ່ນຫຍັງ?',
                    to: 'boss_gate_info',
                },
                {
                    text: '⚔️ ພັກຜ່ອນຢູ່ແຄ້ມນີ້ເດີ ຂ້ອຍຈະໄປກວາດລ້າງທາງໜ້າໃຫ້!',
                    to: 'go_forward',
                    action: 'give-dungeon-key',
                },
            ],
        },
        tips: {
            id: 'tips',
            speaker: 'ນັກບູຮານຄະດີ ສົມຊາຍ (Archaeologist Somchay)',
            avatar: '🧭',
            line: 'ເຈຍມັກບິນໂສບລົງມາ ໃຫ້ກົດ Shift ພຸ່ງຫຼົບແລ້ວຟັນສວນ; ແມງມຸມໃຫ້ຖອຍຫຼັງຕີ; ສ່ວນໂຄງກະດູກຕ້ອງລະວັງຕອນມັນງ້າງດາບ!',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'status',
                },
                {
                    text: '⚔️ ຂ້ອຍພ້ອມສູ້ແລ້ວ!',
                    to: 'go_forward',
                    action: 'give-dungeon-key',
                },
            ],
        },
        chest_info: {
            id: 'chest_info',
            speaker: 'ນັກບູຮານຄະດີ ສົມຊາຍ (Archaeologist Somchay)',
            avatar: '🧭',
            line: 'ຫີບສົມບັດ (Dungeon Chest) ຢູ່ຫ້ອງເລິກສຸດທ້າຍດັນຈ້ຽນ! ຖ້າເຈົ້າປາບໂຄງກະດູກໄດ້ ຈະສາມາດເປີດຫີບຮັບ Crystal ແລະ ດາບກະດູກບູຮານໄດ້ເລີຍ!',
            choices: [
                {
                    text: '🗝️ ແລ້ວປະຕູໃຫຍ່ດ້ານຫຼັງເດ?',
                    to: 'boss_gate_info',
                },
                {
                    text: '🚀 ຂ້ອຍຈະໄປເປີດຫີບດຽວນີ້!',
                    to: 'go_forward',
                    action: 'give-dungeon-key',
                },
            ],
        },
        boss_gate_info: {
            id: 'boss_gate_info',
            speaker: 'ນັກບູຮານຄະດີ ສົມຊາຍ (Archaeologist Somchay)',
            avatar: '🧭',
            line: 'ນັ້ນຄືປະຕູຮັງຂອງພະຍາແມງມຸມ (Spider Queen)! ຂ້ອຍຄົ້ນພົບກະແຈບູຮານ (Dungeon Key) ນີ້ໃນຊາກຫັກພັງ, ຂ້ອຍຂໍມອບໃຫ້ເຈົ້າ! ຈົ່ງລະວັງພິດ ແລະ ໃຍໜຽວຂອງມັນເດີ!',
            choices: [
                {
                    text: '🗝️ ຮັບກະແຈຄຸກໃຕ້ດິນ ແລະ ໄປປາບພະຍາແມງມຸມ!',
                    to: 'go_forward',
                    action: 'give-dungeon-key',
                },
            ],
        },
        go_forward: {
            id: 'go_forward',
            speaker: 'ນັກບູຮານຄະດີ ສົມຊາຍ (Archaeologist Somchay)',
            avatar: '🧭',
            line: 'ລະວັງຕົວເດີ Jo! ນີ້ຄືກະແຈຄຸກໃຕ້ດິນ (Dungeon Key), ໃຊ້ໄຂປະຕູໃຫຍ່ໄປປາບພະຍາແມງມຸມໄດ້ເລີຍ! ຂ້ອຍຈະລໍຖ້າເຈົ້າຢູ່ທີ່ກອງໄຟແຫ່ງນີ້!',
            end: true,
        },
    },
};

