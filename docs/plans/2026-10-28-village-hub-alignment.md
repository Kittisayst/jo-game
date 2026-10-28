# ປັບ code base ໃຫ້ຕົງກັບ GDD Village Hub (ຕັດຂອງເກົ່າ + loop ທີ່ຕັດສິນໃຈແລ້ວ)

- **Date:** 2026-10-28
- **Status:** planned
- **Project:** jo-game (ພະຈົນໄພຄວາມຮູ້ / Knowledge Quest)

## ເປົ້າໝາຍ (Goal)

ເກມຖືກສ້າງຕໍ່ຍອດຈາກ platformer ເກົ່າ (ຫຼຽນ, ຄະແນນ, ຊີວິດ, Shop, power-up, ອາວຸດ sci-fi) ເຮັດໃຫ້ມີລະບົບຊ້ອນກັບ GDD Village Hub. ແຜນນີ້:

1. ແກ້ຈຸດທີ່ loop ຫຼັກຂອງ GDD ເພິ່ງບໍ່ເຮັດວຽກ ຫຼື ອາດບໍ່ເຮັດວຽກ.
2. ຕັດລະບົບເກົ່າທີ່ຂັດກັບ GDD (ໂດຍສະເພາະຫຼຽນທີ່ປົນກັບ Credit).
3. ແຍກ `Game.ts` / `App.tsx` ທີ່ໃຫຍ່ເກີນ ຫຼັງຕັດສຳເລັດ.
4. ອັບເດດເອກະສານ (CLAUDE.md, CONTEXT.md, GDD) ໃຫ້ຕົງກັບໂຄດ.

ຂໍ້ຕົກລົງທັງໝົດມາຈາກ `/grill-with-docs` 2 ຮອບ (ເບິ່ງ `docs/Game Design Doc-Village Hub.md` ແລະ `CONTEXT.md`).

## Context ປັດຈຸບັນ

ຜົນກວດ (typecheck/lint/test/build ຜ່ານໝົດ, 250 tests, 0 lint error; ບໍ່ໄດ້ເປີດເກມຫຼິ້ນຈິງ).

**ຄວາມເສຍຫາຍທີ່ຢືນຢັນຈາກການອ່ານໂຄດ:**

| ບັນຫາ | ຫຼັກຖານ |
|---|---|
| **ອາວຸດ GDD ອາດບໍ່ກະທົບການສູ້** | `PerformAttackUseCase` ໃຊ້ `weaponLoadout.equippedDefinition` (ຊຸດເກົ່າ cyber-saber...). `EquipmentState` (ດາບໄມ້/ເຫຼັກ/ຜລຶກ + upgrade) ບໍ່ຖືກອ່ານໃນ `Game.ts`/`Player.ts` ເລີຍ. ການສ້າງດາບເຫຼັກຈຶ່ງອາດບໍ່ເພີ່ມດາເມດ. **ຕ້ອງຢືນຢັນໂດຍການຫຼິ້ນ/ອ່ານ `Player.ts` ກ່ອນເລີ່ມ** |
| ຫຼຽນ = Credit (Wallet ດຽວ) | `App.tsx:283,328` ເອົາຫຼຽນເຂົ້າ `wallet`; `Enemy.coinDropChance`; Achievement ໃຫ້ `rewardCoins` |
| ມີ Inventory 2 ຊຸດ | `Inventory` (ເກົ່າ, ສຳລັບ Shop) ແລະ `Backpack` (GDD) |
| ມີ Weapon 2 ຊຸດ | `WeaponLoadout`/`WEAPON_CATALOG` vs `EquipmentState` |
| Repair Kit ບໍ່ໃຊ້ຜລຶກ | `recipes.json`: ໄມ້ 5 + ແຮ່ເຫຼັກ 3 + ເສັ້ນໃຍ 4 |
| ຜລຶກ/Boss Core ຖືກຫັກ 50% | `MATERIAL_ITEM_IDS` ໃນ `Backpack.ts` ລວມ `crystal`, `boss-core` |
| ບໍ່ແຈກຂວານເລີ່ມເກມ | default save: `backpack: []`; ຕົ້ນໄມ້ຕ້ອງໃຊ້ຂວານ, ຂວານຕ້ອງໃຊ້ໄມ້ 5 |
| ໂຄດ/ຂໍ້ມູນຕາຍ | `level-1/2/3.json` ບໍ່ຢູ່ໃນ `LEVEL_CATALOG`; `stage-ch1.json` ບໍ່ມີ spike/moving platform/power-up |
| Resource node hardcode ຊ້ຳ | `Game.ts` ~1401–1460 ຊ້ຳກັບ `stages.json` |
| ໄຟລ໌ໃຫຍ່ | `Game.ts` 2,336 ແຖວ, `App.tsx` 1,452 ແຖວ |

**ສິ່ງທີ່ເຮັດຖືກແລ້ວ (ບໍ່ແຕະ):** ກົດສອບ 4/5 (+50/+5), ປະຕູພັງບໍ່ເສຍ Kit ເມື່ອຕອບຜິດ, repairedGates persist, ກະເປົາ 20 ຊ່ອງ, `LEVEL_CATALOG` ເຫຼືອ village + stage-ch1, ຊັ້ນ domain/application ບໍ່ import phaser/react.

## ຂໍ້ແກ້ໄຂແຜນ (ພົບຕອນກຽມ Phase 2, 2026-10-28)

ການອ່ານໂຄດເລິກຂຶ້ນພົບວ່າ Context ຂ້າງເທິງ ແລະບາງຂັ້ນຕອນຜິດ/ບໍ່ຄົບ:

1. **`enemies.json` ບໍ່ຖືກໃຊ້ເລີຍ.** ສັດຕູໃນ `stage-ch1.json` ເປັນປະເພດເກົ່າ (`walker`/`jumper`/`spitter`, HP 1–3 ຈາກ `ENEMY_ARCHETYPES`), Boss `hp: 10`. ຂໍ້ມູນ GDD (forest-slime 40 HP, rock-golem 80, cave-guardian 180, boss 300, drop table) ບໍ່ຢູ່ໃນເກມ. ຜົນ: ດາເມດດາບ GDD (12–64) ຈະເຮັດໃຫ້ສັດຕູທຸກໂຕຕາຍດ້ວຍ 1 ຕີ ຖ້າຮວມອາວຸດໂດຍບໍ່ປ່ຽນ HP ພ້ອມກັນ.
2. **ບໍ່ມີ Mini-boss ຈິງ.** `Game.ts:1493` ມີແຕ່ປ້າຍຂໍ້ຄວາມ "Cave Guardian". ສັດຕູບໍ່ drop ວັດສະດຸ (drop ແຕ່ຫຼຽນ).
3. **Repair Kit ບໍ່ສາມາດສ້າງໄດ້ໃນການຫຼິ້ນປົກກະຕິ** ທັງກ່ອນ ແລະຫຼັງ Phase 1: ເສັ້ນໃຍ (ສູດເກົ່າ) ບໍ່ມີແຫຼ່ງ; ຜລຶກ (ສູດໃໝ່) ມີແຫຼ່ງດຽວຄືລາງວັນຫຼັງ Boss ເຊິ່ງຢູ່ຫຼັງປະຕູທີ່ຕ້ອງໃຊ້ Kit. ຕ້ອງມີ Mini-boss ຈິງ ເກມຈຶ່ງຈົບໄດ້.
4. **`stage-ch1.json` ໃຊ້ Spike (2) ແລະ MovingPlatform (1) ຢູ່.** ການເວົ້າກ່ອນໜ້າວ່າບໍ່ໃຊ້ຜິດ → **Step 18 ຕ້ອງເກັບ `Spike` ແລະ `MovingPlatform`** (ຍັງລຶບ PowerUp/Door/GoalFlag/`level-1/2/3.json` ໄດ້ຫຼັງກວດ usage).
5. Credit ເລີ່ມເກມໃນໂຄດເປັນ 50 → ແກ້ເປັນ 20 ແລ້ວ (commit `fix(economy)`).

**Phase 2 ຖືກຂະຫຍາຍເປັນ "Phase 2: Combat ຂັບດ້ວຍຂໍ້ມູນ":** ຮວມອາວຸດ (EquipmentState) + ໃຫ້ສັດຕູ/Boss ອ່ານ HP/damage/drops ຈາກ `enemies.json` + ສ້າງ Mini-boss (cave-guardian) ຈິງທີ່ drop ຜລຶກ + ວັດສະດຸຈາກສັດຕູຕາມ drop table. ຕ້ອງເຮັດພ້ອມກັນເພື່ອບໍ່ໃຫ້ balance ພັງ.

**ສະຖານະ Phase 2 (ເຮັດແລ້ວ):** ການໂຈມຕີ/stomp/Boss ໃຊ້ດາເມດຈາກ `EquipmentState`; ສັດຕູ `stage-ch1` ອ່ານ HP/drops ຈາກ `enemies.json` (forest-slime ×3, rock-golem ×2, **cave-guardian** Mini-boss ×1 drop ຜລຶກ 2 + ແຮ່ເຫຼັກ); Boss HP 300 ຈາກຂໍ້ມູນ, phase ຕາມອັດຕາສ່ວນ HP; ຕອບຜິດ Boss ຟື້ນ 15% ຂອງ HP ສູງສຸດ; Q ສັບດາບທີ່ມີໃນກະເປົາ; ລຶບ `PurchaseWeapon`/`EquipWeapon` use case + tab ອາວຸດໃນ Shop. **ຍັງຄ້າງ:** ຍັງບໍ່ໄດ້ຫຼິ້ນ `stage-ch1` ຈິງ (ກວດແຕ່ typecheck/test/build ແລະໂຫຼດ level-1 ໃນ browser ໂດຍບໍ່ມີ error); Mini-boss ຍັງເປັນ armored slime ຂະໜາດ ×1.8 (ບໍ່ມີ 2 ທ່າໂຈມຕີ); `Weapon.ts`/`WeaponLoadout` ຍັງຢູ່ເພື່ອ save compat (ລຶບໃນ Phase 4 ພ້ອມ save v6); `Projectile`/bomb/dash/`StageMapModal` ຍັງສະແດງ level-1/2/3 ເກົ່າ; HP ສັດຕູ vs ດາເມດ ຍັງບໍ່ໄດ້ playtest ປັບ.

**ສະຖານະ Phase 3 (ເຮັດແລ້ວ):** ລຶບຫຼຽນທັງໝົດ (Coin object, `CollectCoinUseCase`, coin drop, `GameSession.coins`, ຫຼຽນໃນ HUD/ເມນູ/Game Over/Level Complete, ການເອົາຫຼຽນເຂົ້າ Wallet), Shop (`ShopModal`, `PurchaseItem/Upgrade`, NPC ຮ້ານຄ້າ, `merchantDialogue`), upgrade ເກົ່າ (`Upgrade.ts`), Inventory ເກົ່າ (`Inventory.ts`, `UseItemUseCase`, hotbar 1-2-3), dash ແລະ bomb. ຊ່ອງທາງເຂົ້າ Achievements (ປຸ່ມ HUD/ເມນູ/toast) ຖືກເຊື່ອງ ເພື່ອບໍ່ໃຫ້ມີ Credit ຈາກການຂ້າສັດຕູ; ໂຄດ Achievement ຍັງຢູ່ (Phase 4). `upgrades`/`inventory` ຖືກເອົາອອກຈາກ save schema (save ເກົ່າຖືກເມີນ field ເຫຼົ່ານີ້).

**ສະຖານະ Phase 4 (ເຮັດແລ້ວ):** ລຶບ Score/High Score/Best Time/ດາວ/ໂມງ, `GameSession`, `GameStats`, Power-ups, `Door`/`GoalFlag`/`Projectile`, `LevelProgress`/`CompleteLevelUseCase`, ໜ້າ Game Over ແລະ Level Complete, `WeaponLoadout`, `level-1/2/3` (catalog + JSON + scenery), ແລະ UI Skins/Achievements. `Lives` → `Health` (event `player-died`). ຕາຍ → ກັບໝູ່ບ້ານ (ເສຍວັດສະດຸ 50% ຍົກເວັ້ນຜລຶກ/Boss Core), ຊະນະ Boss → event `stage-cleared`. Save v6 (save ເກົ່າເລີ່ມໃໝ່ ແຕ່ເກັບ settings + skin). ເມນູຫຼັກ: ເຂົ້າເກມ / ແຜນທີ່ດ່ານ / ຕັ້ງຄ່າ; HUD ມີ hint ເປົ້າໝາຍຖັດໄປ (`getNextObjective`). **ຍັງຄ້າງ:** `Player.ts` ຍັງມີໂຄດ star/spring/dash ທີ່ບໍ່ຖືກເອີ້ນ; `SelectSkinUseCase`/`Skin` ຍັງຜູກກັບ score (ບໍ່ມີ UI); ໂຄດ Achievement ຍັງຢູ່ແຕ່ບໍ່ມີທາງເຂົ້າ; ຂໍ້ຄວາມ toast ຕອນຕາຍບໍ່ໄດ້ຢືນຢັນດ້ວຍຕາ.

## ແນວທາງ (Approach)

- **ຕັດເປັນຂັ້ນນ້ອຍ**, ແຕ່ລະຂັ້ນ typecheck + lint + test ຜ່ານ ແລ້ວ commit ແຍກ (ຍ້ອນກັບງ່າຍ). ບໍ່ລວມຫຼາຍຂັ້ນໃນ commit ດຽວ.
- **ແກ້ loop ກ່ອນ ຕັດຂອງເກົ່າທີຫຼັງ ແລ້ວຈຶ່ງແຍກໄຟລ໌ໃຫຍ່**: ການແກ້ loop (Phase 1–2) ຕ້ອງການໃຫ້ playtest ໄດ້ໄວທີ່ສຸດ; ການແຍກ `Game.ts` (Phase 5) ເຮັດຫຼັງໂຄດນ້ອຍລົງ ເພື່ອບໍ່ຕ້ອງຍ້າຍໂຄດທີ່ຈະຖືກລຶບ.
- **ລຶບແທນການເຊື່ອງ** ຍົກເວັ້ນ Skins ແລະ Achievements (ເຊື່ອງຈາກ UI, ເກັບໂຄດ) ຕາມທີ່ຕົກລົງ.
- ໃຊ້ git history ເປັນບ່ອນເກັບໂຄດທີ່ລຶບ, ບໍ່ສ້າງໂຟນເດີ `legacy/`.
- TDD ສຳລັບກົດໃນ domain/application (Phase 2, 6); ສ່ວນ infrastructure ບໍ່ມີ automated test ຕາມ ADR 0002, ກວດດ້ວຍ typecheck + ຫຼິ້ນມືເອງ/e2e.

## ຂັ້ນຕອນ (Steps)

### Phase 0 — ກຽມ
1. ຂໍ້ມູນປັດຈຸບັນມີການແກ້ໄຂທີ່ຍັງບໍ່ commit (ລະບົບປຶ້ມ 17 ໄຟລ໌ + 4 ໄຟລ໌ໃໝ່) ແລະ `skills-lock.json`. **commit ສິ່ງເຫຼົ່ານີ້ແຍກກ່ອນ** (ຫຼື stash) ເພື່ອບໍ່ປົນກັບການຕັດ.
2. ສ້າງ branch `refactor/gdd-alignment`.
3. ເກັບ baseline: `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build-nolog` ຕ້ອງຜ່ານກ່ອນເລີ່ມ.
4. ອ່ານ `Player.ts` + `PerformAttackUseCase.ts` ເພື່ອຢືນຢັນຂໍ້ "ອາວຸດ GDD ບໍ່ກະທົບການສູ້", ແລະເປີດເກມ 1 ຮອບ (`npm run dev-nolog`) ເພື່ອເຫັນ flow ຈິງ.

### Phase 1 — ແກ້ loop ຫຼັກ (ນ້ອຍ, ສຳຄັນ, ເຮັດກ່ອນ)
5. **ແຈກຂວານ T1 ຕອນເລີ່ມເກມ**: ໃຫ້ `createDefaultSaveSnapshot` ໃສ່ `axe-t1` (ແລະ `wooden-sword`) ໃນ backpack; ແກ້ test `SaveData.test.ts`. ກັບ save ເກົ່າທີ່ບໍ່ມີຂວານ: ບໍ່ຕ້ອງຮັກສາ (ເບິ່ງ Step 20).
6. **Repair Kit ໃຊ້ຜລຶກ 1**: ແກ້ `recipes.json` (ໄມ້ 5 + ແຮ່ເຫຼັກ 3 + ຜລຶກ 1); ແກ້ test ແລະ GDD ໃຫ້ຕົງກັນ.
7. **ຜລຶກ + Boss Core ບໍ່ຖືກຫັກ 50%**: ແຍກ `MATERIAL_ITEM_IDS` ເປັນ "ວັດສະດຸທີ່ຫັກໄດ້" ກັບ "ໄອເທັມເນື້ອເລື່ອງ" (`crystal`, `boss-core`) ໃນ `Backpack.applyRetreatPenalty`; ເພີ່ມ test ກໍລະນີ "ຕາຍມີຜລຶກ 3 → ຍັງ 3, ໄມ້ 5 → 2 (ceil)". ອັບເດດ `CONTEXT.md` ຄຳນິຍາມ Material (ແລ້ວ).
8. ຜ່ານ typecheck/lint/test → commit "fix(loop): starter axe, crystal repair kit, story items kept on death".

### Phase 2 — ຮວມລະບົບອາວຸດ (ຫຼັງຢືນຢັນ Step 4)
9. ໃຫ້ການໂຈມຕີອ່ານດາເມດຈາກ `EquipmentState.getEquippedDamage()` (ດາບ + upgrade bonus ຕາມ `recipes.json`) ແທນ `WeaponLoadout`; TDD ໃນ `PerformAttackUseCase.test.ts`: ດາບໄມ້ < ດາບເຫຼັກ < ດາບເຫຼັກ+3 < ດາບຜລຶກ.
10. ແກ້ວິທີສັບດາບ: ເລື່ອງການສັບອາວຸດໃນເກມ (ປຸ່ມ cycle) ໃຫ້ວນຜ່ານດາບທີ່ມີໃນ backpack ເທົ່ານັ້ນ (ເບິ່ງ Open Question 1).
11. ລຶບ `WeaponLoadout`, `WEAPON_CATALOG` (cyber-saber, plasma-blaster, thunder-hammer, boomerang-disc), `EquipWeaponUseCase` ເກົ່າ, ແລະ test ທີ່ກ່ຽວຂ້ອງ; ກວດ `Projectile.ts` ວ່າ Boss ໃຊ້ບໍ — ຖ້າບໍ່ໃຊ້ຈະລຶບໃນ Step 18.
12. commit "refactor(combat): single weapon system driven by EquipmentState".

### Phase 3 — ຕັດເສດຖະກິດເກົ່າ (ຫຼຽນ, Shop, Upgrade)
13. **ຕັດຫຼຽນ**: ລຶບ `Coin` object, `CollectCoinUseCase`, `Enemy.coinDropChance`, `session.addCoin`, ການ `wallet.earn(coins)` ໃນ `App.tsx`; `Wallet` = Credit ເທົ່ານັ້ນ. ອັບເດດ HUD/modal ທີ່ສະແດງຫຼຽນ.
14. **ລຶບ Shop**: `ShopModal`, `PurchaseWeaponUseCase`, `PurchaseItemUseCase`, `PurchaseUpgradeUseCase`, `UPGRADE_CATALOG`/`UpgradeTree`, `Inventory` ເກົ່າ (ຫຼັງຢືນຢັນ `UseItemUseCase` ບໍ່ຈຳເປັນ — ຢາສະໝຸນໄພໃຊ້ຜ່ານ `Backpack`); ລຶບ `STARTER_BOOK_CREDIT_RESERVE` ການກວດໃນ Shop (ເກັບ guard ໃນ `SaveData` ຖ້າຍັງຈຳເປັນ).
15. commit ແຍກ 2 ອັນ (ຫຼຽນ / Shop).

### Phase 4 — ຕັດຄະແນນ, ຊີວິດ, ຈົບດ່ານແບບເກົ່າ, ຂອງຕາຍ
16. ຕັດ Score, HighScore, BestTime, `calculateStarRating`, speedrun timer ໃນ `GameSession`/`TickSessionUseCase`/`GameStats`; ລຶບ `GameOverModal`, `LevelCompleteModal` ເກົ່າ ແລ້ວໃຫ້ "ຕາຍ/ຊະນະ" ເຂົ້າ flow `returnToVillageUseCase`. ປ່ຽນ `Lives` → `Health` (ຊື່ໃນ domain).
17. ຍ້າຍ `LevelProgress`/`CompleteLevelUseCase` → Stage (ໃຊ້ `StageProgression` ທີ່ມີຢູ່ແລ້ວ); ລຶບ Level ເກົ່າ.
18. ລຶບຂອງຕາຍ: `level-1/2/3.json`, `Spike`, `MovingPlatform`, `PowerUp` (+`CollectPowerUpUseCase`, `PowerUp` entity), `Door`, `GoalFlag`, `Projectile` (ຖ້າ Boss ບໍ່ໃຊ້), bomb/dash ໃນ `Game.ts` ຖ້າບໍ່ມີໃນ GDD; ກວດ usage ແຕ່ລະອັນດ້ວຍ grep + typecheck ກ່ອນລຶບ.
19. ເຊື່ອງ Skins ແລະ Achievements ຈາກເມນູ/HUD; ປ່ຽນ `rewardCoins` ເປັນ 0 ຫຼື ປິດ claim ເພື່ອບໍ່ໃຫ້ມີ Credit ຈາກການຂ້າສັດຕູ.
20. **Save v6**: ເພີ່ມ `CURRENT_SAVE_VERSION = 6`; ຕັດ field upgrades/inventory ເກົ່າ/stats ຄະແນນ; save ເວີຊັນເກົ່າ → ເລີ່ມໃໝ່ແບບສະອາດ (ເກັບ Credit/ປຶ້ມ/recipe/settings ຖ້າງ່າຍ); ແກ້ `SaveData.test.ts`, `ResetSaveDataUseCase`.
21. ເມນູຫຼັກ: ສືບຕໍ່ / ເກມໃໝ່ / ຕັ້ງຄ່າ. HUD: HP, Credit, ກະເປົາ, ຄຳໃບ້ເປົ້າໝາຍຖັດໄປ.
22. commit ແຍກຕາມ 16 / 17–18 / 19–20 / 21.

### Phase 5 — ແຍກໄຟລ໌ໃຫຍ່ (ຮອບ B)
23. ຍ້າຍ resource node, enemy spawn, gate, boss spawn ໃຫ້ອ່ານຈາກ `stages.json` ໃນ `Game.ts` (ລຶບ hardcode ~1401–1460) — ເພີ່ມການ validate ຮູບແບບ JSON ຕອນ Preload.
24. ແຍກ `Game.ts` ເປັນ `VillageBuilder`, `StageBuilder`, ແລະ handlers ຂອງ interaction/boss; ແຍກ `App.tsx` ເປັນ hook ຕາມຫົວຂໍ້ (`useStageEvents`, `useBackpackState`, ...). ບໍ່ປ່ຽນພຶດຕິກຳ — ກວດດ້ວຍ typecheck + e2e.

### Phase 6 — ຟີເຈີ loop ທີ່ຕັດສິນໃຈແລ້ວ (TDD, domain/application)
25. **Credit +60 ເມື່ອຊະນະ Boss ຄັ້ງທຳອິດ**: use case ໃໝ່ (ຫຼືຂະຫຍາຍ `CompleteStageUseCase`) ໃຊ້ `isFirstTimeClear`; test: ຄັ້ງທຳອິດ +60, ຄັ້ງທີ່ສອງ +0.
26. **ປຶ້ມ Ch.2 ປົດລັອກໃຫ້ຊື້ເມື່ອຊະນະ Boss**: ໃຊ້ `requiredCompletedStageId: "stage-ch1"` ໃນ `books.json` + ກວດໃນ `PurchaseBookUseCase`. (ຍັງຕ້ອງການຄຳຖາມ Ch.2 ≥ ~15 ຂໍ້ ກ່ອນເປີດໃຫ້ນັກຮຽນ — ເບິ່ງ Risks.)
27. **ສອບຊ້ຳ +5 ໄດ້ 1 ຄັ້ງ/ປຶ້ມ/ມື້**: ເກັບ `lastRewardedDate` ໃນ `BookProgress`; ວັນດຽວກັນ ສອບຊ້ຳຍັງໄດ້ ແຕ່ credit 0. ເພີ່ມໃນ snapshot (save v6).
28. **ເວລາຕ່ຳສຸດຕໍ່ໜ້າ ~5 ວິນາທີ** ໃນ `TextbookModal`: ປຸ່ມ "ໜ້າຖັດໄປ" disabled ຈົນຄົບເວລາ, ຈຶ່ງ `ReadBookPageUseCase`. ເກັບຄ່າ 5 ວິນາທີ ໃນ constant/JSON.
29. **ສອບບໍ່ຜ່ານ ສະແດງຂໍ້ຜິດ**: `AcademyModal` ສະແດງເສພາະຂໍ້ຜິດ + ຄຳຕອບຖືກ + `explain` + ປຸ່ມເປີດ `page` ຂອງປຶ້ມ (ຂໍ້ມູນມີໃນ `questions.json`); ຄຳຖາມ Boss/ປະຕູຕອບຜິດ ສະແດງ `explain` + `page` ຄືກັນ. ກວດກ່ອນວ່າໂຄດປັດຈຸບັນມີບາງສ່ວນແລ້ວບໍ.
30. **Boss reset HP ເຕັມທຸກຄັ້ງທີ່ເຂົ້າໃໝ່**: ກວດວ່າດ່ານ restart ສ້າງ Boss ໃໝ່ (ໃຊ້ `entity` ໃໝ່); ເພີ່ມ test ຖ້າມີ use case.

### Phase 7 — ເອກະສານ (ຮອບ C)
31. ອັບເດດ `CLAUDE.md`: ບໍ່ແມ່ນ "single scene" ແລ້ວ (Preloader, TitleScene, Game), `domain/`/`application/` ມີຂອງຈິງ, ຄຳສັບ Stage/Credit, ເວີຊັນ Phaser 4.
32. ອັບເດດ GDD: ລຶບໝາຍເຫດ "ຍັງບໍ່ມີໃນໂຄດ" ເມື່ອແຕ່ລະຂໍ້ສຳເລັດ; ກວດ checkbox "ລຳດັບການສ້າງ" ໃຫ້ຕົງກັບຄວາມຈິງ.
33. `CONTEXT.md`: ກວດວ່າຄຳສັບທີ່ລຶບແລ້ວ (Level, LevelProgress, GameSession ເກົ່າ) ຖືກອັບເດດ.
34. (ທາງເລືອກ) ADR: "Wallet ເກັບ Credit ເທົ່ານັ້ນ — ບໍ່ມີຫຼຽນ" ເພາະຍ້ອນກັບຍາກ, ບໍ່ຊັດເຈນຖ້າບໍ່ມີບໍລິບົດ, ແລະມີທາງເລືອກ (ສະກຸນເງິນຄູ່) ທີ່ຖືກປະຕິເສດ.

## Files ທີ່ຈະຖືກກະທົບ

**ແກ້ໄຂ:**
- `src/domain/entities/SaveData.ts`, `SaveData.test.ts` — starter items, v6, ຕັດ field.
- `src/domain/entities/Backpack.ts`(+test) — story items exempt.
- `public/data/recipes.json`, `public/data/books.json` — Repair Kit, Ch.2 gate.
- `src/application/PerformAttackUseCase.ts`(+test) — ໃຊ້ `EquipmentState`.
- `src/application/CompleteStageUseCase.ts` ຫຼື use case ໃໝ່ — Credit +60.
- `src/domain/entities/Book.ts`, `SubmitBookExamUseCase.ts` — ສອບຊ້ຳ 1 ຄັ້ງ/ມື້.
- `src/infrastructure/react/App.tsx`, `Hud.tsx`, `MainMenuModal.tsx`, `PauseMenuModal.tsx`, `TextbookModal.tsx`, `AcademyModal.tsx`, `QuizFinisherModal.tsx`, `GateRepairModal.tsx`.
- `src/infrastructure/phaser/scenes/Game.ts`, `Preloader.ts`, `TitleScene.ts`, `levelCatalog.ts`, `Level.ts`, `objects/Player.ts`, `objects/Enemy.ts`.
- `src/domain/entities/GameSession.ts`, `GameStats.ts`, `Enemy.ts`, `Achievement.ts`; `src/application/TickSessionUseCase.ts`, `SaveGameStatsUseCase.ts`, `ClaimAchievementRewardUseCase.ts`.
- `src/infrastructure/composition.ts`, `storage/*`, `SaveManager.ts`.
- `CLAUDE.md`, `CONTEXT.md`, `docs/Game Design Doc-Village Hub.md`.

**ລຶບ (ຫຼັງກວດ usage):**
- `WeaponLoadout` ແລະ `WEAPON_CATALOG` (`Weapon.ts`), `EquipWeaponUseCase`.
- `ShopModal.tsx`, `PurchaseWeapon/Item/UpgradeUseCase`, `Upgrade.ts`, `Inventory.ts`, `UseItemUseCase` (ຖ້າບໍ່ຈຳເປັນ).
- `CollectCoinUseCase`, `objects/Coin.ts`, `calculateStarRating.ts`, `GameOverModal.tsx`, `LevelCompleteModal.tsx`.
- `LevelProgress.ts`, `CompleteLevelUseCase`.
- `objects/Spike.ts`, `MovingPlatform.ts`, `PowerUp.ts`, `Door.ts`, `GoalFlag.ts`, `Projectile.ts`(ຕາມ Boss), `PowerUp` entity + `CollectPowerUpUseCase`.
- `public/assets/levels/level-1.json`, `level-2.json`, `level-3.json`.
- `dialogue/merchantDialogue.ts` (ຖ້າ Shop ຖືກລຶບ).

**ໃໝ່:**
- `src/application/...` use case ຂອງ Credit +60 (ຫຼືຂະຫຍາຍທີ່ມີ).
- Builder ໃໝ່ໃນ `src/infrastructure/phaser/` (VillageBuilder, StageBuilder) ໃນ Phase 5.

## ຄວາມສ່ຽງ / ຄຳຖາມທີ່ຍັງເປີດ (Risks / Open Questions)

**ຄຳຖາມເປີດ**
1. **ສັບດາບໃນເກມແນວໃດ?** ປຸ່ມ cycle weapon ເກົ່າໃຊ້ `WeaponLoadout`. GDD ບໍ່ໄດ້ກຳນົດ. ແນະນຳ: ວົນໄປຕາມດາບທີ່ມີໃນ backpack ແລະ equip ຜ່ານ BackpackModal; ຕ້ອງຢືນຢັນກັບເຈົ້າຂອງ.
2. Boss ໃຊ້ `Projectile` ຫຼື `PowerUp` ບໍ? ຍັງບໍ່ໄດ້ກວດ (Step 11, 18).
3. `Lives` → `Health`: ຊື່ໃນ save/event ປ່ຽນດ້ວຍບໍ, ຫຼືປ່ຽນສະເພາະ domain ແລະເກັບ alias ຊົ່ວຄາວ? ແນະນຳປ່ຽນໝົດພ້ອມ save v6.
4. ມີ e2e ໃນ `e2e/` (Playwright) — ບໍ່ໄດ້ run ໃນການກວດ; specs ຈະໄດ້ຮັບຜົນກະທົບຈາກການລຶບ UI, ຕ້ອງອັບເດດພ້ອມ.

**ຄວາມສ່ຽງ**
- ຂັ້ນ 9–11 ອາດພົບວ່າການສູ້ປັດຈຸບັນໃຊ້ຄ່າຜິດຕະຫຼອດ → ປ່ຽນ balance ຂອງ Boss (HP/damage) ທີ່ playtest ເຄີຍໃຊ້; ຕ້ອງ re-tune ຫຼັງຮວມ.
- `GameSession` ຖືກອ້າງໃນ ~26 ໄຟລ໌ (Score); ການຕັດຂະໜາດໃຫຍ່ ອາດເຮັດໃຫ້ ripple ກວ້າງ → ເຮັດເປັນຂັ້ນເລັກໆ ແລະ typecheck ທຸກຄັ້ງ.
- Save v6: ຖ້າມີນັກຮຽນທົດລອງຢູ່ແລ້ວ ຈະເສຍ progress; ຕ້ອງຢືນຢັນວ່າບໍ່ມີ (ຄຳຕອບຂອງ Q10 ໃນ grill: ບໍ່ຕ້ອງຮັກສາ).
- ຄັງຄຳຖາມ Ch.2 ມີ 5 ຂໍ້ (ຕ້ອງ ≥ ~15). Step 26 ເປີດລະບົບ gate ແຕ່ **ບໍ່ຄວນເປີດໃຫ້ນັກຮຽນຈົນກວ່າມີຄຳຖາມພໍ**.
- Boss/ຄຳຖາມສຸດທ້າຍໃຊ້ຄັງດຽວກັບສອບ → ນັກຮຽນຈຳຄຳຕອບຈາກສອບ; ບໍ່ແກ້ໃນແຜນນີ້ (ຮັບໄດ້ສຳລັບ MVP).
- ບາງ test ຈະຖືກລຶບພ້ອມຟີເຈີ; ຈຳນວນ test ຈະຫຼຸດ (ປົກກະຕິ), ຄວນລາຍງານຈຳນວນກ່ອນ/ຫຼັງ.
- ການແຍກ `Game.ts` (Phase 5) ບໍ່ມີ automated test ຕາມ ADR 0002 — ຕ້ອງອີງ typecheck + e2e + ຫຼິ້ນມື.
- ແຜນນີ້ອີງການອ່ານໂຄດ ບໍ່ແມ່ນການຫຼິ້ນຈິງ; ຂໍ້ມູນໃນຕາຕະລາງ Context ອາດຜິດໃນບາງຈຸດ ໂດຍສະເພາະຂໍ້ອາວຸດ (ຢືນຢັນທີ່ Step 4).
