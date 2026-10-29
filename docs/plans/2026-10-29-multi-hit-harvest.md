# ເກັບ node ຫຼາຍຄັ້ງ (Strike): ຕົ້ນໄມ້ຕ້ອງຕັດ 3 ຄັ້ງ

- **Date:** 2026-10-29
- **Status:** done (code, tests); not yet merged
- **Project:** jo-game (ພະຈົນໄພຄວາມຮູ້ / Knowledge Quest)

## ເປົ້າໝາຍ
ຕົ້ນໄມ້ຕ້ອງຕັດ 3 ຄັ້ງຈຶ່ງລົ້ມ ແລະໄດ້ໄມ້. ກ່ອນນີ້ກົດ `E` ຄັ້ງດຽວກໍເກັບໄດ້ ທັງທີ່ `stages.json` ມີ `hp: 3` ຢູ່ແລ້ວແຕ່ບໍ່ມີໃຜອ່ານ.

## ຜົນ grill (ເຫັນດີທັງໝົດ)
1. ລະບົບກາງ ອ່ານຈຳນວນຈາກຂໍ້ມູນ: ຕົ້ນໄມ້ 3, ຫີນ 3, ເສັ້ນແຮ່ເຫຼັກ 4, ສະໝຸນໄພ 1. ປ່ຽນຊື່ field `hp` ເປັນ `strikes` (ຄຳວ່າ hp ເປັນຂອງ Health).
2. ກົດ `E` ຄັ້ງລະ 1 Strike, ຄູນດາວ 400 ms, ຫຼິ້ນທ່າຟັນ.
3. ໄດ້ວັດສະດຸທັງໝົດຕອນ Strike ສຸດທ້າຍ.
4. Strike ທີ່ຕີແລ້ວຈຳໄວ້ຈົນອອກຈາກດ່ານ (ດ່ານ respawn ເປັນການຣີເຊັດ, ບໍ່ເກັບໃນ save).
5. ບໍ່ມີເຄື່ອງມື ຫຼືກະເປົາເຕັມ: ປະຕິເສດທຸກຄັ້ງ ແລະບໍ່ນັບ Strike.
6. ທຸກ Strike: node ສັ່ນ, ສຽງຕັດ/ຂຸດ, ຂໍ້ຄວາມ "🪓 1/3" ຫຼື "⛏ 1/4"; ສຸດທ້າຍກາຍເປັນຕໍ/ຫີນແຕກ.
ຄຳສັບ **Resource node** ແລະ **Strike** ຢູ່ໃນ `CONTEXT.md`.

## ສິ່ງທີ່ເຮັດ
- `domain/entities/ResourceNode.ts` (+test): ນັບ Strike, `isDepleted`.
- `HarvestResourceNodeUseCase` ຮັບ `ResourceNode`; ຄືນ `completed`, `strikesTaken`, `strikesNeeded`; reason ໃໝ່ `depleted`; event `resource-harvested` ສົ່ງສະເພາະ Strike ສຸດທ້າຍ.
- `StageDefinition` ກວດ `strikes` ເປັນຈຳນວນເຕັມ ≥ 1; `stages.json` ປ່ຽນ `hp` → `strikes`.
- `StageBuilder`: `ResourceNodeView` ມີ `progress` ແລະ `shakeOnStrike`; ປ້າຍຂຶ້ນ "×3".
- `InteractionController`: ຄູນດາວ, ສຽງ, ຂໍ້ຄວາມລອຍ; `Player.swingToolToward`.
- e2e ໃໝ່ `harvest_strikes.spec.ts`; `playthrough.spec.ts` (opt-in) ກົດ `E` ຫຼາຍຄັ້ງຕໍ່ node.
- GDD, how-to-play, CLAUDE.md.

## ຄວາມສ່ຽງ / ເປີດຢູ່
- ຂວານລະດັບສູງບໍ່ຕັດໄວຂຶ້ນ (ມີແຕ່ T1; `toolTier` ຍັງບໍ່ມີຄົນໃຊ້). ຖ້າມີ T2 ຄ່ອຍກຳນົດ.
- ຕົວເລກ Strike ຍັງເປັນຄ່າເບື້ອງຕົ້ນ; ປັບໄດ້ໃນ `stages.json` ເທົ່ານັ້ນ.
