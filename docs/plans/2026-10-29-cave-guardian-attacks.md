# ທ່າໂຈມຕີພິເສດຂອງ Cave Guardian (Mini-boss)

- **Date:** 2026-10-29
- **Status:** done (code, tests); not yet merged
- **Project:** jo-game (ພະຈົນໄພຄວາມຮູ້ / Knowledge Quest)

## ເປົ້າໝາຍ
GDD ກຳນົດ Mini-boss "2 ທ່າໂຈມຕີ" ແຕ່ Cave Guardian ເກີດເປັນສະໄລມ໌ໂລຫະ (`slime-armored`) ທີ່ມີ HP 140 ແລະກະໂດດໃສ່ຜູ້ຫຼິ້ນເທົ່ານັ້ນ.

## ຜົນ grill (ເຫັນດີທັງໝົດ)
1. ສອງທ່າ: **ພຸ່ງຕຳ (charge)** ແລະ **ຖິ້ມຫີນ (rock throw)**.
2. Telegraph: 0.8 ວິ ກ່ອນພຸ່ງຕຳ, 0.6 ວິ ກ່ອນຖິ້ມຫີນ; ກະພິບສີແດງ + ❗. ເສຍ 1 ຫົວໃຈຄືເກົ່າ.
3. ເລືອກຕາມໄລຍະຫ່າງ (ໄກ → ຖິ້ມຫີນ, ໃກ້ → ພຸ່ງຕຳ, ຊ້ອນກັນ 240–260 px ສຸ່ມ), ບໍ່ໃຊ້ທ່າດຽວກັນເກີນ 2 ເທື່ອຕິດ, ຄູນດາວ 2.5 ວິ, ໂຈມຕີໃນໄລຍະ 500 px.
4. ຫຼັງພຸ່ງຕຳ ມຶນງົງ 1 ວິ (💫, ດາເມດທີ່ຮັບເທົ່າເກົ່າ).
5. ບໍ່ມີ phase.
6. ຕົວເລກຢູ່ `enemies.json` (`attacks`), ກົດເລືອກທ່າຢູ່ domain.

## ສິ່ງທີ່ເຮັດ
- `domain/entities/EnemyAttackPlanner.ts` (+test): ເລືອກທ່າ, cooldown (ນັບຕອນພັກ), ຈຳກັດຊ້ຳ.
- `EnemyDefinition.attacks`; `ContentCatalog` ກວດ (telegraph ≥ 100 ms, ຊ່ວງໄລຍະ, ພຸ່ງຕຳຕ້ອງມີ `durationMs`/`stunMs`, ຖິ້ມຫີນຕ້ອງມີ `projectiles`; ໃຊ້ໄດ້ສະເພາະ miniboss) + test.
- `objects/EnemyAttackBehavior.ts`: ສະຖານະ ready → telegraph → charge/throw → stunned; `Enemy` ເອີ້ນໃນ `update` ເມື່ອ definition ມີ `attacks`.
- ກ້ອນຫີນ: `CombatController.spawnEnemyRock` (ໃຊ້ `enemyProjectiles` ຂອງ spit), ໄລ່ຕາມພື້ນ ໂດດຂ້າມໄດ້.
- e2e `cave_guardian.spec.ts` (ວາງຮີໂຣ້ໃກ້/ໄກ ແລ້ວເບິ່ງ telegraph → throw/charge → stunned), CONTEXT.md (Mini-boss, Telegraph), GDD, how-to-play.

## ເປີດຢູ່
- ຕົວເລກ (ເວລາເຕືອນ, ຄວາມໄວ, ຈຳນວນຫີນ) ເປັນຄ່າເບື້ອງຕົ້ນ; ປັບຫຼັງ playtest ໃນ `enemies.json`.
- `CLAUDE.md` ຂໍ້ "Known leftovers" ຍັງບອກວ່າ Guardian ບໍ່ມີທ່າ: ລຶບຫຼັງ PR ຂອງຄຳຖາມບົດ 2 merge (ແກ້ແຖວດຽວກັນ ຈຶ່ງເລື່ອນໄວ້ກັນ conflict).
