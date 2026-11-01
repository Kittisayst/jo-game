import { DialogueGraph } from '../../domain/entities/Dialogue';

export const drCyberDialogue: DialogueGraph = {
    id: 'dr_cyber',
    title: 'ດຣ. ໄຊເບີ (Dr. Cyber - Systems Engineer)',
    startNodeId: 'start',
    nodes: {
        start: {
            id: 'start',
            speaker: 'ດຣ. ໄຊເບີ (Dr. Cyber)',
            avatar: '🔬',
            line: 'ສະບາຍດີ ນັກຮົບ Jo! ຂ້ອຍກຳລັງກວດສອບຄື້ນສັນຍານແປກປະຫຼາດ... ທາງຂ້າງໜ້າຄືຫ້ອງບັນຊາການຂອງ "Hardware Overlord" ຜູ້ຄຸມລະບົບຮາດແວບູຮານ!',
            choices: [
                {
                    text: '⚡ Hardware Overlord ມີຮູບແບບການໂຈມຕີແນວໃດ?',
                    to: 'overlord_attacks',
                },
                {
                    text: '🎯 ເຮົາຈະປິດລະບົບມັນໄດ້ແນວໃດ?',
                    to: 'finisher_tips',
                },
                {
                    text: '🚀 ຂ້ອຍພ້ອມລຸຍແລ້ວ!',
                    to: 'leave',
                },
            ],
        },
        overlord_attacks: {
            id: 'overlord_attacks',
            speaker: 'ດຣ. ໄຊເບີ (Dr. Cyber)',
            avatar: '🔬',
            line: 'Phase 1 ມັນຈະກະໂດດທັບ (Jump Slam) ແລະ ປ່ອຍຄື້ນແຜ່ນດິນໄຫວ Seismic Wave! ໃຫ້ກະໂດດຂ້າມ. ສ່ວນ Phase 2 ມັນຈະຍິງລູກພະລັງໄຟຟ້າກະຈາຍ!',
            choices: [
                {
                    text: '🎯 ແລ້ວວິທີຜະເດັດສຶກລະ?',
                    to: 'finisher_tips',
                },
                {
                    text: '👍 ຂອບໃຈສຳລັບຂໍ້ມູນ!',
                    to: 'leave',
                },
            ],
        },
        finisher_tips: {
            id: 'finisher_tips',
            speaker: 'ດຣ. ໄຊເບີ (Dr. Cyber)',
            avatar: '🔬',
            line: 'ເມື່ອໂຈມຕີຈົນ HP ຂອງມັນໝົດ ລະບົບປ້ອງກັນຈະລົງລັອກ! ເຈົ້າຕ້ອງຕອບຄຳຖາມ "Finisher Quiz" ຈາກຕຳລາບົດຮຽນຮາດແວ (Book Ch1) ໃຫ້ຖືກຕ້ອງ ເພື່ອປິດການເຮັດວຽກຂອງມັນ!',
            choices: [
                {
                    text: '📚 ຂ້ອຍທົບທວນຕຳລາມາແລ້ວ ໝັ້ນໃຈ 100%!',
                    to: 'leave',
                },
            ],
        },
        leave: {
            id: 'leave',
            speaker: 'ດຣ. ໄຊເບີ (Dr. Cyber)',
            avatar: '🔬',
            line: 'ຂໍໃຫ້ພະລັງແຫ່ງປັນຍາຢູ່ຄຽງຂ້າງເຈົ້າ! ກູ້ຄືນລະບົບໃຫ້ສຳເລັດເດີ!',
            end: true,
        },
    },
};

