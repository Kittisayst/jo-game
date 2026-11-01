import { DialogueGraph } from '../../domain/entities/Dialogue';

export const swordsmanKhamDialogue: DialogueGraph = {
    id: 'swordsman_kham',
    title: 'ນັກດາບ ຄຳ (Swordsman Kham)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ນັກດາບ ຄຳ (Swordsman Kham)',
            avatar: '⚔️',
            line: 'ຮາຮ່າ! ເຈົ້າຄື Jo ຜູ້ກ້າຄົນໃໝ່ແມ່ນບໍ່? ຢາກເປັນນັກຮົບທີ່ເກັ່ງກ້າ ຕ້ອງໝັ່ນຝຶກຝົນເພງດາບ ແລະ ຈັງຫວະໂຈມຕີຢູ່ສະເໝີ!',
            choices: [
                {
                    text: '🗡️ ເຄັດລັບການໂຈມຕີ ແລະ ຄອມໂບ?',
                    to: 'combat_tips',
                },
                {
                    text: '🛡️ ດາບກະດູກ ແລະ ດາບພິດ ມີຄວາມພິເສດແນວໃດ?',
                    to: 'weapon_tiers',
                },
                {
                    text: '🎯 ລອງຟັນຫຸ່ນເຟືອງໃຫ້ເບິ່ງແດ່!',
                    to: 'dummy_advice',
                },
                {
                    text: '⚔️ ຂ້ອຍຈະຕັ້ງໃຈຝຶກຝົນ, ຂໍຂອບໃຈ!',
                    to: 'goodbye',
                },
            ],
        },
        combat_tips: {
            id: 'combat_tips',
            speaker: 'ນັກດາບ ຄຳ (Swordsman Kham)',
            avatar: '⚔️',
            line: 'ກົດ J ຫຼື Z ເພື່ອຟັນດາບ; ຖ້າສັດຕູງ້າງໂຈມຕີ ໃຫ້ກົດ Shift ເພື່ອພຸ່ງຫຼົບ (Dash) ໄປທາງຫຼັງຂອງມັນແລ້ວຟັນສວນ. ຈັງຫວະຄືຫົວໃຈຂອງໄຊຊະນະ!',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'start',
                },
                {
                    text: '🛡️ ລະດັບຂອງອາວຸດເດ?',
                    to: 'weapon_tiers',
                },
            ],
        },
        weapon_tiers: {
            id: 'weapon_tiers',
            speaker: 'ນັກດາບ ຄຳ (Swordsman Kham)',
            avatar: '⚔️',
            line: 'ດາບໄມ້ (10 DMG) ເປັນພື້ນຖານ; ດາບກະດູກບູຮານ (18 DMG) ຈາກຄຸກໃຕ້ດິນມີພະລັງຮຸນແຮງ; ແລະ ດາບພິດ Venom Bone Blade (26 DMG) ຄືສຸດຍອດອາວຸດທີ່ເຈາະເກາະໄດ້ດີທີ່ສຸດ!',
            choices: [
                {
                    text: '🔙 ຖາມເລື່ອງອື່ນ',
                    to: 'start',
                },
                {
                    text: '🎯 ຂ້ອຍຈະໄປລອງດາບໃສ່ຫຸ່ນເຟືອງ!',
                    to: 'dummy_advice',
                },
            ],
        },
        dummy_advice: {
            id: 'dummy_advice',
            speaker: 'ນັກດາບ ຄຳ (Swordsman Kham)',
            avatar: '⚔️',
            line: 'ຫຸ່ນເຟືອງ (Training Dummy) ຢູ່ທາງຂວາມືຂອງຂ້ອຍ! ຍ່າງໄປໃກ້ໆແລ້ວກົດ E ຫຼື ຟັນໃສ່ມັນເລີຍ, ມັນຈະສະແດງພະລັງໂຈມຕີຕົວຈິງຂອງດາບທີ່ເຈົ້າໃສ່ຢູ່!',
            choices: [
                {
                    text: '🔥 ຍອດຢ້ຽມ! ຂ້ອຍຈະໄປທົດສອບດຽວນີ້',
                    to: 'goodbye',
                },
            ],
        },
        goodbye: {
            id: 'goodbye',
            speaker: 'ນັກດາບ ຄຳ (Swordsman Kham)',
            avatar: '⚔️',
            line: 'ຈົ່ງເຮັດໃຫ້ຄົມດາບຂອງເຈົ້າແຫຼມຄົມຢູ່ສະເໝີ, Jo!',
            end: true,
        },
    },
};

