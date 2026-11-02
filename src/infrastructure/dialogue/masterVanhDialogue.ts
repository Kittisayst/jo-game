import { DialogueGraph } from '../../domain/entities/Dialogue';

export const masterVanhDialogue: DialogueGraph = {
    id: 'master_vanh',
    title: 'ອາຈານ ວັນ (Master Vanh)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ອາຈານ ວັນ (Master Vanh)',
            avatar: '📜',
            line: 'ສະບາຍດີ Jo! ຍິນດີຕ້ອນຮັບສູ່ເຂດວິຊາການ. ປັນຍາຄືອາວຸດທີ່ແຂງແກ່ງ ແລະ ຊົງພະລັງທີ່ສຸດໃນການຜະຈົນໄພ!',
            choices: [
                {
                    text: '📖 ວິທີສອບເສັງ ແລະ ຝຶກຝົນປັນຍາ?',
                    to: 'exam_tips',
                },
                {
                    text: '🎓 ປັນຍາຊ່ວຍໃນການຕໍ່ສູ້ແນວໃດ?',
                    to: 'wisdom_combat',
                },
                {
                    text: '❓ ຂໍທົດສອບຄວາມຮູ້ສັ້ນໆ (Mini-Quiz)!',
                    to: 'quiz_start',
                },
                {
                    text: '👋 ຂອບໃຈອາຈານ, ຂ້ອຍຈະຕັ້ງໃຈຮຽນ!',
                    to: 'goodbye',
                },
            ],
        },
        exam_tips: {
            id: 'exam_tips',
            speaker: 'ອາຈານ ວັນ (Master Vanh)',
            avatar: '📜',
            line: 'ເຈົ້າສາມາດເຂົ້າອ່ານຕຳລາໃນຫໍສະໝຸດກ່ອນ, ແລ້ວມາວັດຄວາມຮູ້ທີ່ສະຖາບັນ. ການສອບເສັງຜ່ານຈະປົດລັອກສູດຄຣາຟຂັ້ນສູງ ແລະ ເປີດໂຮງຕີເຫຼັກ!',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'start',
                },
                {
                    text: '❓ ລອງທົດສອບຄວາມຮູ້ສັ້ນໆເບິ່ງ!',
                    to: 'quiz_start',
                },
            ],
        },
        wisdom_combat: {
            id: 'wisdom_combat',
            speaker: 'ອາຈານ ວັນ (Master Vanh)',
            avatar: '📜',
            line: 'ເມື່ອເຈົ້າສອບຜ່ານແບບຮຽນ, ເຈົ້າຈະສາມາດສ້າງເສື້ອຄຸມໄໝ Shadow Silk Robe ທີ່ເພີ່ມຫົວໃຈ ແລະ ປຸງຢາ Feather Fall Potion ເພີ່ມຄວາມໄວໄດ້!',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'start',
                },
                {
                    text: '🚀 ຂ້ອຍຈະໄປສອບເສັງດຽວນີ້!',
                    to: 'goodbye',
                },
            ],
        },
        quiz_start: {
            id: 'quiz_start',
            speaker: 'ອາຈານ ວັນ (Master Vanh)',
            avatar: '📜',
            line: 'ຄຳຖາມ: ໃນການເກັບກ່ຽວແຮ່ທາດ (Ore) ແລະ ຫີນແຂງ, ຜູ້ກ້າຄວນໃຊ້ອຸປະກອນໃດ?',
            choices: [
                {
                    text: '⛏️ ອີແຕັກ / ຈົກ (Pickaxe)',
                    to: 'quiz_correct',
                    action: 'give-scholar-reward',
                },
                {
                    text: '🪓 ຂວານຕັດໄມ້ (Axe)',
                    to: 'quiz_wrong',
                },
                {
                    text: '🗡️ ດາບຟັນສັດຕູ (Sword)',
                    to: 'quiz_wrong',
                },
            ],
        },
        quiz_correct: {
            id: 'quiz_correct',
            speaker: 'ອາຈານ ວັນ (Master Vanh)',
            avatar: '📜',
            line: 'ຖືກຕ້ອງແລ້ວ! ອີແຕັກໃຊ້ຂຸດເຈາະແຮ່ທາດ ແລະ ຫີນ. ເຈົ້າມີຄວາມຮູ້ທີ່ດີຫຼາຍ! ນີ້ຄືລາງວັນ 25 Coins ສຳລັບນັກຮຽນເກັ່ງ!',
            choices: [
                {
                    text: '🎉 ຂອບໃຈຫຼາຍໆອາຈານ!',
                    to: 'goodbye',
                },
            ],
        },
        quiz_wrong: {
            id: 'quiz_wrong',
            speaker: 'ອາຈານ ວັນ (Master Vanh)',
            avatar: '📜',
            line: 'ຍັງບໍ່ຖືກຕ້ອງເທື່ອເດີ! ຂວານໃຊ້ຕັດໄມ້ ແລະ ດາບໃຊ້ຕໍ່ສູ້. ແຕ່ການຂຸດແຮ່ທາດຕ້ອງໃຊ້ ອີແຕັກ (Pickaxe). ບໍ່ເປັນຫຍັງ, ລອງສຶກສາຕື່ມອີກເດີ!',
            choices: [
                {
                    text: '🔄 ຂໍລອງໃໝ່',
                    to: 'quiz_start',
                },
                {
                    text: '📖 ຂ້ອຍຈະໄປອ່ານຕຳລາຕື່ມ',
                    to: 'goodbye',
                },
            ],
        },
        goodbye: {
            id: 'goodbye',
            speaker: 'ອາຈານ ວັນ (Master Vanh)',
            avatar: '📜',
            line: 'ຂໍໃຫ້ປັນຍານຳທາງເຈົ້າສູ່ໄຊຊະນະ, Jo!',
            end: true,
        },
    },
};

