# ກວດ ແລະ ປັບໂຄງສ້າງໃຫ້ຕົງກັບ Clean Architecture

- **Date:** 2026-10-28
- **Status:** done (Phase 0–6); ລາຍການຄ້າງຢູ່ໃນບັນທຶກຂອງແຕ່ລະ Phase
- **Project:** jo-game (ພະຈົນໄພຄວາມຮູ້ / Knowledge Quest)

## ເປົ້າໝາຍ (Goal)

ກວດວ່າໂຄດຕາມກົດ 3 ຊັ້ນໃນ ADR 0001 (domain → application → infrastructure) ຫຼືບໍ່, ຊອກຫາກົດເກມທີ່ຫຼຸດອອກໄປຢູ່ໃນ React/Phaser, ແລະວາງແຜນຍ້າຍກັບເຂົ້າ `domain/`/`application/` ທີ່ທົດສອບໄດ້. ຜົນພ້ອມກັນຄືແກ້ bug ທີ່ເກີດຈາກກົດຢູ່ສອງບ່ອນ.

## ຜົນການກວດ (Audit)

**ຜ່ານແລ້ວ**
- ທິດທາງ import ຖືກ: `domain/` ບໍ່ import `application`/`infrastructure`/`phaser`/`react`/`window`/`localStorage` (grep ໄດ້ 0 ຈຸດ); `application/` ບໍ່ import `infrastructure`/`phaser`/`react` (0 ຈຸດ).
- ທຸກ entity ແລະທຸກ use case ມີ test ຄູ່ (191 test). ມີ port ສຳລັບ Skin / Settings / StageProgression ແລະ repository ຂອງ localStorage ຢູ່ `infrastructure/storage/`.
- ໂຟລວຫຼັກ (ຊື້ປຶ້ມ, ສອບ, ຝຶກປະຈຳວັນ, craft, ອັບເກຣດດາບ, ສ້ອມປະຕູ, ກັບໝູ່ບ້ານ, ເກັບ node, ຊື້ Skin) ເອີ້ນຜ່ານ use case ແລ້ວ.

**ບັນຫາ (ລຽງຕາມຜົນກະທົບ)**

| # | ບັນຫາ | ຫຼັກຖານ | ຜົນ |
|---|-------|---------|-----|
| 1 | **ກົດຢູ່ໃນ UI ແທນ use case: ໃຊ້ herb-potion** | `App.tsx:905` ເພີ່ມ `health` ໃນ React state ເທົ່ານັ້ນ; `Health` ຕົວຈິງຢູ່ໃນ `Game.ts:220` ແລະບໍ່ມີໃຜຟື້ນມັນ; `items.json` ມີ `healAmount: 40` ທີ່ບໍ່ມີໃຜອ່ານ | **bug ຈິງ:** HUD ສະແດງຫົວໃຈເພີ່ມ ແຕ່ຕົວລະຄອນໃນເກມບໍ່ໄດ້ຟື້ນ (ກວດຈາກໂຄດ, ຍັງບໍ່ໄດ້ຫຼິ້ນຢືນຢັນ) |
| 2 | **ສອງບ່ອນເກັບ Health/Boss HP:** scene ມີ `Health` entity, React ມີ `health`/`bossHp` state ທີ່ຊິງຄ໌ດ້ວຍ event; `maxHealth = 3` ຊ້ຳໃນ `App.tsx` ແລະ `Game.ts` | `App.tsx:81,105`, `Game.ts:80,220` | ຄ່າຫຼຸດຊິງຄ໌ງ່າຍ (ຂໍ້ 1 ເປັນຕົວຢ່າງ) |
| 3 | **ກົດລາງວັນ Boss ຢູ່ໃນ scene:** `boss-core ×1`, `crystal ×3`, achievement `boss-slayer` ຖືກໃສ່ໃນ `Game.ts:462–466`; ກົດ "ຕອບຜິດ Boss ຟື້ນ 15%" (`Math.ceil(maxHp*0.15)`) ຢູ່ `Game.ts:480` | `Game.ts` | ປ່ຽນ balance ຕ້ອງແກ້ scene, ທົດສອບບໍ່ໄດ້ |
| 4 | **BackpackModal ແກ້ entity ໂດຍກົງ:** ໃຊ້ຂອງ (`removeItem`), ໃສ່ດາບ (`equipWeapon`), ຖິ້ມ (`removeSlot`), ແລະ `selectedSlot.count -= 1` ແກ້ slot ຂ້າມ `Backpack`; ກົດ "ຫ້າມຖິ້ມເຄື່ອງມື/ອາວຸດ" ກວດແຕ່ໃນ UI | `BackpackModal.tsx:76–120` | ຂ້າມ use case ແລະ event; ກົດບໍ່ຢູ່ຊັ້ນທີ່ທົດສອບ |
| 5 | **ກົດຊ້ຳ 2 ບ່ອນ:** ເງື່ອນໄຂ "ມີຄ້ອນ" (`startsWith('hammer')`) ຢູ່ທັງ `GateRepairModal.tsx:45` ແລະ `RepairBrokenGateUseCase.ts`; ທັງທີ່ `stages.json` ມີ `gate.requiredTool/requiredItem` ຢູ່ແລ້ວ ແຕ່ບໍ່ມີໃຜອ່ານ. ເງື່ອນໄຂເຂົ້າ Daily Practice `balance < 20` (ເລກຄົງທີ່) ຢູ່ `AcademyModal.tsx:85` | ເບິ່ງໄຟລ໌ | ແກ້ກົດຢູ່ບ່ອນໜຶ່ງ ອີກບ່ອນຍັງເກົ່າ |
| 6 | **ຂໍ້ມູນເນື້ອຫາມີຫຼາຍແຫຼ່ງຄວາມຈິງ:** `Backpack.ts` ມີ `DEFAULT_ITEM_MAX_STACKS` ແລະ `MATERIAL_ITEM_IDS` ຂຽນເອງ ຊ້ຳກັບ `items.json` (`maxStack`, `category`); domain ບໍ່ມີ `ItemDefinition`. UI 8 ໄຟລ໌ເອີ້ນ `dataLoader` (fetch) ເອງ ແລະ Phaser ໂຫຼດ JSON ອີກທາງໜຶ່ງ; ມີແຕ່ `stages.json` ທີ່ຖືກກວດຮູບແບບ | `Backpack.ts:22–46`, `dataLoader.ts` | ເພີ່ມ item ໃໝ່ຕ້ອງແກ້ 2 ບ່ອນ; JSON ຜິດຮູບແບບພັງຕອນ runtime ແບບບໍ່ບອກສາເຫດ |
| 7 | **`entities` ເປັນ singleton ສາກົນທີ່ແກ້ໄຂໄດ້:** 11 ໄຟລ໌ import `composition.ts` (ລວມ scene ແລະ modal); ຖືກ assign ທັບ (`entities.equipment = …`, `entities.repairedGates = new Set`, `entities.forgeUnlocked = …`) ເຮັດໃຫ້ reference ທີ່ຖືໄວ້ເກົ່າ | `composition.ts`, `saveSnapshot.ts` | ທົດສອບ infrastructure ຍາກ, ມີຄວາມສ່ຽງ stale reference |
| 8 | **ຕັ້ງ/ກູ້ snapshot ຢູ່ infrastructure:** `saveSnapshot.ts` (ປະສານ entity ທັງໝົດ) ແລະ `SaveManager` ບໍ່ຢູ່ຫຼັງ port; ບໍ່ມີ test | `saveSnapshot.ts`, `storage/SaveManager.ts` | ເປັນ orchestration ແທ້ ຈຶ່ງຄວນຢູ່ `application/` ພ້ອມ test |
| 9 | **ຄຳສັບ/ກົດເກມເກົ່າຍັງຕົກຄ້າງໃນ domain:** `points` ຂອງ Boss/Enemy (ຄະແນນ), Achievement ໃຫ້ `rewardCoins` ເຂົ້າ Wallet ຜ່ານ `ClaimAchievementRewardUseCase` (ບໍ່ມີ UI ເອີ້ນ) — ຂັດກົດ "Credit ມາຈາກການຮຽນເທົ່ານັ້ນ" (ADR 0005); `Game.ts` ເອີ້ນ `trackAchievementUseCase` 6 ບ່ອນ ໃຫ້ຂໍ້ມູນທີ່ບໍ່ມີທາງສະແດງ | grep `points`, `rewardCoins` | ໂຄດຕາຍ ແລະມີຮູຮົ່ວທີ່ຈະເຮັດໃຫ້ Credit ມາຈາກການຕໍ່ສູ້ຖ້າໃຜເຊື່ອມ UI ພາຍຫຼັງ |
| 10 | **ໄຟລ໌ໃຫຍ່ເກີນໜ້າທີ່ດຽວ:** `Game.ts` 1230, `SoundManager.ts` 1071 (ມີ helper ບໍ່ໃຊ້), `App.tsx` 976, `TextbookModal` 702, `AcademyModal` 624, `Enemy.ts` 623, `BackpackModal` 607 | `wc -l` | ກົດ/ສະຖານະປົນກັບ JSX ແລະ physics ຍາກແຍກ |
| 11 | **ບໍ່ມີ guard ອັດຕະໂນມັດ:** ກົດ "ຊັ້ນໃນບໍ່ import ຊັ້ນນອກ" ຖືກຮັກສາດ້ວຍສາຍຕາເທົ່ານັ້ນ | `eslint.config.*` | ອະນາຄົດຫຼຸດໄດ້ງ່າຍ |

## ແນວທາງ (Approach)

- ເຮັດເປັນຂັ້ນເລັກໆ ແຕ່ລະຂັ້ນ commit ແຍກ, ຜ່ານ typecheck + lint + test + e2e ກ່ອນໄປຕໍ່. ຂັ້ນທີ່ປ່ຽນກົດ ໃຫ້ **TDD** (ຂຽນ test ໃນ `application/` ກ່ອນ) ເພາະ ADR 0002 ໃຫ້ທົດສອບສະເພາະສອງຊັ້ນໃນ — ຍ້າຍກົດເຂົ້າໄປຄືການເຮັດໃຫ້ມັນທົດສອບໄດ້.
- ເລີ່ມດ້ວຍ guard (ຖືກ, ໄວ), ແລ້ວແກ້ bug ທີ່ມາຈາກກົດຢູ່ສອງບ່ອນ, ຕັດໂຄດຕາຍ, ຈຶ່ງແຕະໂຄງສ້າງໃຫຍ່ (catalog, state). ບໍ່ເຮັດ rewrite ທັງໝົດ: ໂຄງ 3 ຊັ້ນຖືກຕ້ອງແລ້ວ.
- ບໍ່ປ່ຽນ balance/ພຶດຕິກຳເກມ ນອກຈາກຂໍ້ທີ່ລະບຸ (herb-potion).

## ຂັ້ນຕອນ (Steps)

### Phase 0 — Guard (ເຮັດກ່ອນ, ~ເຄິ່ງຊົ່ວໂມງ)
1. ເພີ່ມ `no-restricted-imports` ໃນ `eslint.config.*`: ໄຟລ໌ໃນ `src/domain/**` ຫ້າມ `phaser`, `react`, `../application`, `../infrastructure`; `src/application/**` ຫ້າມ `phaser`, `react`, `infrastructure`. ແລ່ນ `npm run lint` ຕ້ອງ 0 error.
2. ອັບເດດ `CLAUDE.md` ໃຫ້ບອກວ່າ lint ບັງຄັບກົດນີ້.

### Phase 1 — ກົດທີ່ຫຼຸດອອກໄປ UI/scene → use case (TDD)
3. `UseConsumableUseCase(backpack, health, item)`: ລຶບຂອງອອກ ແລະຟື້ນ `Health` ຕາມ `healAmount` (ຄ່າໃນ items.json ປ່ຽນເປັນ "ຈຳນວນຫົວໃຈ" — ເບິ່ງ Open Question 1). ລຶບ `setHealth(prev + 1)` ໃນ `App.tsx`. Test: ຟື້ນບໍ່ເກີນ max, ບໍ່ຟື້ນຖ້າເຕັມ (ບໍ່ກິນຂອງ), ບໍ່ມີຂອງ → ລົ້ມເຫຼວ.
4. `EquipWeaponUseCase`, `DiscardItemUseCase` (ກົດ "ຫ້າມຖິ້ມ tool/weapon" ຢູ່ domain ຕາມ category ຂອງ item; ເພີ່ມ `Backpack.removeCount(slotIndex, n)` ແທນ `selectedSlot.count -= 1`), ແລ້ວໃຫ້ `BackpackModal` ເອີ້ນຜ່ານ use case ແລະ emit event ຈາກ use case/ຜູ້ເອີ້ນຢ່າງດຽວ.
5. `AwardBossRewardUseCase(backpack)` ໃຫ້ boss-core/crystal ຈາກຄ່າຄົງທີ່ໃນ domain ແລະ ກົດຟື້ນ Boss 15% ເປັນ `Boss.reviveAfterFailedFinisher()` ໃນ entity (ຄ່າ `FINISHER_FAIL_HEAL_RATIO`). `Game.ts` ເຫຼືອແຕ່ເອີ້ນ ແລະເຮັດ effect/ຂໍ້ຄວາມ.
6. ກົດປະຕູ: `repairBrokenGateUseCase` ຮັບ `GateRequirements {requiredTool, requiredItem}` (ມາຈາກ `stages.json`); ເພີ່ມ `checkGateRequirements()` ໃຫ້ modal ເອີ້ນ ແທນ `startsWith('hammer')`. ເງື່ອນໄຂ Daily Practice → `canAccessDailyPractice(books, wallet)` ໃນ domain ແລ້ວໃຊ້ຄ່າ `STARTER_BOOK_CREDIT_RESERVE` ແທນເລກ 20.
7. Commit ແຍກຕໍ່ຂໍ້. ກວດ e2e + ຫຼິ້ນມື: ໃຊ້ herb-potion ແລ້ວຫົວໃຈໃນເກມຟື້ນຈິງ.

### Phase 2 — ຕັດໂຄດຕາຍ / ຄຳສັບເກົ່າ (ຕ້ອງຕັດສິນໃຈ Open Question 2 ກ່ອນ)
8. ລຶບ `points` ຈາກ `Boss`/`Enemy` archetype ແລະ test; ລຶບ `SoundManager` helper ທີ່ບໍ່ມີຜູ້ເອີ້ນ (ກວດດ້ວຍ grep ກ່ອນລຶບ).
9. Achievement: ທາງເລືອກ A ລຶບ (`Achievement.ts`, `TrackAchievementUseCase`, `ClaimAchievementRewardUseCase`, ການເອີ້ນໃນ `Game.ts`, ໃນ save schema ພ້ອມ bump ເປັນ v7); ທາງເລືອກ B ອອກແບບໃໝ່ເປັນ "ຜົນສຳເລັດດ້ານການຮຽນ" ທີ່ໃຫ້ລາງວັນບໍ່ແມ່ນ Credit ແລະມີ UI. ບໍ່ຄວນປ່ອຍຄ້າງ.

**ສະຖານະ Phase 0–2 (ເຮັດແລ້ວ):** ເພີ່ມ `no-restricted-imports`/`no-restricted-globals` ໃນ `eslint.config.mjs` (ທົດລອງແລ້ວວ່າຈັບການ import `phaser`/`infrastructure`/`window` ໃນ `application/`). use case ໃໝ່ + test: `ConsumeItemUseCase` (herb-potion ຟື້ນ 1 ຫົວໃຈ, ບໍ່ກິນຖ້າເຕັມ), `EquipWeaponUseCase`, `DiscardItemUseCase` (+ `Backpack.removeFromSlot`; bug ເກົ່າ: "ຖິ້ມ 1 ອັນ" ແກ້ສຳເນົາ slot ຈຶ່ງບໍ່ມີຜົນ), `AwardBossRewardUseCase` + `Boss.healAfterFailedFinisher`, `checkGateRequirements` (ເງື່ອນໄຂປະຕູມາຈາກ `stages.json` ຜ່ານ event `open-gate-repair`), `canAccessDailyPractice`. `Health` ຍ້າຍເຂົ້າ `entities.health` ໜຶ່ງຕົວ ທີ່ scene ແລະ UI ໃຊ້ຮ່ວມກັນ (ແກ້ bug herb-potion ທີ່ຢືນຢັນໃນ browser: ຫົວໃຈໃນ scene/HUD ຟື້ນຈິງ, ໃຊ້ຕອນເຕັມບໍ່ເສຍຢາ, ຢາ `healAmount` ເປັນ 1). ລຶບ Achievement ທັງໝົດ (`Achievement`, `Track/ClaimAchievementRewardUseCase`, fanfare, ການເອີ້ນໃນ `Game.ts`, field `achievements` ໃນ save) ແລະ `points` ຂອງ Boss/Enemy (ລຶບ constructor ແບບ legacy ຂອງ `Enemy`). **ບໍ່ bump save v7:** ການລຶບ field ບໍ່ທຳລາຍ save v6 (`migrateSaveSnapshot` ຂ້າມ key ທີ່ບໍ່ຮູ້ຈັກ) ຈຶ່ງບໍ່ເຮັດໃຫ້ນັກຮຽນເສຍ save. ຜົນ: 204 unit test, e2e 9 ຜ່ານ. **ຍັງຄ້າງ/ສັງເກດ:** ຍັງມີເງື່ອນໄຂ `'thunder-hammer'` (ອາວຸດທີ່ລຶບແລ້ວ) ໃນ `Game.ts`/`Player.ts`/`Enemy.ts` ເປັນໂຄດຕາຍ; `Health` ຍັງຢູ່ `entities` (singleton) ລໍ Phase 4.

### Phase 3 — ເນື້ອຫາເປັນແຫຼ່ງຄວາມຈິງດຽວ
10. ເພີ່ມ `ItemDefinition` (id, category, maxStack, healAmount, tier…) ໃນ `domain/entities/`; `Backpack` ຮັບ catalog (ຫຼື function `getMaxStack`) ແທນ `DEFAULT_ITEM_MAX_STACKS`/`MATERIAL_ITEM_IDS`/`STORY_ITEM_IDS` ທີ່ຂຽນເອງ — ເພີ່ມ flag `story: true` ໃນ items.json. ອັບເດດ test ຂອງ Backpack.
11. `infrastructure/content/ContentCatalog.ts`: ໂຫຼດ `books/questions/items/recipes/enemies/stages` ຄັ້ງດຽວ, ກວດຮູບແບບທຸກໄຟລ໌ (ຍົກ `parseStageDefinitions` ເປັນແບບຢ່າງ), ເອົາໃຫ້ UI ຜ່ານ context/props ແທນ `dataLoader` ໃນ 8 ໄຟລ໌. ແກ້ e2e ທີ່ກ່ຽວຂ້ອງ.
12. ອັບເດດ ADR 0003 (ຍ້າຍບັນທຶກ validation ມາເປັນ catalog).

**ສະຖານະ Phase 3 (ເຮັດແລ້ວ):** ເພີ່ມ `ItemDefinition`/`ItemCatalog` ໃນ domain; `Backpack` ຖາມ catalog ເລື່ອງ stack ແລະ "ວັດສະດຸທີ່ເສຍຕອນຕາຍ" (ລຶບ `DEFAULT_ITEM_MAX_STACKS`/`MATERIAL_ITEM_IDS`/`STORY_ITEM_IDS` ແລະພາຣາມິເຕີ `customMaxStack`; `items.json` ມີ flag `story`). `infrastructure/content/ContentCatalog.ts` ໂຫຼດ + ກວດ 6 ໄຟລ໌ຄັ້ງດຽວກ່ອນ render (`main.tsx`) ແລະສະແດງໜ້າ error ຖ້າຜິດ; `dataLoader.ts` ຖືກລຶບ, modal 7 ໜ້າ + `App.tsx` + `Game.ts`/`Preloader` ອ່ານ `getGameContent()` ແບບ synchronous. ເພີ່ມ `ContentIntegrity.test.ts` (ກວດ id ອ້າງອີງຂ້າມໄຟລ໌) ແລະ `ContentCatalog.test.ts`. **ພົບ bug ຂໍ້ມູນ:** `enemies.json` ໃຊ້ `type` ແຕ່ domain ອ່ານ `kind` (ເຮັດໃຫ້ mini-boss/boss ຖືກອ່ານເປັນ undefined) — ແກ້ເປັນ `kind` ແລ້ວ ແລະມີ test ກັນຊ້ຳ. ຜົນ: 223 unit test, e2e 9 ຜ່ານ. **ຍັງຄ້າງ:** ລາງວັນ Boss (`BOSS_FINISHER_REWARD`) ຍັງຂຽນໃນ domain ຊ້ຳກັບ `drops` ຂອງ boss ໃນ `enemies.json` (ຄວນລວມເປັນແຫຼ່ງດຽວ); ໜ້າ error ຕອນໂຫຼດຂໍ້ມູນລົ້ມເຫຼວ ຍັງບໍ່ໄດ້ເບິ່ງດ້ວຍຕາ (ກວດແຕ່ຂໍ້ຄວາມຂອງ parser ດ້ວຍ test).

### Phase 4 — ສະຖານະ ແລະ composition
13. ຍ້າຍ `Health` (ແລະ HP ຂອງ Boss ທີ່ສະແດງໃນ HUD) ມາຢູ່ `GameState` ດຽວ; scene ແລະ React ອ່ານຈາກນັ້ນ + event ມີແຕ່ແຈ້ງການປ່ຽນ. ລຶບ `maxHealth` ຊ້ຳ.
14. ປ່ຽນ `entities` ເປັນ `GameState` ທີ່ມີ method `loadFrom(snapshot)` ແກ້ໃນບ່ອນ (ບໍ່ assign ທັບ `equipment`, `repairedGates`, `forgeUnlocked`, `spacedRepetition`).
15. ຍ້າຍ `createCurrentSnapshot`/`restoreEntitiesFromSnapshot`/`resetEntitiesToNewGame` ເປັນ `application/` (`CreateSaveSnapshotUseCase`, `RestoreSaveSnapshotUseCase`, `ResetGameUseCase`) ພ້ອມ test ແລະ `SavePort` (SaveManager ເປັນ adapter).
16. React: ສະໜອງ `GameState` ຜ່ານ Context ແທນ import singleton ໃນ modal; Phaser scene ຮັບຜ່ານ `init(data)`/registry. (ເຮັດຫຼັງຂໍ້ 13–15 ຜ່ານ.)

**ສະຖານະ Phase 4 (ເຮັດແລ້ວ):** ເພີ່ມ `GameState` (domain) ລວມ entity ທັງໝົດ ແລະ `entities` ໃນ `composition.ts` ກາຍເປັນ `GameState` ຕົວດຽວ; ສະມາຊິກທັງໝົດຖືກສ້າງຄັ້ງດຽວ ແລະ load ຈາກ save ແບບ in-place (ເພີ່ມ `EquipmentState.loadFromSnapshot`, `SpacedRepetitionSystem.loadFromSnapshot`; ບໍ່ມີການ assign ທັບ `equipment`/`repairedGates`/`spacedRepetition` ອີກ — ກວດໃນ browser ວ່າ reference ເດີມຍັງຢູ່ຫຼັງ Load). ຍ້າຍ logic snapshot ຈາກ `saveSnapshot.ts` ໄປ `application/SaveSnapshotUseCases.ts` (`createSaveSnapshotUseCase`, `restoreSaveSnapshotUseCase`, `resetGameUseCase`) ພ້ອມ `SavePort` (SaveManager implements) ແລະ test ດ້ວຍ fake port (round trip, reset ໄດ້ຜູ້ຫຼິ້ນໃໝ່ພ້ອມຂວານ/ດາບເລີ່ມຕົ້ນ); `saveSnapshot.ts` ເຫຼືອເປັນຕົວເຊື່ອມບາງໆ + `autoSaveGame()` ແທນ `saveManager.autoSave(createCurrentSnapshot())` ທີ່ຊ້ຳ 17 ບ່ອນ. `Health` ຢູ່ໃນ `GameState` ແລ້ວ (ເຮັດໃນ Phase 1). ຜົນ: 229 unit test, e2e 9 ຜ່ານ; ກວດ Save/Load/Reset ຜ່ານ UI ໃນ browser. **ບໍ່ໄດ້ເຮັດ (ຕັດສິນໃຈຂ້າມ):** ຂັ້ນ 16 React Context — ຍັງມີແຕ່ `App` ເປັນຜູ້ໃຊ້ຫຼັກ ແລະ scene ກໍ່ຕ້ອງເຂົ້າເຖິງ state ດຽວກັນ ຈຶ່ງຍັງບໍ່ໄດ້ຜົນພໍ; ຄວນເຮັດເມື່ອມີ test ຂອງ React. **ພົບແລ້ວແກ້ໃນ commit ຖັດມາ:** `SaveManager.autoSave` ເຄີຍຂ້າມການບັນທຶກຖ້າຜ່ານມາ < 3 ວິນາທີ (ຊື້ skin ແລ້ວໃສ່ທັນທີ → ຄັ້ງທີສອງບໍ່ຖືກບັນທຶກ). ແກ້ດ້ວຍ `createTrailingThrottle` (domain/utils, ມີ test ດ້ວຍ clock ປອມ): ຄັ້ງທຳອິດບັນທຶກທັນທີ, ຄັ້ງທີ່ມາໄວເກີນຖືກເລື່ອນໄປທ້າຍຊ່ວງ 3 ວິ ແລະບັນທຶກ state ຫຼ້າສຸດ, ແລະ flush ທັນທີເມື່ອ `pagehide`/`visibilitychange→hidden`; ລຶບ throttle ທີ່ຊ້ຳໃນ `SaveManager`. ກວດໃນ browser ແລ້ວ.

### Phase 5 — ແຍກໄຟລ໌ໃຫຍ່ (ເສັ້ນທາງເລືອກ ເຮັດຫຼັງ Phase 1–4)
17. `Game.ts` → `CombatController` (attack/stomp/boss hit) ແລະ `InteractionController` (prompt + E key); `App.tsx` effect ໃຫຍ່ → hooks (`useGameEvents`, `useGlobalShortcuts`) ແລະ modal state ເປັນ `useModals`; `TextbookModal`/`AcademyModal`/`BackpackModal` ແຍກ logic ອອກເປັນ hook.
18. ບໍ່ມີ test ໃໝ່ສຳລັບ Phaser; ກວດດ້ວຍ typecheck + e2e + ຫຼິ້ນມື.

**ສະຖານະ Phase 5 (ເຮັດແລ້ວ):** `Game.ts` 1207 → 621 ແຖວ: `CombatController` (ໂຈມຕີ, ຢຽບ, ຖືກສັດຕູ/ໜາມ/ນ້ຳລາຍ, hook ຂອງ Boss, ຂອງຕົກ, hit-stop), `InteractionController` (prompt + ຜົນຂອງປຸ່ມ E ສຳລັບອາຄານ, waypoint, ປະຕູ, node, ຜູ້ເຖົ້າ), `scenery/WorldBuilder` (ທ້ອງຟ້າ/ພື້ນ/platform/ໜາມ) ແລະ `effects/FloatingText`. `App.tsx` 973 → 760 ແຖວ: `useGameEvents` (subscribe ຄັ້ງດຽວແບບຕາຕະລາງ), `useGlobalShortcuts`, `useModalState` (state ຂອງ modal 11 ຕົວ + `closeTopModal`), ແລະລຶບ ref ທີ່ບໍ່ຈຳເປັນອອກ. **bug ທີ່ພົບ ແລະແກ້ພ້ອມກັນ:** (1) ກົດ Q ສັບດາບສອງຄັ້ງ (ທັງ Phaser ແລະ React ຮັບ Q) ຈຶ່ງບໍ່ປ່ຽນດາບເລີຍເມື່ອມີ 2 ເຫຼັ້ມ — ປ່ອຍໃຫ້ Phaser ຮັບ Q ຢ່າງດຽວ ແລະເພີ່ມ `e2e/shortcuts.spec.ts` (ກວດວ່າລົ້ມເຫຼວກັບໂຄດເກົ່າ); (2) handler ໃນ effect ແບບ `[]` ໃຊ້ closure ຈາກ render ທຳອິດ (ເຊັ່ນ `handleStartGame` ອ່ານ skin ເກົ່າ) — ດຽວນີ້ hook ເອີ້ນ handler ຫຼ້າສຸດສະເໝີ (ແກ້ຕາມໂຄດ ຍັງບໍ່ໄດ້ທົດສອບແຍກ); (3) ປ່ຽນດາບຜ່ານ event ຈະບັນທຶກ save ອັດຕະໂນມັດ. ລຶບສາຂາ `'thunder-hammer'` ທີ່ຕາຍແລ້ວໃນ combat. ຜົນ: 236 unit test, e2e 10 ຜ່ານ. **ຍັງຄ້າງ:** `Game.preload` ຍັງຊ້ຳລາຍການ asset ກັບ `Preloader` ແລະໂຫຼດ asset ທີ່ບໍ່ໃຊ້ແລ້ວ (door/flag/powerup); `'thunder-hammer'` ຍັງເຫຼືອໃນ `Player.ts`/`Enemy.ts`; `TextbookModal`/`AcademyModal`/`BackpackModal` ຍັງໃຫຍ່ (600–700 ແຖວ) ແລະ logic ບາງສ່ວນຢູ່ໃນ component.

### Phase 6 — ເອກະສານ
19. ADR 0006: "ເນື້ອຫາ (JSON) ກວດຮູບແບບຢູ່ catalog ແລະ state ຢູ່ໃນ GameState ດຽວ"; ອັບເດດ ADR 0002 (ສິ່ງທີ່ຍັງຕ້ອງທົດສອບມືຢູ່ infrastructure ເຫຼືອນ້ອຍລົງ), `CLAUDE.md`, `CONTEXT.md` (ເພີ່ມ `GameState`, `Content catalog`).

**ສະຖານະ Phase 6 (ເຮັດແລ້ວ):** ເພີ່ມ `docs/adr/0006-content-catalog-and-single-game-state.md` (ໂຫຼດ+ກວດເນື້ອຫາຄັ້ງດຽວ, `ItemCatalog`, `GameState` load ແບບ in-place, lint ບັງຄັບຊັ້ນ; ບັນທຶກທາງເລືອກທີ່ຂ້າມ: zod, React Context); ADR 0001 ເພີ່ມໝາຍເຫດວ່າ lint ບັງຄັບກົດ; ADR 0002/0003 ອັບເດດໃນ Phase 3; `CONTEXT.md` ເພີ່ມ Game state ແລະ Content catalog; `CLAUDE.md` ອັບເດດຕາມແຕ່ລະ Phase.

## Files ທີ່ຈະຖືກກະທົບ

- `eslint.config.*`, `CLAUDE.md` — guard.
- `src/application/` — ໃໝ່: `UseConsumableUseCase`, `EquipWeaponUseCase`, `DiscardItemUseCase`, `AwardBossRewardUseCase`, `CreateSaveSnapshotUseCase`, `RestoreSaveSnapshotUseCase`, `ResetGameUseCase` (+test); ແກ້ `RepairBrokenGateUseCase`.
- `src/domain/entities/Backpack.ts`, `Boss.ts`, `Enemy.ts`, `Achievement.ts`, ໃໝ່ `ItemDefinition.ts`, `GameState.ts`; `src/domain/ports/index.ts` (`SavePort`).
- `public/data/items.json` — `story` flag, `healAmount` ເປັນຫົວໃຈ.
- `src/infrastructure/composition.ts`, `saveSnapshot.ts` (ຍ້າຍ/ລຶບ), `dataLoader.ts` (ແທນດ້ວຍ `content/ContentCatalog.ts`), `storage/SaveManager.ts`.
- `src/infrastructure/phaser/scenes/Game.ts` (+ controller ໃໝ່), `objects/Boss.ts`.
- `src/infrastructure/react/App.tsx`, `components/BackpackModal.tsx`, `GateRepairModal.tsx`, `AcademyModal.tsx`, `TextbookModal.tsx`, `ForgeModal.tsx`, `WorkshopModal.tsx`, `QuizFinisherModal.tsx`, hooks ໃໝ່.
- `src/domain/entities/SaveData.ts` (+test) ຖ້າລຶບ Achievement (bump v7).
- `e2e/*.spec.ts` — ແກ້ເມື່ອປ່ຽນການໂຫຼດ data.

## ຄວາມສ່ຽງ / ຄຳຖາມທີ່ຍັງເປີດ (Risks / Open Questions)

**ຄຳຖາມເປີດ (ຕ້ອງໃຫ້ເຈົ້າຂອງໂປຣເຈັກຕັດສິນ)**
1. **herb-potion ຟື້ນເທົ່າໃດ?** `items.json` ມີ `healAmount: 40` ແຕ່ Health ເປັນຫົວໃຈ 3 ດວງ. ແນະນຳ: ຟື້ນ 1 ຫົວໃຈ (ເຖິງຢ່າງນັ້ນ React ເຄີຍເພີ່ມ 1 ຢູ່ແລ້ວ) ແລະປ່ຽນຄ່າໃນ JSON ເປັນ `1`.
2. **Achievement ເກັບ ຫຼື ລຶບ?** ແນະນຳລຶບກ່ອນ (ເປັນໂຄດຕາຍ + ຂັດ ADR 0005) ແລ້ວອອກແບບໃໝ່ທີຫຼັງ ເມື່ອມີ UI; ການລຶບເຮັດໃຫ້ຕ້ອງ bump save v7.
3. **React Context ຫຼືຍັງໃຊ້ singleton?** ແນະນຳ Context + `GameState`; ຖ້າຕ້ອງການຫຍໍ້ ອາດຂ້າມ Phase 4 ຂໍ້ 16 ແລະຍອມຮັບ singleton ທີ່ແກ້ໃນບ່ອນ (ບໍ່ assign ທັບ).
4. ສຳຄັນສຳລັບລຳດັບ: ເຮັດ Phase 0–2 (ຖືກ, ແກ້ bug ແທ້) ກ່ອນ ແລ້ວຄ່ອຍຕັດສິນ Phase 3–5 (ໃຫຍ່ກວ່າ, ຜົນເປັນໂຄງສ້າງ).

**ຄວາມສ່ຽງ**
- ຂໍ້ 1 (herb-potion bug) ຍັງບໍ່ໄດ້ຢືນຢັນດ້ວຍການຫຼິ້ນ — ກວດຈາກໂຄດ: ບໍ່ມີ listener ໃນ `Game.ts` ສຳລັບ `backpack-item-used`. ຕ້ອງຢືນຢັນກ່ອນແກ້.
- Phase 3–4 ແຕະຫຼາຍໄຟລ໌ UI ພ້ອມກັນ; e2e (9 spec) ເປັນຕາໜ່າງຄວາມປອດໄພຫຼັກ ແລະບາງ spec ເຄີຍບໍ່ໝັ້ນຄົງເມື່ອ CPU ເຕັມ — ແລ່ນແຍກຈາກ build.
- ການລຶບ Achievement/ປ່ຽນ schema ເຮັດໃຫ້ save v6 ທີ່ມີຢູ່ເລີ່ມໃໝ່ (ຫຼືຕ້ອງຂຽນ migration); ຕາມທີ່ຜ່ານມາ save ເກົ່າຖືກປະຕິເສດ ເຊິ່ງຍອມຮັບໄດ້ໃນຊ່ວງທົດລອງ ແຕ່ຕ້ອງຢືນຢັນວ່າບໍ່ມີນັກຮຽນໃຊ້ຢູ່.
- ການແຍກ `Game.ts`/`App.tsx` ບໍ່ມີ test ອັດຕະໂນມັດ — ອີງ typecheck + e2e + ຫຼິ້ນມື.
- ບໍ່ໄດ້ກວດ: ຄຸນນະພາບ `SoundManager` ພາຍໃນ, `Enemy.ts`/`Player.ts` ລະອຽດ, (listener ຂອງ `Game.ts` ມີ `removeListener` ຄູ່ກັນແລ້ວ).
