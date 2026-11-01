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
            line: 'ຂ້ອຍຖືກຝູງເຈຍ ແລະ ແມງມຸມໂຈມຕີຈົນຂາເຈັບໜີບໍ່ໄດ້. ແຖມທາງຂ້າງໜ້າຍັງມີໂຄງກະດູກເຝົ້າຫີບສົມບັດບູຮານຢູ່!',
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
                    text: '⚔️ ພັກຜ່ອນຢູ່ແຄ້ມນີ້ເດີ ຂ້ອຍຈະໄປກວາດລ້າງທາງໜ້າໃຫ້!',
                    to: 'go_forward',
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
                    text: '🚀 ຂ້ອຍຈະໄປເປີດຫີບດຽວນີ້!',
                    to: 'go_forward',
                },
            ],
        },
        go_forward: {
            id: 'go_forward',
            speaker: 'ນັກບູຮານຄະດີ ສົມຊາຍ (Archaeologist Somchay)',
            avatar: '🧭',
            line: 'ລະວັງຕົວເດີ Jo! ຂ້ອຍຈະລໍຖ້າເຈົ້າຢູ່ທີ່ກອງໄຟແຫ່ງນີ້!',
            end: true,
        },
    },
};

