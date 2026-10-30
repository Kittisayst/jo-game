# ລະບົບທັກສະ (Skills): ພຸ່ງຫຼົບ, ສະກິວກົດໃຊ້ 10 ອັນ ແລະການອັບເກຣດເຄື່ອງມື

- **Date:** 2026-10-30
- **Status:** in progress (S1 done)
- **Project:** jo-game (ພະຈົນໄພຄວາມຮູ້ / Knowledge Quest)

## ເປົ້າໝາຍ (Goal)

ເກມມີ 100 ດ່ານໃນ 10 ມິຕິ ແຕ່ຜູ້ຫຼິ້ນມີພຽງ ຍ່າງ, ໂດດ, ໂດດຝາ ແລະຟັນ (`J`) ຕັ້ງແຕ່ດ່ານ 1 ຮອດດ່ານ 100. ຖ້າບໍ່ມີທັກສະໃໝ່ ການຫຼິ້ນຈະຊ້ຳກັນ ແລະ Boss ໃນມິຕິທ້າຍໆ ອອກແບບໃຫ້ຍາກບໍ່ໄດ້. ແຜນນີ້ເພີ່ມ 3 ຢ່າງ:

1. **ທັກສະຕິດໂຕ (movement):** ພຸ່ງຫຼົບ (dash + dodge) ໃຊ້ໄດ້ຕະຫຼອດ, ແລະເພີ່ມຕາມຄວາມຄືບໜ້າ (ພຸ່ງກາງອາກາດ, ໂດດຄູ່).
2. **ສະກິວກົດໃຊ້ (active):** 1 ອັນຕໍ່ 1 ມິຕິ (10 ອັນ) ຕາມວິຊາຂອງມິຕິ. ປົດລັອກດ້ວຍ**ການສອບຜ່ານຕຳລາຂອງມິຕິ**, ໃສ່ໄດ້ 2 ຊ່ອງ, ໃຊ້ cooldown.
3. **ການອັບເກຣດເຄື່ອງມື:** ຕັດໄມ້/ຂຸດໄວຂຶ້ນ ບໍ່ແມ່ນທັກສະ ແຕ່ເປັນລະດັບ +1..+3 ຂອງຂວານ/ຈົກ/ຄ້ອນ ທີ່ Workshop (ໃຊ້ວັດຖຸດິບ ບໍ່ໃຊ້ Credit).

ກົດຫຼັກຂອງເກມຍັງຢູ່: **Credit ມາຈາກການຮຽນເທົ່ານັ້ນ, ວັດຖຸດິບມາຈາກການສຳຫຼວດ**. ທັກສະບໍ່ໃຫ້ Credit ແລະບໍ່ສ້າງວັດຖຸດິບ.

## Context ປັດຈຸບັນ

ຈາກການອ່ານ code (branch `main`, commit `aca5a79`):

- **ການຄວບຄຸມ** (`Game.ts` ແຖວ 331–343, `useGlobalShortcuts.ts`): `A/D` ຍ່າງ, `W/Space` ໂດດ, `J`/`Z` ຟັນ, `E` ໃຊ້ສິ່ງຂອງ, `Q` ປ່ຽນດາບ, `R` ດື່ມຢາ, `I` ກະເປົາ, `M` ສຽງ, `B` ເພງ, `Esc/P` ຢຸດ, `F2` debug. **ປຸ່ມ `Shift`, `K`, `L` ຍັງຫວ່າງ.**
- **ການເຄື່ອນໄຫວ** (`Player.ts`, 588 ແຖວ): ມີ coyote time, jump buffer, ສະໄລຝາ ແລະໂດດຝາແລ້ວ. ບໍ່ມີ dash ຫຼືໂດດຄູ່. `isInvincible` ໃຊ້ຫຼັງຖືກຕີ (ກະພິບ 1.4 ວິ, `triggerDamage`). `speedMultiplier` ມາຈາກຢາ ແລະເກີບ.
- **ຮູບຕົວລະຄອນ** (`player-animations.json`): 8 ແຖວ `idle run air attack tool wall hurt faint`, ສ້າງດ້ວຍ `tools/art/build_player.py`. ບໍ່ມີແຖວ dash ຫຼືທ່າໃຊ້ສະກິວ.
- **ການຕໍ່ສູ້** (`CombatController.ts`, `PerformAttackUseCase.ts`): ຟັນ 1 ແບບ, ມີ cooldown (`AttackCooldown`), ດາບສວມໃສ່ຕາມ Durability, ຢາແຮງເພີ່ມຄວາມເສຍຫາຍ (`ActiveEffects`).
- **ສັດຕູ** (`enemies.json`): ທຳມະດາ (ສໄລມ໌, golem), Mini-boss ມີທ່າ `charge` (ພຸ່ງຕຳ ແລ້ວມຶນ `stunMs`) ແລະ `rock-throw` (ຍິງ `enemyProjectiles`), Boss ມີ phases ໃນ `Boss.ts`. ຍັງບໍ່ມີສັດຕູບິນ ຫຼືມີໂລ່.
- **ການອັບເກຣດ** (`recipes.json` + `UpgradeWeaponTierUseCase`): ດາບມີ +1..+3 (`targetWeaponId`, `bonusDamage`) ເກັບໃນ `EquipmentState.upgradeLevels`. ເຄື່ອງມືຍັງບໍ່ມີ.
- **ການເກັບ** (`ResourceNode.strike(weight)`): ນັບ Strike ເປັນ weight ໄດ້ຢູ່ແລ້ວ (ເຄື່ອງມືພັງ = 0.5). ການອັບເກຣດເຄື່ອງມືຈຶ່ງໃຊ້ weight 1.5 / 2 ໄດ້ໂດຍບໍ່ປ່ຽນກົດ.
- **ມິຕິ** (`realms.json`): 1 ພື້ນຖານຄອມພິວເຕີ, 2 ເຄືອຂ່າຍ, 3 ລະບົບປະຕິບັດການ, 4 ອອບຟິດ, 5 ຄວາມປອດໄພໄຊເບີ, 6 ຖານຂໍ້ມູນ, 7 ຂຽນໂປຣແກຣມ, 8 ເວັບ, 9 AI ແລະຂໍ້ມູນ, 10 ສະຫຼຸບ. ມີຕຳລາແຕ່ 2 ມິຕິທຳອິດ.
- **ມືຖື** (`VirtualTouchControls.tsx`): ປຸ່ມ ຊ້າຍ/ຂວາ/ໂດດ/ຟັນ/E/Q ສົ່ງ `virtual-*` ຜ່ານ `EventBus`.
- **Save** (`SaveData.ts`, version 7): ເພີ່ມ field ແບບ additive ໄດ້ (ຄື `garden`, `crafting`) ໂດຍບໍ່ຕ້ອງເພີ່ມ version.

## ການວິເຄາະ: 100 ດ່ານຕ້ອງການຫຍັງ

| ຊ່ວງ | ສິ່ງທີ່ຜູ້ຫຼິ້ນພົບ | ທັກສະທີ່ຕ້ອງມີ |
|------|-----------------|---------------|
| ມິຕິ 1 (ດ່ານ 1–10) | ຮຽນການຫຼິ້ນ, ສໄລມ໌, Mini-boss ພຸ່ງຕຳ ແລະຍິງຫີນ | **ພຸ່ງຫຼົບ** (ຫຼົບການພຸ່ງຕຳ), ສະກິວ 1 ອັນໂຈມຕີໄກ |
| ມິຕິ 2–3 (11–30) | ຖ້ຳ, ກຸ່ມສັດຕູ, ຊ່ອງວ່າງກວ້າງ | **ພຸ່ງກາງອາກາດ** (ຂ້າມຊ່ອງ), ສະກິວຄວບຄຸມກຸ່ມ (ມຶນ) |
| ມິຕິ 4–6 (31–60) | ສັດຕູຍິງໄກຫຼາຍ, ພື້ນທີ່ສູງ | **ໂດດຄູ່**, ສະກິວປ້ອງກັນ (ກັນລູກປືນ) |
| ມິຕິ 7–9 (61–90) | ສັດຕູບິນ, ມີໂລ່, Boss ຫຼາຍ phase | ສະກິວຫຼາຍທ່າ (ຊ່ວຍຍິງ, ໂຈມຕີຊ້ຳ, ເຄື່ອນທີ່ໄວ) |
| ມິຕິ 10 (91–100) | ທົບທວນ ທຸກແບບລວມກັນ | ໃຊ້ທຸກຢ່າງ + ສະກິວໃຫຍ່ (ultimate) |

ຂໍ້ສະຫຼຸບ:

- **ທັກສະຕ້ອງມາເປັນຂັ້ນ:** ໃຫ້ທຸກຢ່າງຕັ້ງແຕ່ຕົ້ນ ດ່ານ 1–30 ຈະງ່າຍເກີນ; ບໍ່ມີທັກສະໃໝ່ ດ່ານ 60–100 ຈະໜ້າເບື່ອ.
- **ປົດລັອກດ້ວຍການຮຽນ:** ສອບຜ່ານຕຳລາມິຕິ N ແລ້ວໄດ້ສະກິວຂອງມິຕິ N. ເຊື່ອມທັກສະເຂົ້າກັບການຮຽນ ເຊິ່ງແມ່ນຫົວໃຈຂອງເກມ, ແລະບໍ່ຕ້ອງມີເງິນຊະນິດໃໝ່ (ບໍ່ມີ skill points).
- **ໃສ່ໄດ້ 2 ຊ່ອງ:** 10 ສະກິວແຕ່ໃສ່ພ້ອມກັນ 2 ເຮັດໃຫ້ຜູ້ຫຼິ້ນເລືອກຕາມດ່ານ, ແລະປຸ່ມມືຖືບໍ່ລົ້ນ.
- **cooldown ບໍ່ໃຊ້ mana:** ເດັກເຂົ້າໃຈງ່າຍ ແລະບໍ່ຕ້ອງມີແຖບພະລັງອີກອັນ.
- **ສັດຕູຕ້ອງຮອງຮັບ:** ສະກິວມຶນ/ກັນລູກປືນມີຄ່າກໍຕໍ່ເມື່ອມີສັດຕູທີ່ຕ້ອງໃຊ້ມັນ. ສັດຕູ "ມຶນ" ຕ້ອງເປັນສະຖານະທົ່ວໄປ (ດຽວນີ້ມີແຕ່ທ່າ `charge` ຂອງ Mini-boss).
- **ການອອກແບບດ່ານໃຊ້ທັກສະເປັນປະຕູ:** ຊ່ອງທີ່ຕ້ອງພຸ່ງກາງອາກາດ ຫຼືໂດດຄູ່ຈຶ່ງໄປໄດ້ ເປີດພື້ນທີ່ລັບ ຫຼືທາງລັດໃນດ່ານເກົ່າ (ຊວນກັບມາຫຼິ້ນຄືນ).

## ແນວທາງ (Approach)

### 1. ທັກສະຕິດໂຕ (movement)

| ທັກສະ | ໄດ້ຕອນໃດ | ເຮັດຫຍັງ | ຄ່າເລີ່ມ (ໃນ JSON) |
|------|---------|---------|------------------|
| ພຸ່ງຫຼົບ (Dash) | ຕັ້ງແຕ່ເລີ່ມ (ມີຄຳແນະນຳໃນ tutorial ດ່ານ 1) | ພຸ່ງໄປໜ້າໄວ, ບໍ່ຖືກຕີລະຫວ່າງພຸ່ງ (ຜ່ານສັດຕູ ແລະລູກປືນ) | ໄລຍະ ~120 px, 160 ms, ບໍ່ຖືກຕີ 200 ms, cooldown 800 ms |
| ພຸ່ງກາງອາກາດ (Air dash) | ຊະນະ Boss ດ່ານ 10 | ພຸ່ງໄດ້ 1 ເທື່ອກ່ອນແຕະພື້ນ | 1 ເທື່ອ/ການໂດດ |
| ໂດດຄູ່ (Double jump) | ຊະນະ Boss ດ່ານ 30 | ໂດດຄັ້ງທີ 2 ກາງອາກາດ | ແຮງ 85% |

- ປຸ່ມ: **`Shift`** (ຫຼື `L` ຖ້າບໍ່ມີ Shift ສະດວກ), ພຸ່ງໄປທາງທີ່ຫັນໜ້າ ຫຼືທາງທີ່ກົດຢູ່. ມືຖື: ປຸ່ມ "ພຸ່ງ" ໃໝ່.
- ການເຄື່ອນໄຫວຢູ່ໃນ `Player.dash()` (ຄືການໂດດຝາ). ກົດ cooldown ແລະ "ໄດ້ທັກສະແລ້ວບໍ" ຢູ່ໃນ domain.
- ຮູບ: ເລີ່ມດ້ວຍເງົາຕາມຫຼັງ (afterimage) ຈາກ frame ປະຈຸບັນ; ແຖວ `dash` ໃນ sheet ເພີ່ມທີຫຼັງ (ຕ້ອງແກ້ `build_player.py` ແລະ 4 skin).

### 2. ສະກິວກົດໃຊ້ 10 ອັນ (1 ອັນຕໍ່ມິຕິ, ຕາມວິຊາ)

| ມິຕິ | ສະກິວ | ຜົນ | ເຊື່ອມກັບບົດຮຽນ |
|-----|------|-----|---------------|
| 1 ພື້ນຖານຄອມ | **ຄື້ນພະລັງ (Power Wave)** | ຍິງຄື້ນດາບໄປໄກ ທະລຸສັດຕູ 1 ໂຕ | Input → Process → Output |
| 2 ເຄືອຂ່າຍ | **Ping** | ສາຍຟ້າກະໂດດລະຫວ່າງສັດຕູໃກ້ກັນ 3 ໂຕ (ເຊື່ອມຄືເຄືອຂ່າຍ), ມຶນສັ້ນໆ | packet ສົ່ງຕໍ່ຈາກເຄື່ອງສູ່ເຄື່ອງ |
| 3 ລະບົບປະຕິບັດການ | **End Task** | ສັດຕູທຸກໂຕໃນວົງມຶນ 2 ວິ | Task Manager ຢຸດ process |
| 4 ອອບຟິດ | **Copy–Paste** | ສ້າງຕົວແທນ (decoy) ໃຫ້ສັດຕູໄລ່ 4 ວິ | ສຳເນົາ ແລະວາງ |
| 5 ຄວາມປອດໄພ | **Firewall** | ໂລ່ກັນລູກປືນ ແລະການຕີ 2 ເທື່ອ, 5 ວິ | Firewall ກັ່ນຕອງສິ່ງອັນຕະລາຍ |
| 6 ຖານຂໍ້ມູນ | **Query** | ດຶງຂອງທີ່ຕົກ (drops) ໃນວົງມາຫາຕົວ | SELECT ຂໍ້ມູນທີ່ຕ້ອງການ |
| 7 ຂຽນໂປຣແກຣມ | **Loop** | ຟັນຊ້ຳອັດຕະໂນມັດ 3 ເທື່ອໄວໆ | ຄຳສັ່ງວົນຊ້ຳ |
| 8 ເວັບ | **Hyperlink** | ວາບໄປຂ້າງໜ້າ (teleport) ຜ່ານກຳແພງບາງ | ລິ້ງໄປອີກໜ້າ |
| 9 AI | **AI Drone** | ໂດຣນຊ່ວຍຍິງສັດຕູໃກ້ສຸດ 8 ວິ | ລະບົບອັດຕະໂນມັດ |
| 10 ສະຫຼຸບ | **Compile** | ລະເບີດໃຫຍ່ທົ່ວຈໍ (ultimate), cooldown ຍາວ | ລວມທຸກຢ່າງເຂົ້າກັນ |

- **ປົດລັອກ:** ສອບຜ່ານຕຳລາຂອງມິຕິນັ້ນ (`SubmitBookExamUseCase` → `unlockSkillsForBook`). ມິຕິ 3–10 ຍັງບໍ່ມີຕຳລາ ສະກິວຂອງມັນຈຶ່ງມາພ້ອມເນື້ອຫາຂອງມິຕິ (`content-guide.md`).
- **ໃສ່ 2 ຊ່ອງ:** ປຸ່ມ **`K`** ແລະ **`L`** (ມືຖື: 2 ປຸ່ມມົນຂ້າງປຸ່ມຟັນ). ເລືອກໃສ່ໃນແຖບ "ທັກສະ" ຂອງສະຖາບັນ (ແລະກົດໄດ້ຈາກກະເປົ໋າ `I`).
- **ລະດັບ 1–3:** ອັບເກຣດທີ່ສະຖາບັນດ້ວຍ Credit + ວັດຖຸດິບ (ເຊັ່ນ ເສດປະຕູ) ເພື່ອເພີ່ມຜົນ ຫຼືຫຼຸດ cooldown. Credit ຖືກໃຊ້ (ໄດ້ຈາກການຮຽນ), ບໍ່ໄດ້ສ້າງ.
- **ຂໍ້ມູນ:** `public/data/skills.json` (id, realm, kind, ປຸ່ມ, cooldown, ຄ່າແຕ່ລະລະດັບ, ລາຄາອັບເກຣດ, ຄຳອະທິບາຍ + ແນວຄິດທີ່ເຊື່ອມບົດຮຽນ, icon). ຕົວເລກສົມດຸນຢູ່ໃນ JSON ບໍ່ແມ່ນໃນ scene.
- **ຂອບເຂດ Boss:** ຜົນມຶນ ແລະດຶງ ໃຊ້ກັບ Boss ບໍ່ໄດ້ ຫຼືໄດ້ແຕ່ເຄິ່ງ (`bossResist` ໃນ JSON) ເພື່ອບໍ່ໃຫ້ Boss ງ່າຍເກີນ.

### 3. ການອັບເກຣດເຄື່ອງມື (ແທນທັກສະຕັດໄມ້ໄວ)

- Workshop ມີແຖບ "ອັບເກຣດເຄື່ອງມື": ຂວານ/ຈົກ/ຄ້ອນ +1..+3. ລາຄາເປັນ**ວັດຖຸດິບເທົ່ານັ້ນ** (ໄມ້, ແຮ່ເຫຼັກ, ແຮ່ຟ້າ…).
- ຜົນ: ນ້ຳໜັກ Strike 1 → 1.25 → 1.5 → 2 (ໃຊ້ `ResourceNode.strike(weight)` ທີ່ມີຢູ່ແລ້ວ: +3 ຕັດຕົ້ນໄມ້ 2 ເທື່ອແທນ 3), ແລະ Durability ສູງສຸດເພີ່ມ.
- ຂໍ້ມູນໃນ `recipes.json` ຄືການອັບເກຣດດາບ ແຕ່ໃຊ້ `targetToolId` + `strikeBonus`. ລະດັບເກັບໃນ `EquipmentState.upgradeLevels` (key = item id, ມີຢູ່ແລ້ວ).
- ໃຊ້ເວລາສ້າງ (`craftSeconds`) ແລະຊ່າງໜ້າໂຮງຄືການສ້າງອື່ນ.

### ສະຖາປັດຕະຍະກຳ (ຕາມ Clean Architecture ຂອງໂປຣເຈັກ)

- **domain:** `SkillDefinition` (ຂໍ້ມູນ), `SkillProgression` (ປົດລັອກ, ລະດັບ, 2 ຊ່ອງ), `SkillCooldowns` (ນັບເວລາ, ບໍ່ save), `MovementAbilities` (dash/air dash/double jump ໄດ້ແລ້ວບໍ).
- **application:** `unlockSkillsForBookUseCase`, `equipSkillUseCase`, `upgradeSkillUseCase`, `useSkillUseCase` (ກວດ cooldown + ຄືນຄ່າຜົນ), `dashUseCase`, `upgradeToolUseCase`. ແຕ່ລະອັນມີ `.test.ts`.
- **infrastructure:** `SkillController` (Phaser: ຄື້ນ, ສາຍຟ້າ, ໂລ່, ໂດຣນ… ຕາມ id), `Player.dash()`, ສະຖານະ "ມຶນ" ທົ່ວໄປໃນ `Enemy`, ແຖບສະກິວໃນ HUD (cooldown ເປັນວົງ), ແຖບ "ທັກສະ" ໃນ `AcademyModal`, ປຸ່ມມືຖື.
- **save:** `skills: { unlocked, ranks, equipped }` ແລະ `movement: [...]`, ເພີ່ມແບບ additive.

## ຂັ້ນຕອນ (Steps)

ແບ່ງເປັນ Phase ໃຫ້ແຕ່ລະອັນເປັນ PR ດຽວ ຫຼິ້ນໄດ້ ແລະທົດສອບໄດ້:

**Phase S1: ພຸ່ງຫຼົບ** ✅ (branch `feat/dash-dodge`)

> ສະຖານະ: ເຮັດແລ້ວ. ຄ່າໃນ `skills.json` (`movement.dash`): ໄວ 640, 170 ms, ຫຼົບ 220 ms, cooldown 800 ms (ໄລຍະປະມານ 110 px). ປຸ່ມ Shift + ປຸ່ມມືຖື, ຂັ້ນສອນຫຼັງ "ຕີສະໄລມ໌", `MovementAbilities` save ເປັນ `movement`. ໜາມກໍ່ຫຼົບໄດ້ (ບໍ່ສະເພາະສັດຕູ). ຍັງບໍ່ໄດ້ເຮັດ: e2e ຫຼົບລູກຫີນ Mini-boss ດ່ານ 5 (ກວດແຕ່ການພຸ່ງຜ່ານສະໄລມ໌), ແຖວ dash ໃນ sheet (ໃຊ້ເງົາຕາມຫຼັງແທນ), ຕົວບອກ cooldown ໃນ HUD.
1. `MovementAbilities` + `DashCooldown` ໃນ domain, `dashUseCase` + test.
2. `Player.dash(dir)`: ຄວາມໄວພຸ່ງ, ປິດແຮງໂນ້ມຖ່ວງຊົ່ວຄາວ, `isDodging` (ບໍ່ຖືກຕີຈາກສັດຕູ ແລະລູກປືນ), ເງົາຕາມຫຼັງ.
3. ປຸ່ມ `Shift`, ປຸ່ມມືຖື "ພຸ່ງ", ຂັ້ນຄຳແນະນຳໃນ `tutorial.json`.
4. e2e: ພຸ່ງຜ່ານລູກຫີນຂອງ Mini-boss ດ່ານ 5 ບໍ່ເສຍຫົວໃຈ.

**Phase S2: ໂຄງສ້າງສະກິວ + ສະກິວມິຕິ 1**
1. `skills.json` + parser ໃນ `ContentCatalog` + `ContentIntegrity` test (ທຸກມິຕິທີ່ມີຕຳລາມີສະກິວ, icon ຢູ່ໃນ manifest).
2. `SkillProgression`, `SkillCooldowns`, use cases + test, save `skills`.
3. ປົດລັອກເມື່ອສອບຕຳລາຜ່ານ (ຂໍ້ຄວາມ "ໄດ້ສະກິວໃໝ່!" ໃນໜ້າຜົນສອບ).
4. ແຖບ "ທັກສະ" ໃນສະຖາບັນ (ເບິ່ງ, ໃສ່ຊ່ອງ), ແຖບສະກິວ + cooldown ໃນ HUD, ປຸ່ມ `K`/`L` + ມືຖື.
5. `SkillController` + **ຄື້ນພະລັງ** (Power Wave).
6. e2e: ສອບຕຳລາ 1 → ໄດ້ສະກິວ → ໃສ່ຊ່ອງ K → ຍິງໂດນສັດຕູ → cooldown.

**Phase S3: ສັດຕູມຶນ + ສະກິວມິຕິ 2 (Ping)**
1. ສະຖານະ "ມຶນ" ທົ່ວໄປໃນ `Enemy` (ໃຊ້ຮ່ວມກັບທ່າ charge), `bossResist`.
2. Ping: ຫາສັດຕູໃກ້ສຸດ ແລ້ວກະໂດດຕໍ່ 3 ໂຕ, ມຶນ.

**Phase S4: ອັບເກຣດເຄື່ອງມື**
1. `upgradeToolUseCase` + test, `strikeBonus` ໃນ `harvestResourceNodeUseCase`.
2. ແຖບອັບເກຣດໃນ Workshop, ຂໍ້ມູນ +1..+3 ສຳລັບ T1 ແລະ T2 ໃນ `recipes.json`.
3. e2e: ຂວານ +3 ຕັດຕົ້ນໄມ້ 2 ເທື່ອ.

**Phase S5: ລະດັບສະກິວ + ພຸ່ງກາງອາກາດ**
1. `upgradeSkillUseCase` (Credit + ວັດຖຸດິບ), ປຸ່ມອັບເກຣດໃນແຖບທັກສະ.
2. Air dash ປົດລັອກຫຼັງ Boss ດ່ານ 10. ເພີ່ມຊ່ອງວ່າງທີ່ຕ້ອງພຸ່ງກາງອາກາດໃນດ່ານ 11–20 ບາງດ່ານ (ທາງລັບ).

**Phase S6+: ພ້ອມເນື້ອຫາມິຕິ 3–10**
- ແຕ່ລະມິຕິທີ່ສ້າງຕາມ `content-guide.md` ເພີ່ມ: ສະກິວຂອງມັນ (ໃນ `skills.json` + effect ໃນ `SkillController`), ແລະສັດຕູທີ່ຊວນໃຫ້ໃຊ້ມັນ (ຍິງໄກສຳລັບ Firewall, ບິນສຳລັບ Drone…). ໂດດຄູ່ຫຼັງ Boss ດ່ານ 30.
- ເພີ່ມຂັ້ນ "ສະກິວ" ໃສ່ `content-guide.md`.

## Files ທີ່ຈະຖືກກະທົບ

- `public/data/skills.json` (ໃໝ່): ສະກິວ 10 ອັນ ແລະທັກສະເຄື່ອນທີ່.
- `public/data/recipes.json`: ການອັບເກຣດເຄື່ອງມື +1..+3.
- `public/data/tutorial.json`: ຂັ້ນສອນພຸ່ງ.
- `src/domain/entities/SkillProgression.ts`, `SkillCooldowns.ts`, `MovementAbilities.ts` (ໃໝ່) + test.
- `src/domain/entities/SaveData.ts`, `GameState.ts`: save `skills`, `movement`.
- `src/application/SkillUseCases.ts`, `DashUseCase.ts`, `UpgradeToolUseCase.ts` (ໃໝ່) + test; `SubmitBookExamUseCase.ts` (ປົດລັອກສະກິວ); `HarvestResourceNodeUseCase.ts` (`strikeBonus`).
- `src/infrastructure/content/ContentCatalog.ts`: parser `skills.json`, `targetToolId`.
- `src/infrastructure/phaser/objects/Player.ts`: `dash()`, air dash, ໂດດຄູ່, `isDodging`.
- `src/infrastructure/phaser/objects/Enemy.ts`, `Boss.ts`: ສະຖານະມຶນ, `bossResist`.
- `src/infrastructure/phaser/controllers/SkillController.ts` (ໃໝ່), `CombatController.ts` (ລູກປືນບໍ່ໂດນຕອນຫຼົບ / Firewall).
- `src/infrastructure/phaser/scenes/Game.ts`: ປຸ່ມ Shift/K/L, tick cooldown.
- `src/infrastructure/react/components/AcademyModal.tsx` (ແຖບທັກສະ), `Hud.tsx` (ແຖບສະກິວ), `VirtualTouchControls.tsx` (ປຸ່ມພຸ່ງ + 2 ສະກິວ), `WorkshopModal.tsx` (ແຖບອັບເກຣດເຄື່ອງມື).
- `tools/art/build_skill_icons.py` (ໃໝ່) + `docs/asset-manifest.json`; ພາຍຫຼັງ `tools/art/build_player.py` (ແຖວ dash).
- `e2e/dash.spec.ts`, `e2e/skills.spec.ts`, `e2e/tool_upgrades.spec.ts` (ໃໝ່).
- `CONTEXT.md` (ຄຳສັບ: Skill, Skill slot, Movement ability, Dodge, Tool upgrade), `CLAUDE.md`, `docs/how-to-play.md`, `docs/content-guide.md`.

## ຄວາມສ່ຽງ / ຄຳຖາມທີ່ຍັງເປີດ (Risks / Open Questions)

**ຄຳຖາມທີ່ຕ້ອງຕັດສິນ (ມີຄຳແນະນຳ):**
1. **ປົດລັອກສະກິວແນວໃດ?** ແນະນຳ: ສອບຜ່ານຕຳລາຂອງມິຕິ. ທາງເລືອກ: ຊະນະ Boss ຂອງມິຕິ, ຫຼືຊື້ດ້ວຍ Credit ທີ່ສະຖາບັນ.
2. **cooldown ຫຼືແຖບພະລັງ (mana)?** ແນະນຳ: cooldown ຢ່າງດຽວ.
3. **ຈຳນວນຊ່ອງ ແລະປຸ່ມ?** ແນະນຳ: 2 ຊ່ອງ `K`/`L`, ພຸ່ງ `Shift`.
4. **ພຸ່ງໄດ້ຕັ້ງແຕ່ດ່ານ 1 ບໍ?** ແນະນຳ: ໄດ້, ເພາະ Mini-boss ດ່ານ 5 ມີທ່າພຸ່ງຕຳທີ່ຄວນຫຼົບໄດ້.
5. **ອັບເກຣດເຄື່ອງມືໃຊ້ Credit ນຳບໍ?** ແນະນຳ: ບໍ່, ວັດຖຸດິບຢ່າງດຽວ (ຄືການສ້ອມແປງ).

**ຄວາມສ່ຽງ:**
- **ສະກິວເຮັດໃຫ້ Boss ງ່າຍ:** ຕ້ອງມີ `bossResist` ແລະຫຼິ້ນທົດສອບທຸກ Boss ໃໝ່; Boss ມິຕິ 1–2 ຈາກ bot ງ່າຍຢູ່ແລ້ວ.
- **ເດັກສັບສົນ:** ສະກິວ 10 ອັນ + ປຸ່ມເພີ່ມ 3 ປຸ່ມ. ແກ້ດ້ວຍການໃຫ້ມາເທື່ອລະອັນຕາມມິຕິ ແລະມີຄຳແນະນຳຕອນໄດ້ສະກິວໃໝ່.
- **ປຸ່ມມືຖືລົ້ນຈໍ:** ຈາກ 6 ເປັນ 9 ປຸ່ມ; ຕ້ອງທົດສອບ `mobile.spec.ts` ແລະຈັດວາງໃໝ່.
- **ຮູບ:** ບໍ່ມີທ່າ dash/ໃຊ້ສະກິວໃນ sheet. ເລີ່ມດ້ວຍ effect + ເງົາ, ຮູບແທ້ເປັນວຽກ art ແຍກ.
- **ສັດຕູບໍ່ພໍໃຫ້ສະກິວມີຄ່າ:** ສັດຕູບິນ/ມີໂລ່/ຍິງໄກ ຍັງບໍ່ມີ; ຕ້ອງອອກແບບພ້ອມມິຕິ 5–9 ບໍ່ດັ່ງນັ້ນສະກິວຈະບໍ່ມີຄວາມໝາຍ.
- **ການຫຼົບ (i-frames) ກັບ physics:** ພຸ່ງໄວອາດທະລຸພື້ນບາງໃນ frame rate ຕ່ຳ (ມີບັນຫາຄ້າຍກັນທີ່ ~17 fps); ຕ້ອງຈຳກັດຄວາມໄວ ແລະທົດສອບ.
- **ລາຍລະອຽດຂອງສະກິວມິຕິ 3–10 ອາດປ່ຽນ** ຕາມເນື້ອຫາ ແລະສັດຕູທີ່ສ້າງຈິງ; ຕາຕະລາງຂ້າງເທິງເປັນຮ່າງ.
