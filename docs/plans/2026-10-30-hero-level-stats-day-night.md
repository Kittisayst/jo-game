# Hero Level (1–150), XP ຈາກ monster, ແຕ້ມ stat, ກາງວັນ/ກາງຄືນ, monster ກາງຄືນ ແລະຕຽງນອນ

- **Date:** 2026-10-30
- **Status:** in progress (L1 and L2 done)
- **Project:** jo-game (Knowledge Quest)

## ເປົ້າໝາຍ (Goal)

ເພີ່ມເປົ້າໝາຍໃຫ້ການສູ້ ແລະການສຳຫຼວດ ໂດຍບໍ່ທຳລາຍກົດຫຼັກຂອງເກມ (ພະລັງ ແລະ Credit ມາຈາກການຮຽນ):

1. **Hero Level 1–150:** ຂ້າ monster ໄດ້ XP, XP ຄົບແລ້ວຂຶ້ນ level.
2. **ແຕ້ມ stat:** ທຸກ level ໄດ້ 1 ແຕ້ມ, ຜູ້ຫຼິ້ນແຈກເອງໃສ່ ໂຈມຕີ / ຫົວໃຈ / ປ້ອງກັນ / ຄວາມໄວ, ຣີເຊັດໄດ້ດ້ວຍວັດຖຸດິບ. ເປັນ **ການເສີມເລັກນ້ອຍ**: ອຸປະກອນຈາກຕຳລາບົດຍັງເປັນພະລັງຫຼັກ.
3. **ກາງວັນ/ກາງຄືນ:** ເວລາເກມ 1 ມື້ = 20 ນາທີຫຼິ້ນ (ກາງວັນ 14, ກາງຄືນ 6), ເດີນແຕ່ຕອນຫຼິ້ນ, ຖືກບັນທຶກ. ມືດທັງໝູ່ບ້ານ ແລະດ່ານ.
4. **Monster ກາງຄືນ:** ອອກມາໃນດ່ານຕອນກາງຄືນເທົ່ານັ້ນ, ແຂງແກ່ງກວ່າ ແລະໃຫ້ XP ຫຼາຍກວ່າ, ຫາຍໄປເມື່ອເຊົ້າ. ບໍ່ມີໃນດ່ານ 1 (ດ່ານສອນ) ແລະໃນເດີ່ນ Boss.
5. **ຕຽງນອນໃນໝູ່ບ້ານ:** ກົດ E ຕອນກາງຄືນ, ຂ້າມໄປເຊົ້າ, ວຽກສ້າງຂອງເດີນໜ້າຕາມເວລາທີ່ຂ້າມ, ເຕີມຫົວໃຈ ແລະບັນທຶກເກມ.

(ຜູ້ໃຊ້ເລືອກທັງ 4 ຂໍ້: ແຈກແຕ້ມເອງ, ເສີມເລັກນ້ອຍ, ເວລາເກມ 20 ນາທີ, ຕຽງໃນໝູ່ບ້ານ.)

## Context ປັດຈຸບັນ (ຈາກການອ່ານໂຄ້ດ)

- **ຫົວໃຈ:** `Health` (domain) ມີ 3 ຫົວໃຈ, `_max` ເປັນ readonly. `takeDamage()` ບໍ່ຮັບຈຳນວນ: **ທຸກການຕີເສຍ 1 ຫົວໃຈສະເໝີ** (Armor hearts ເສຍກ່ອນ). `GameState.health = new Health()` ສ້າງເທື່ອດຽວ ແລະໂຫຼດແບບ in place.
- **`damage` ຂອງ monster ບໍ່ຖືກໃຊ້:** `enemies.json` ມີ `damage` ແລະ `scaleEnemyDefinition` ບວກ `enemyDamagePerRealm` ໃສ່, ແຕ່ບໍ່ມີບ່ອນໃດອ່ານມັນເພື່ອຫັກເລືອດ. ດັ່ງນັ້ນ stat "ປ້ອງກັນ" ທີ່ຫຼຸດ damage ຈະບໍ່ມີຜົນ: ຕ້ອງອອກແບບໃໝ່ (ເບິ່ງ L2).
- **ດາເມດຂອງຜູ້ຫຼິ້ນ:** `performAttackUseCase` = ດາເມດດາບ × wear × `effects.damageMultiplier` (ຢາແຮງ). ສະກິວ wave/chain/area ຄິດຈາກດາເມດດາບ.
- **ການຂ້າ monster:** `CombatController.onEnemyDefeated` (ດາບ) ແຈ້ງ tutorial ແລະ drop. `SkillController` ມີທາງຂ້າຂອງມັນເອງ: XP ຕ້ອງໄດ້ທຸກທາງ (ດາບ, wave, chain, area).
- **ຄວາມແຮງຂອງ monster ຕາມດ່ານ:** `scaling` ໃນ `stages.json` (`enemyHpPerStage 0.08`, …) ແລະ `StageScaling.ts`. Boss/Mini-boss ບໍ່ scale.
- **ເວລາ:** ມີສອງແບບຢູ່ແລ້ວ. ວຽກສ້າງຂອງ (`CraftingQueue`) ນັບເວລາເກມ, ຖືກ tick ໃນ `Game.update`. ພືດ/ສວນໃຊ້ `Clock` (ເວລາຈິງ). Cooldown ສະກິວ ແລະ dash ກໍ່ tick ໃນ `Game.update`.
- **ຄວາມໄວ:** `Game.update` ຕັ້ງ `player.speedMultiplier` ຈາກຢາ ແລະເກີບທຸກ frame.
- **ໝູ່ບ້ານ:** ຈຸດ E ຢູ່ x = 120 (ປ້າຍ), 235 (ຫີບ), 320, 600, 880, 1010 (ສວນ), Forge, 1290–1295 (Mina), 1420 (ປະຕູໂລກ). ຕຽງຕ້ອງການບ່ອນວ່າງ.
- **Save:** `CURRENT_SAVE_VERSION = 7`; ຊ່ອງໃໝ່ທີ່ຜ່ານມາ (`skills`, `movement`, `toolUpgrades`, `crafting`) ເພີ່ມແບບ additive ໂດຍບໍ່ bump version.
- **ຊື່ຄຳສັບ:** `CONTEXT.md` ຫ້າມໃຊ້ຄຳວ່າ *level* ສຳລັບດ່ານ, ແລະ `Level.ts` ໃນໂຄ້ດແມ່ນ layout ຂອງດ່ານ. ຖ້າເອີ້ນລະບົບໃໝ່ວ່າ "Level" ລ້າໆ ຈະສັບສົນ.

## ແນວທາງ (Approach)

### ຄຳສັບໃໝ່ (ໃສ່ CONTEXT.md ກ່ອນຂຽນໂຄ້ດ)

- **Hero Level** (ລະດັບຜູ້ກ້າ, 1–150): ຄວາມຄືບໜ້າຂອງຕົວລະຄອນ. ໂຄ້ດໃຊ້ `HeroLevel`, ບໍ່ໃຊ້ `Level` ລ້າໆ (ຊື່ນັ້ນເປັນຂອງ layout ດ່ານ).
- **XP:** ໄດ້ຈາກການຂ້າ monster ເທົ່ານັ້ນ, **ບໍ່ແມ່ນ Credit, ປ່ຽນເປັນ Credit ບໍ່ໄດ້ ແລະບໍ່ຊື້ຫຍັງ**.
- **Stat point / Stat:** ແຕ້ມທີ່ໄດ້ທຸກ level; Stat 4 ຢ່າງ: Attack, Hearts, Guard, Agility.
- **Day, Night, Dawn:** ເວລາຂອງໂລກ (World time), ເດີນແຕ່ຕອນຫຼິ້ນ.
- **Night creature:** monster ທີ່ອອກແຕ່ກາງຄືນໃນດ່ານ ແລະຫາຍຕອນເຊົ້າ.
- **Bed:** ຈຸດນອນໃນໝູ່ບ້ານ: ຂ້າມກາງຄືນໄປເຊົ້າ.

### ຂໍ້ມູນ (JSON, ບໍ່ຂຽນຕົວເລກໃນໂຄ້ດ)

`public/data/progression.json` ໃໝ່ (ມີ parser ແລະ test ຄືໄຟລ໌ອື່ນ):

```json
{
  "maxLevel": 150,
  "xpCurve": { "base": 20, "exponent": 1.6 },
  "pointsPerLevel": 1,
  "stats": {
    "attack":  { "maxPoints": 50, "perPoint": 0.01 },
    "hearts":  { "maxPoints": 30, "pointsPerHeart": 10 },
    "guard":   { "maxPoints": 30, "blockChancePerPoint": 0.01 },
    "agility": { "maxPoints": 39, "speedPerPoint": 0.0025 }
  },
  "respec": { "ingredients": [{ "itemId": "crystal", "count": 3 }] },
  "deathXpLoss": 0
}
```

- XP ທີ່ຕ້ອງການເພື່ອຂຶ້ນຈາກ L ໄປ L+1 = `round(base × L^exponent)`.
- ແຕ້ມທັງໝົດ = 149 (level 2..150) = ຜົນລວມ `maxPoints` (50+30+30+39). **Level 150 ເຕັມທຸກ stat ພໍດີ**: ບໍ່ມີແຕ້ມເຫຼືອເປົ່າ ແລະບໍ່ມີ stat ທີ່ແຮງເກີນ.
- ເມື່ອເຕັມ: ດາເມດ +50%, +3 ຫົວໃຈ (3 → 6), ໂອກາດກັນການຕີ 30%, ຄວາມໄວ +~10%.
- `enemies.json` ແຕ່ລະໂຕໄດ້ `xp` (ຕົວເລກຂອງດ່ານທຳອິດ), ແລະ `scaling.enemyXpPerStage` ໃນ `stages.json` ເພີ່ມຕາມດ່ານຄືກັບ HP. Boss/Mini-boss ມີ `xp` ໃຫຍ່ ທີ່ຕັ້ງດ້ວຍມື.

`public/data/world-time.json` ໃໝ່: `{ "dayLengthMinutes": 20, "nightStartsAt": 0.7, "dawnMinutes": 1, "duskMinutes": 1, "startAt": 0.1 }` ແລະສີ/ຄວາມມືດຂອງແຕ່ລະຊ່ວງ.

`stages.json` ໄດ້ block `night` ຢູ່ເທິງສຸດ: `{ "creaturesPerScreen": 1, "hpMultiplier": 1.6, "xpMultiplier": 2.5, "byRealm": { "1": ["night-wisp"], "2": [...], "3": [...] } }`, ແລະດ່ານໃດກໍ່ປິດໄດ້ດ້ວຍ `"night": false` (ດ່ານ 1 ແລະດ່ານ Boss/Mini-boss ປິດຕາມຄ່າເລີ່ມຕົ້ນ).

### ເປັນຫຍັງຈຶ່ງເລືອກແບບນີ້

- **ຈຳກັດ stat ດ້ວຍ `maxPoints`:** ຜູ້ຫຼິ້ນ grind ໄດ້ ແຕ່ແຮງຂຶ້ນສູງສຸດ +50% ດາເມດ. ດາບ T3 ຈາກຕຳລາບົດ 3 ຍັງແຮງກວ່າດາບ T1 + stat ເຕັມ, ສະນັ້ນການຮຽນຍັງເປັນທາງຫຼັກ.
- **Guard = ໂອກາດກັນການຕີທັງໝົດ, ບໍ່ແມ່ນຫຼຸດ damage:** ເກມນັບເປັນຫົວໃຈ (1 ການຕີ = 1 ຫົວໃຈ). ການຫຼຸດ damage ບໍ່ມີຄວາມໝາຍຖ້າບໍ່ປ່ຽນລະບົບຫົວໃຈທັງໝົດ, ເຊິ່ງໃຫຍ່ເກີນ ແລະປ່ຽນຄວາມຮູ້ສຶກຂອງເກມ. ໃຊ້ `Random` port ທີ່ມີຢູ່ແລ້ວ (test ໄດ້ດ້ວຍ fake).
- **ເວລາເກມ ບໍ່ແມ່ນເວລາຈິງ:** ນັກຮຽນທີ່ຫຼິ້ນໃນໂຮງຮຽນ (ກາງເວັນ) ກໍ່ໄດ້ເຫັນກາງຄືນ. ໃຊ້ວິທີດຽວກັບ `CraftingQueue` (tick ໃນ `Game.update`).
- **ສວນບໍ່ກ່ຽວກັບການນອນ:** ສວນນັບເວລາຈິງຢູ່ແລ້ວ, ການນອນບໍ່ເລັ່ງມັນ (ຖ້າບໍ່ດັ່ງນັ້ນ ຈະນອນຊ້ຳໆ ເພື່ອປູກຜັກໄວ). ວຽກສ້າງຂອງນັບເວລາເກມ ຈຶ່ງເດີນໜ້າຕາມເວລາທີ່ນອນຂ້າມ (ສູງສຸດ 6 ນາທີ).
- **ບໍ່ເສຍ XP ເມື່ອຕາຍ (`deathXpLoss: 0`):** ການຕາຍເສຍວັດຖຸດິບ ແລະຄວາມທົນທານຢູ່ແລ້ວ. ສຳລັບເກມນັກຮຽນ ການເສຍ level ໜັກເກີນ. ເປັນຕົວເລກໃນ JSON ຈຶ່ງປ່ຽນໄດ້ພາຍຫຼັງ.

## ຂັ້ນຕອນ (Steps)

ແຕ່ລະ phase ເປັນ 1 PR, ມີ unit test (domain/application) ແລະ e2e.

### Phase L1: Hero Level ແລະ XP

1. `CONTEXT.md`: ເພີ່ມ Hero Level, XP, Stat point, Night creature, Bed, World time.
2. Domain `HeroLevel.ts`: `level`, `xp`, `unspentPoints`, `xpToNext(level, curve)`, `gainXp(amount)` → ຈຳນວນ level ທີ່ຂຶ້ນ (ຂຶ້ນຫຼາຍ level ໃນເທື່ອດຽວໄດ້), ຢຸດທີ່ 150 (XP ເກີນບໍ່ສະສົມ). `toSnapshot` / `loadFrom`.
3. `progression.json` + parser ໃນ `content/` + test (ຜົນລວມ `maxPoints` ຕ້ອງເທົ່າ `(maxLevel − 1) × pointsPerLevel`, curve ເປັນບວກ).
4. `xp` ໃນ `enemies.json` (ທຸກໂຕ), `enemyXpPerStage` ໃນ `scaling`, `scaleEnemyDefinition` scale `xp` ດ້ວຍ.
5. `grantXpUseCase(heroLevel, enemyDefinition)` → event `xp-gained` ແລະ `hero-level-up`. ເອີ້ນຈາກ**ທາງດຽວ** ທີ່ທັງດາບ ແລະສະກິວຜ່ານ (ຍ້າຍການຂ້າໃນ `SkillController` ໃຫ້ໃຊ້ hook ດຽວກັບ `CombatController.onEnemyDefeated`).
6. `GameState.heroLevel`, save `heroLevel` (additive) + `SaveData.test.ts`.
7. HUD: ປ້າຍ Lv ແລະແຖບ XP; ຂໍ້ຄວາມລອຍ "+12 XP"; ເອັບເຟັກ level up (ສຽງ + ແສງ).
8. **Test ຄວາມສົມດຸນ** (ContentIntegrity): ລວມ XP ຂອງທຸກ monster ໃນດ່ານທີ່ສ້າງແລ້ວ (spawn + scaling + Boss) ກວດວ່າການຜ່ານແຕ່ລະດ່ານເທື່ອດຽວ ໄປຮອດດ່ານ 30 ຢູ່ໃນຊ່ວງທີ່ຕັ້ງໄວ້ (ເຊັ່ນ level 25–40). ເມື່ອມີ 100 ດ່ານ ເປົ້າໝາຍແມ່ນ level 100–120 ທີ່ດ່ານ 100.
9. e2e: ຂ້າ monster ໃນດ່ານ 2, XP ຂຶ້ນ ແລະ HUD ສະແດງ; ໃຫ້ XP ພໍ ແລ້ວ level ຂຶ້ນ.

### Phase L2: ແຕ້ມ stat ແລະການຣີເຊັດ

1. Domain `HeroStats.ts`: ແຕ້ມໃນແຕ່ລະ stat, `attackMultiplier`, `bonusHearts`, `blockChance`, `speedMultiplier`, ອ່ານຈາກ tuning.
2. `Health`: ຕັ້ງ max ໄດ້ in place (`setMaxHealth(n)`, ເລືອດປັດຈຸບັນບໍ່ເກີນ max), ແລະ `syncHeartsUseCase` ຄືກັບ `syncArmorUseCase`. HUD ສະແດງຫົວໃຈ 3–6 ໜ່ວຍ.
3. `allocateStatPointUseCase` (ມີແຕ້ມ, ບໍ່ເກີນ `maxPoints`), `resetStatsUseCase` (ຈ່າຍວັດຖຸດິບໃນ `respec`, **ບໍ່ແມ່ນ Credit**, ຄືນແຕ້ມທັງໝົດ).
4. ຜົນ: `performAttackUseCase` × `attackMultiplier` (ສະກິວກໍ່ໄດ້ ເພາະຄິດຈາກດາເມດດາບ); `playerTakeDamageUseCase` ກັນການຕີດ້ວຍ `blockChance` (ສະແດງ "🛡️ ກັນໄດ້!"); `Game.update` ຄູນ `speedMultiplier`.
5. React `CharacterModal` (ກົດ **C** ແລະປຸ່ມໃນ HUD): Lv, XP, ແຕ້ມທີ່ຍັງບໍ່ໃຊ້, 4 stat ພ້ອມປຸ່ມ +, ຄ່າປັດຈຸບັນ/ສູງສຸດ, ປຸ່ມຣີເຊັດ. ເພີ່ມ C ໃນ `useGlobalShortcuts` ແລະ `useModalState`.
6. Save `heroLevel.stats` (additive); unit test ທຸກ use case; e2e: ແຈກແຕ້ມໃສ່ Hearts 10 ແຕ້ມ ແລ້ວມີ 4 ຫົວໃຈ, Attack ເຮັດໃຫ້ monster ຕາຍໄວຂຶ້ນ.

### Phase L3: ເວລາກາງວັນ/ກາງຄືນ

1. Domain `WorldTime.ts`: ເວລາໃນມື້ (ms), `phase` (`dawn` / `day` / `dusk` / `night`), `darkness` (0..1, ຄ່ອຍໆປ່ຽນໃນ dawn/dusk), `msUntilMorning`, `tick(delta)`, `skipToDawn()` → ms ທີ່ຂ້າມ. Event `night-fell`, `day-broke`.
2. `world-time.json` + parser; `GameState.worldTime`, save `worldTime` (additive).
3. `Game.update` tick ມັນ (ຄືກັບ `crafting`), ສະນັ້ນເວລາຢຸດເມື່ອ pause, ຢູ່ໜ້າ title ຫຼືປິດເກມ.
4. ພາບ: ຊັ້ນມືດຕິດກ້ອງ (ອ່ານ skill `filters-and-postfx` / `render-textures` ກ່ອນ) ທີ່ມີວົງແສງຮອບຕົວລະຄອນ; ດາວ ແລະເດືອນໃນ backdrop ກາງຄືນ; ໂຄມໄຟໃນໝູ່ບ້ານສະຫວ່າງ. ຄວາມມືດສູງສຸດຕ້ອງຍັງເຫັນເວທີ (ສຳຄັນສຳລັບການໂດດ).
5. HUD: ☀️/🌙 ແລະເວລາທີ່ເຫຼືອກ່ອນຊ່ວງຕໍ່ໄປ; ແຈ້ງ "🌙 ກາງຄືນມາແລ້ວ!".
6. Dev hook `window.__advanceWorldTime(ms)` ສຳລັບ e2e; unit test ຂອງ phase ແລະການວົນມື້.

### Phase L4: Monster ກາງຄືນ

1. `enemies.json`: monster ກາງຄືນ 1 ໂຕຕໍ່ມິຕິ ສຳລັບມິຕິ 1–3 (ເຊັ່ນ ຜີໄຟປ່າ, ຄ້າງຄາວຖ້ຳ, ແມງງອດຊາຍ) ມີ `"night": true`, drop ວັດຖຸດິບພິເສດ 1 ຢ່າງ (ໃຊ້ໃນສູດ ຫຼືຣີເຊັດ stat; ເປັນວັດຖຸດິບຈາກການສຳຫຼວດ ຈຶ່ງຖືກກົດ).
2. block `night` ໃນ `stages.json` + parser + ContentIntegrity (ທຸກມິຕິທີ່ສ້າງແລ້ວມີ monster ກາງຄືນ, id ມີຈິງ, ມີ `night: true`).
3. Domain: `nightCreatureDefinition(def, stage, scaling, night)` (scale ຄືໂຕທຳມະດາ ແລ້ວ × `hpMultiplier`, XP × `xpMultiplier`).
4. Scene: ເມື່ອເຂົ້າດ່ານຕອນກາງຄືນ ຫຼືເມື່ອກາງຄືນມາໃນຂະນະຢູ່ໃນດ່ານ: ເກີດ `creaturesPerScreen × screens` ໂຕ ຢູ່ໄກຈາກຕົວລະຄອນ (ບໍ່ໃກ້ກວ່າ 1 ຈໍ, ບໍ່ຢູ່ຈຸດວາບ) ພ້ອມເອັບເຟັກປະກົດ. ເມື່ອເຊົ້າ: ຄ່ອຍໆຈາງ ແລ້ວຫາຍ (ບໍ່ drop, ບໍ່ໃຫ້ XP). ບໍ່ມີໃນດ່ານ `night: false`, ດ່ານ 1, ເດີ່ນ Boss.
5. ຮູບ: script `tools/art/build_night_creatures.py` (ຕາມີແສງ, ສີເຂັ້ມ, ເງົາເຫຼື້ອມ), ອັບເດດ `docs/asset-manifest.json`.
6. e2e: ເຂົ້າດ່ານ 2 ຕອນກາງຄືນ ມີ monster ກາງຄືນ; ເລື່ອນເວລາໄປເຊົ້າ ພວກມັນຫາຍ; ຕອນກາງວັນບໍ່ມີ.

### Phase L5: ຕຽງນອນ

1. `sleepUseCase(worldTime, crafting, health)`: ນອນໄດ້ແຕ່ຊ່ວງ `dusk`/`night` (ບໍ່ດັ່ງນັ້ນ "☀️ ຍັງບໍ່ເຖິງເວລານອນ"), `skipToDawn()`, `crafting.tick(ms ທີ່ຂ້າມ)`, `health.reset()`. Event `slept`. Unit test (ກາງເວັນຖືກປະຕິເສດ, ວຽກສ້າງເດີນໜ້າຖືກຕ້ອງ, ສວນບໍ່ປ່ຽນ).
2. VillageBuilder: ເຮືອນນ້ອຍ/ຕຽງ ທີ່ບ່ອນວ່າງ (ກວດກັບຈຸດ E ທີ່ມີແລ້ວ; ຖ້າບໍ່ພໍ ຂະຫຍາຍ `village.json`), ປ້າຍ `🛏️ [E] ນອນ (ຂ້າມຮອດເຊົ້າ)`.
3. ພາບ: ຈໍຄ່ອຍໆມືດ, "💤", ແລ້ວແຈ້ງ "☀️ ເຊົ້າແລ້ວ!"; `autoSaveGame()`.
4. e2e: ກາງເວັນກົດນອນບໍ່ໄດ້; ກາງຄືນກົດນອນ ເປັນເຊົ້າ ແລະວຽກສ້າງຂອງທີ່ຍັງບໍ່ແລ້ວເດີນໜ້າ.

### Phase L6: ເອກະສານ ແລະຄວາມສົມດຸນ

1. `CLAUDE.md`, `docs/how-to-play.md` (ພາສາລາວ), `docs/content-guide.md` (ມິຕິ 4–10 ຕ້ອງມີ monster ກາງຄືນ ແລະ `xp` ໃນ monster ໃໝ່), GDD.
2. ຫຼິ້ນດ້ວຍມື (ຜູ້ໃຊ້): ຄວາມມືດຍັງເຫັນເວທີບໍ, monster ກາງຄືນແຮງເກີນບໍ, ການຂຶ້ນ level ໄວ/ຊ້າເກີນບໍ.

## Files ທີ່ຈະຖືກກະທົບ

- `CONTEXT.md`: ຄຳສັບໃໝ່.
- `public/data/progression.json`, `world-time.json` (ໃໝ່); `enemies.json` (`xp`, monster ກາງຄືນ); `stages.json` (`scaling.enemyXpPerStage`, `night`).
- `src/domain/entities/HeroLevel.ts`, `HeroStats.ts`, `WorldTime.ts` (ໃໝ່) + tests; `Health.ts` (max ປ່ຽນໄດ້); `StageScaling.ts` (xp, night); `GameState.ts`; `SaveData.ts` + test.
- `src/application/`: `GrantXpUseCase`, `AllocateStatPointUseCase`, `ResetStatsUseCase`, `SyncHeartsUseCase`, `SleepUseCase` (ໃໝ່) + tests; `PerformAttackUseCase`, `PlayerTakeDamageUseCase` (Attack, Guard).
- `src/infrastructure/content/`: parser ຂອງ progression, world-time, night block + tests; `ContentCatalog.ts`.
- `src/infrastructure/phaser/`: `Game.ts` (tick, speed, ຊັ້ນມືດ, ເກີດ/ລຶບ monster ກາງຄືນ), `CombatController.ts` + `SkillController.ts` (hook ການຂ້າດຽວ), `VillageBuilder.ts` (ຕຽງ), `StageBuilder.ts`, `effects/` (level up, ການປະກົດ/ຈາງ), `Preloader.ts` (ຮູບໃໝ່).
- `src/infrastructure/react/`: `CharacterModal.tsx` (ໃໝ່), HUD (Lv, XP, ຫົວໃຈ 3–6, ☀️/🌙), `useGlobalShortcuts` (C), `useModalState`, `App.tsx` (events).
- `tools/art/build_night_creatures.py` (ໃໝ່), `docs/asset-manifest.json`.
- `e2e/hero_level.spec.ts`, `stats.spec.ts`, `day_night.spec.ts`, `night_creatures.spec.ts`, `bed.spec.ts` (ໃໝ່).
- `CLAUDE.md`, `docs/how-to-play.md`, `docs/content-guide.md`, `docs/Game Design Doc-Village Hub.md`.

## ຄວາມສ່ຽງ / ຄຳຖາມທີ່ຍັງເປີດ (Risks / Open Questions)

- **Grind ແທນການຮຽນ:** ຈຳກັດດ້ວຍ `maxPoints` ແລະ XP ບໍ່ປ່ຽນເປັນ Credit. ຕ້ອງເບິ່ງວ່າ monster ກາງຄືນ (XP × 2.5) ບໍ່ເຮັດໃຫ້ grind ຄຸ້ມເກີນໄປ. ການກວດໃນ L1 ຂໍ້ 8 ຈະເຕືອນຖ້າ level ໄວເກີນ.
- **ດ່ານສ້າງໃໝ່ທຸກເທື່ອທີ່ເຂົ້າ (monster ເກີດຄືນ):** ຜູ້ຫຼິ້ນເຂົ້າ-ອອກດ່ານງ່າຍໆ ເພື່ອ grind ໄດ້. ອາດຕ້ອງການ XP ໜ້ອຍລົງ ສຳລັບດ່ານທີ່ຕໍ່າກວ່າ level ຂອງຜູ້ຫຼິ້ນຫຼາຍ (ເຊັ່ນ XP × 0.2 ເມື່ອ Hero Level > ດ່ານ × 1.5 + 10). ແນະນຳໃຫ້ເຮັດໃນ L1 (ຕົວເລກໃນ `progression.json`).
- **ຄວາມມືດ ແລະການໂດດ:** ກາງຄືນມືດເກີນ ຈະເບິ່ງເວທີ ແລະໜາມບໍ່ເຫັນ. ຕ້ອງເຮັດໃຫ້ຂອບເວທີ ແລະໜາມຍັງເຫັນຊັດ.
- **Performance:** ຊັ້ນມືດ + ວົງແສງ + monster ເພີ່ມ ໃນ GPU ອ່ອນ. ມີບັນຫາຢູ່ແລ້ວທີ່ ~17 fps (monster ຈົມພື້ນ). ໃຊ້ຊັ້ນດຽວ ບໍ່ໃຊ້ Light2D ທຸກ object.
- **`damage` ຂອງ monster ທີ່ບໍ່ຖືກໃຊ້:** ແຜນນີ້ບໍ່ໄດ້ແກ້ (Guard ເປັນໂອກາດກັນ). ຖ້າຢາກໃຫ້ monster ແຮງຕີເສຍຫຼາຍຫົວໃຈ ເປັນແຜນແຍກ.
- **Monster ກາງຄືນ ກັບ secret ledge ແລະ waypoint:** ຕ້ອງບໍ່ເກີດເທິງແຜ່ນຫີນລັບ ຫຼືທັບຈຸດວາບ.
- **Hero Level 150 ກັບ 100 ດ່ານ:** ຕອນນີ້ມີແຕ່ 30 ດ່ານ, ສະນັ້ນເສັ້ນ XP ຈະຖືກປັບອີກ ເມື່ອມີມິຕິ 4–10.
- **ເປີດ:** monster ກາງຄືນ drop ວັດຖຸດິບພິເສດຫຍັງ ແລະໃຊ້ເຮັດຫຍັງ? (ແຜນນີ້ສະເໜີໃຊ້ໃນການຣີເຊັດ stat ແລະສູດຢາ.)
