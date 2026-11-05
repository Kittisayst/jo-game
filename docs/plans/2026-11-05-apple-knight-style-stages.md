# ປັບດ່ານໃຫ້ມີຮູບແບບແບບ Apple Knight 2 (ສະບັບ Stage)

- **Date:** 2026-11-05
- **Status:** in progress (S1 forest + S2 raised ground done, branch feat/stage-forest-art; S3–S5 not started)
- **Project:** jo-game (Knowledge Quest)

## ເປົ້າໝາຍ (Goal)

ເຮັດໃຫ້ "ດ່ານ" ຂອງເຮົາ (Stage 1–100) ເບິ່ງ ແລະ ຫຼິ້ນຄືພາບຕົວຢ່າງຂອງ Apple Knight 2 ທີ່ຜູ້ໃຊ້ສົ່ງມາ: ພື້ນຫຼາຍຊັ້ນ, ຂອບຫຍ້າ + ໜ້າຜາ, ຖ້ຳ/ເພດານ, ໄມ້ປະດັບ, ທິວທັດຫຼາຍຊັ້ນ. ຂອບເຂດຮອບນີ້ມີແຕ່ **ດ່ານ** (ສາກ + ໂຄງສ້າງດ່ານ). ລະບົບ parry, ສັດລ້ຽງຕໍ່ສູ້, ສະກິວຕາມດາບ ແຍກເປັນແຜນອື່ນພາຍຫຼັງ.

ຫ້າມຄັດລອກຮູບ/ອາຮ໌ດຂອງ Apple Knight 2. ເຮົາອ້າງອີງ **ການອອກແບບ** (ຊັ້ນຂອງສາກ, ຮູບຮ່າງຂອງພື້ນ, ຂອງປະດັບ) ແລ້ວວາດອາຮ໌ດຂອງເຮົາເອງ.

## Context ປັດຈຸບັນ (ຈາກການອ່ານ code)

ພາບຕົວຢ່າງມີຫຍັງ:
1. ສາກຫຼັງ 3–4 ຊັ້ນ: ທ້ອງຟ້າ + ເມກ, ເນີນເຂົາໄກ, ແຖວຕົ້ນໄມ້ກາງ.
2. ພື້ນເປັນ tile ມີຂອບຫຍ້າຂ້າງເທິງ, ໜ້າຜາສີມ່ວງ-ນ້ຳຕານມີເສັ້ນຂອບ, ຄວາມສູງຕ່າງກັນເປັນຂັ້ນ; ມີ**ຖ້ຳ**ທາງຊ້າຍທີ່ມີເພດານຫີນຍື່ນ ແລະ ຊ່ອງເປີດຮອດທ້ອງຟ້າ.
3. ເສົາ/ແທ່ນຫີນຊັ້ນດຽວ (stone pillar), ຂົວໄມ້, ພຸ່ມໄມ້, ຕົ້ນໄມ້ໃຫຍ່, ກັບດັກແຫຼມ.
4. ຫີບສົມບັດ**ຢູ່ຊອກຕ່ຳ**ໃຕ້ຂອບ (ຫ້ອງລັບ).
5. ເຫຼັກຄຳ +1, ຫົວໃຈ, ໂຕເລກຄວາມເສຍຫາຍ (-32), ສັດລ້ຽງ (ໝາປ່າ) ຕິດຕາມ.

ເກມເຮົາດຽວນີ້ (ໄຟລ໌ທີ່ອ່ານແລ້ວ):
- ສາກຫຼັງແມ່ນຮູບ JPG ໃບດຽວ (`bg_plains.jpg` 2560×720, `bg_cavern.jpg` 1280×720 ...) ເລື່ອນຊ້າ 0.25 ເທົ່າ: [WorldBuilder.ts](../../src/infrastructure/phaser/scenery/WorldBuilder.ts) `createSky`.
- ພື້ນແມ່ນແຖບແບນດຽວ `GROUND_Y` = 656 ສູງ 64 (tile 64×64 `tile_ground.png`), ຕັດເປັນຕອນຖ້າມີເຫວ (`groundSpans`); ດິນຢູ່ລຸ່ມເປັນສີ່ຫຼ່ຽມສີດຽວ (ໃນໂທລະສັບ #180901): `createGround`, [Game.ts](../../src/infrastructure/phaser/scenes/Game.ts) ~ແຖວ 198–225.
- ແພລັດຟອມມີແຕ່ໄມ້ກະດານລອຍ 160×28, ຂ້າມຂຶ້ນໄດ້ທາງດຽວ (`Platform.ts`); ບໍ່ມີກ້ອນແຂງ ຫຼື ຜາຕັ້ງຂຶ້ນ.
- ເຄື່ອງປະດັບບໍ່ມີ ນອກຈາກ node, ປ້າຍ, ຈຸດ waypoint ທີ່ວາງຕາມ `stages.json`. ບໍ່ມີ prop ບັນຍາກາດ (ພຸ່ມ, ເສົາ, ຫີບ).
- `StageGenerator.ts` ສ້າງບັນໄດ 2–3 ຂັ້ນ (`LOW_Y` 592 / `HIGH_Y` 512), ກັບດັກ, ເຫວ, ຂອບລັບທີ່ຕ້ອງໃຊ້ air dash (`SECRET_Y` 440). ສຸ່ມຈາກ seed ແລ້ວແຕ່ **ເລື່ອງທີ່ເພີ່ມທີຫຼັງໃຊ້ RNG ແຍກ** (ແບບທີ່ pits/secret ເຮັດ) ເພື່ອບໍ່ໃຫ້ຜັງດ່ານເດີມປ່ຽນ.
- `Level` (`Level.ts`): `platforms`, `spikes`, `pits`, `movingPlatforms`, `scenery`, `arenaFromX`; ບໍ່ມີ `blocks` ຫຼື `decor`.
- ມີຢູ່ແລ້ວ: ໂຕເລກຄວາມເສຍຫາຍລອຍ (`FloatingText.ts`), ສັດລ້ຽງ (ຮ້ານ Pet, ໄຟລ໌ pet_dog/pet_chicken), ຫີບເກັບຂອງໃນໝູ່ບ້ານ, ຫ້ອງລັບແບບຂອບສູງ.
- ກົດຂອງເກມ: **Credit ມາຈາກການຮຽນເທົ່ານັ້ນ** (ADR 0005), Materials ມາຈາກການສຳຫຼວດ. ສະນັ້ນ "ເຫຼັກຄຳ +1" ໃນພາບຈະບໍ່ເປັນ Credit.

## ແນວທາງ (Approach)

ແບ່ງເປັນຂັ້ນ, ຂັ້ນທີ່ຫຼຸດຄວາມສ່ຽງກ່ອນ. S1 ບໍ່ແຕະຟີຊິກ ແລະ ບໍ່ແຕະຜັງດ່ານ ຈຶ່ງມອບໃຫ້ເຫັນຜົນໄດ້ໄວ ແລະ ບໍ່ເຮັດ e2e/Reachability ແຕກ. S2 ແຕະຜັງດ່ານ ຈຶ່ງເຮັດຫຼັງ.

ເຫດຜົນ: ດ່ານໃນເກມເຮົາເປັນ data + generator ທີ່ມີ test ຫຼາຍ (Reachability 500 seed). ການປ່ຽນຮູບລັກສະນະທີ່ບໍ່ມີ collision ປອດໄພທີ່ສຸດ; ກ້ອນແຂງ (ເສົາ/ຜາ) ເພີ່ມຄວາມສ່ຽງກັບ enemy patrol, node y, ແລະ bot e2e.

### S1. ສາກ ແລະ ຮູບລັກສະນະ (ບໍ່ມີຟີຊິກໃໝ່)
- **ສາກຫຼັງຫຼາຍຊັ້ນ** ຕໍ່ biome (forest ກ່ອນ, ແລ້ວ cave, desert): ຟ້າ+ເມກ (0.1), ເນີນໄກ (0.2), ແຖວຕົ້ນໄມ້ກາງ (0.4). ສ້າງເປັນ PNG ໂປ່ງໃສ ຊັ້ນລະໄຟລ໌ ແທນ JPG ໃບດຽວ. `createSky` ປ່ຽນເປັນລຸ່ມ list ຂອງ `tileSprite` ແຕ່ລະຊັ້ນມີ `scrollFactor`; ຍັງຮັກສາການສະຫຼັບໄປ arena backdrop ຂອງດ່ານ boss.
- **ພື້ນແບບມີຂອບຫຍ້າ + ໜ້າຜາ**: tile ໃໝ່ (ຂອບຫຍ້າເທິງ, ຫີນມ່ວງ-ນ້ຳຕານມີເສັ້ນຂອບ) ໃຊ້ແທນ `tile_ground.png`; ເພີ່ມ tile ຫົວ/ທ້າຍ ຕອນຕິດເຫວ (ເປັນ cap ເຮັດໃຫ້ເຫວເບິ່ງເປັນຜາຕັດ). ສີດິນລຸ່ມໃຊ້ໂທນດຽວກັນ; ໃນໂທລະສັບຍັງໃຊ້ສີ `TOUCH_SOIL_COLOR` (#180901) ທີ່ຜູ້ໃຊ້ເລືອກ.
- **ໄມ້ກະດານ → ຂອບຫຍ້າລອຍ**: ແທນ `platform.png` (ຂະໜາດເທົ່າເດີມ 160×28, ບໍ່ປ່ຽນ body) ເປັນຂອບຫຍ້າ + ຫີນໃຕ້.
- **ເຄື່ອງປະດັບບັນຍາກາດ (`decor`)**: ພຸ່ມ, ຫຍ້າ, ຫີນ, ເສົາຫີນເຕັ້ຍ (ປະດັບເທົ່ານັ້ນ, ບໍ່ມີ body), ຕົ້ນໄມ້ໃຫຍ່ ໄວ້ຫຼັງ/ໜ້າຜູ້ຫຼິ້ນ ເລືອກຈາກ list ຕາມ biome ຜ່ານ RNG ແຍກຈາກ seed (ໃຊ້ຫຼັງທຸກຢ່າງ) ໃຫ້ຕຳແໜ່ງຄົງທີ່ ແລະ ບໍ່ກະທົບຕຳແໜ່ງ node/enemy. ຫຼີກ x ຂອງ node, ເຫວ, ປ້າຍ, ທາງອອກ.
- **ສິ່ງແວດລ້ອມຖ້ຳ (cave)**: ເພດານຫີນຍື່ນ + ຫີນຫ້ອຍ (stalactite) ຢູ່ຂອບເທິງຂອງຈໍ ໃຊ້ຮູບຊ້ຳ; ບໍ່ມີ collision.
- **ອາຮ໌ດ**: ຂຽນ `tools/art/build_stage_art.py` ຕາມແບບ `build_realm3_art.py` (ໃຊ້ helper ຂອງ `build_realm2_art.py`, ອັບເດດ `docs/asset-manifest.json`). ໃຊ້ skill create-game-assets: ກຳນົດ palette ກ່ອນ (ເສັ້ນຂອບມ່ວງເຂັ້ມ, ຫຍ້າ 3 ໂທນ, ຫີນ 3 ໂທນ), ວາງ hero asset 1 ໜ່ວຍ (ພື້ນ + ຂອບ) ໃຫ້ຜູ້ໃຊ້ເບິ່ງກ່ອນເຮັດທັງຊຸດ, ຕວດຢູ່ຂະໜາດຈິງ ແລະ ທີ່ zoom ໂທລະສັບ 1.75.

### S2. ພື້ນມີລະດັບ (ກ້ອນແຂງ) ແລະ ໄມ້ປະດັບທີ່ມີ collision
- ເພີ່ມ `blocks: { x, width, height }[]` ໃນ `Level`: ກ້ອນຫີນ/ຜາແຂງຕັ້ງຂຶ້ນຈາກພື້ນ (ສູງ 1 tile = 64 px; ຫຼາຍສຸດ 96 px ເພື່ອໃຫ້ກະໂດດຂຶ້ນໄດ້ງ່າຍ, ກະໂດດເຕັມປະມານ 107 px). ເປັນ static body ຕັນທັງ 4 ດ້ານ (ຕ່າງຈາກ platform ທີ່ລອດຂຶ້ນໄດ້).
- `StageGenerator` ເພີ່ມ `blocks` ໂດຍ RNG ແຍກ (ກ້ອນລະ 1–3 tile ກວ້າງ, ຫ່າງຈາກເຫວ/ແພລັດຟອມ/ກັບດັກ ຕາມຕົວແປ clearance ຂອງ pits). `placePool` ຫຼີກຊ່ວງຂອງກ້ອນສຳລັບ node ແລະ enemy ເພື່ອບໍ່ໃຫ້ y ຜິດ (node/enemy ຍັງຢືນພື້ນແບນເທົ່ານັ້ນ).
- ອັບເດດ `LevelReachability.test.ts` ໃຫ້ກວດວ່າກ້ອນບໍ່ຕັນທາງ ແລະ ກະໂດດຂຶ້ນໄດ້ສຳລັບ 500 seed ຕໍ່ biome. ແລະ bot e2e ຕ້ອງຂ້າມກ້ອນໄດ້ (`bot.ts` ມີກະໂດດເມື່ອຕິດຢູ່ແລ້ວ).
- ເສົາ/ແທ່ນຫີນ (ຄືໃນພາບ) ເປັນກ້ອນແຂງຕົວໜຶ່ງ ແລະ ຂົວໄມ້ເປັນ platform ຂ້າມເຫວ (ເຊື່ອມກັບ `pits`: ບາງເຫວມີຂົວ, ຕ້ອງເບິ່ງວ່າຂົວບໍ່ເຮັດໃຫ້ກົດ pit ເສຍຄວາມໝາຍ).

### S3. ຫ້ອງລັບທີ 2: ຊອກໃຕ້ + ຫີບ
- ຕອນນີ້ເຮົາມີຂອບລັບຢູ່ສູງ (ຕ້ອງ air dash). AK2 ມີ 2 ບ່ອນຕໍ່ດ່ານ ແລະ ຫີບຢູ່ຊອກຕ່ຳ. ເພີ່ມ**ຊອກຕ່ຳ**: ຊັ້ນຕ່ຳຂ້າງເຫວ ເຂົ້າໄດ້ໂດຍກະໂດດລົງ ແລ້ວຂຶ້ນຄືນດ້ວຍ ledge grab/double jump. ມີຫີບ (ຮູບ `storage_chest.png` ທີ່ມີ ຫຼື ອັນໃໝ່) ໃຫ້ Material ຜ່ານ `nodes.json` ປະເພດໃໝ່ `chest` ຫຼື ໃຊ້ node ເດີມ (`secret: true`). ບໍ່ຈ່າຍ Credit.
- ຂັ້ນນີ້ແຕະ `stages.json` ແລະ ກົດ parser ຂອງ secret, ຈຶ່ງ **ຕ້ອງຕົກລົງກັບຜູ້ໃຊ້ກ່ອນ** (ຄຳຖາມຂ້າງລຸ່ມ).

### S4. ຄວາມຮູ້ສຶກຂອງການຕໍ່ສູ້ / ຂອງເກັບ (ບໍ່ບັງຄັບ)
- ໂຕເລກຄວາມເສຍຫາຍ ມີແລ້ວ, ກວດຂະໜາດ/ສີໃຫ້ຄືພາບ (ສີສົ້ມຈາງ, ລອຍຂຶ້ນ).
- ຫົວໃຈຕົກຈາກສັດຕູ (ໂອກາດນ້ອຍ) ເປັນກົດເກມໃໝ່: ຕ້ອງຕັດສິນໃຈ (ມີ potion ຢູ່ແລ້ວ).
- **ເຫຼັກຄຳ +1**: ບໍ່ໃຊ້ Credit. ຕົວເລືອກ: (ກ) ບໍ່ເຮັດ, (ຂ) ເປັນຜົນ XP ເລັກນ້ອຍ, (ຄ) ເປັນ Material ສະສົມ ແລະ ມີແຕ່ປະດັບ. ແນະນຳ (ກ).

### S5. ກວດ ແລະ ປັບປະສິດທິພາບ
- ກວດດ້ວຍພາບໜ້າຈໍ 1280×720 (desktop) ແລະ 915×412, 667×375 (ໂທລະສັບ), Stage 1, 2, 5 (miniboss), 10 (boss), 11–14 (ມີຂອບລັບ), ດ່ານ cave ແລະ desert.
- ຈຳນວນ sprite ຂອງ decor ຈຳກັດ (ເຊັ່ນ ≤ 12 ຕໍ່ໜ້າຈໍ) ແລະ ໃຊ້ `tileSprite` ສຳລັບຊັ້ນສາກ ເພື່ອບໍ່ໃຫ້ FPS ຕົກໃນໂທລະສັບ (ມີບັນຫາ FPS ຕ່ຳເຮັດໃຫ້ສັດຕູຈົມພື້ນຢູ່ແລ້ວ, ເບິ່ງ Known leftovers ໃນ CLAUDE.md).
- ແລ່ນ `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run test:e2e` (ໂດຍສະເພາະ `mobile_layout`, `windows`, ແລະ spec ທີ່ເຮັດ Stage); ອັບເດດ CLAUDE.md ເຮັດນຳ.

## ຂັ້ນຕອນ (Steps)
1. ຕົກລົງ palette ແລະ ສະໄຕ (ຖາມຜູ້ໃຊ້ເບິ່ງ hero asset ກ່ອນ) ແລະ ຕອບຄຳຖາມເປີດຂ້າງລຸ່ມ.
2. S1-a: ຂຽນ `tools/art/build_stage_art.py` ສ້າງ tile ພື້ນ, ຂອບຫຍ້າ, platform, ສາກ 3 ຊັ້ນ (forest ກ່ອນ), ເຄື່ອງປະດັບ. ອັບເດດ manifest.
3. S1-b: ໂຫຼດໃນ `Preloader.ts`; ປ່ຽນ `createSky` ເປັນຫຼາຍຊັ້ນ; ປ່ຽນ `createGround`/ຕອນເຫວ (cap); ຕໍ່ພື້ນ-ດິນຮ່ວມໂທນ.
4. S1-c: `Level.decor` + ຕົວວາງ decor ໃນ `StageGenerator` (RNG ແຍກ) + ວາດໃນ `WorldBuilder`; test ວ່າ seed ດຽວກັນໃຫ້ decor ດຽວກັນ ແລະ ຜັງ platforms/spikes ເດີມບໍ່ປ່ຽນ.
5. S1-d: ເຮັດ cave (ເພດານ, ຫີນຫ້ອຍ) ແລະ desert ຕາມດ້ວຍ.
6. ກວດ S1 ດ້ວຍພາບ + e2e ແລ້ວ PR ແຍກ (ປ່ອຍໄດ້ກ່ອນ).
7. S2: `Level.blocks`, ຕົວສ້າງໃນ generator, collision, `placePool` ຫຼີກ, ອັບເດດ Reachability test ແລະ bot; PR ແຍກ.
8. S3 (ຖ້າຜູ້ໃຊ້ເຫັນດີ): ຊອກຕ່ຳ + ຫີບ; PR ແຍກ.
9. S4 ຕາມທີ່ຕົກລົງ; ອັບເດດ CLAUDE.md ແລະ HISTORY.md.

## Files ທີ່ຈະຖືກກະທົບ
- `tools/art/build_stage_art.py` (ໃໝ່): ສ້າງ tile, ສາກ, ເຄື່ອງປະດັບ.
- `public/assets/environment/*`, `public/assets/backgrounds/*`: ຮູບໃໝ່ (ພື້ນ, ຂອບຫຍ້າ, platform, ຊັ້ນສາກ, decor).
- `src/infrastructure/phaser/scenes/Preloader.ts`: ໂຫຼດຮູບໃໝ່.
- `src/infrastructure/phaser/scenery/WorldBuilder.ts`: `createSky` ຫຼາຍຊັ້ນ, `createGround` cap, decor, (S2) blocks.
- `src/infrastructure/phaser/scenes/Game.ts`: ໂທນດິນ/ເອີ້ນ builder ໃໝ່.
- `src/infrastructure/phaser/Level.ts`: `decor`, (S2) `blocks`.
- `src/infrastructure/content/StageGenerator.ts` + `.test.ts`: ວາງ decor/blocks ດ້ວຍ RNG ແຍກ.
- `src/infrastructure/content/LevelReachability.test.ts` (ຫຼືໄຟລ໌ທີ່ມີຊື່ນີ້): ກວດ blocks.
- `public/assets/levels/stage-*.json`: ເພີ່ມ `decor`/`blocks` ໃສ່ດ່ານທີ່ເຮັດເອງ (ຖ້າຕ້ອງການ).
- `e2e/helpers/bot.ts`: ຂ້າມກ້ອນ (S2).
- `CLAUDE.md`, `docs/plans/HISTORY.md`, `docs/asset-manifest.json`.

## ຄວາມສ່ຽງ / ຄຳຖາມທີ່ຍັງເປີດ (Risks / Open Questions)
- **ແຫຼ່ງອາຮ໌ດ**: ເຮົາວາດດ້ວຍ script (ຮູບແບບແບນ, ຄືໂຕເກົ່າ) ອາດບໍ່ສວຍເທົ່າພາບຕົວຢ່າງ. ທາງເລືອກ: ໃຊ້ຊຸດ asset ຟຣີ (ຕ້ອງກວດ license), ຫຼື ຜູ້ໃຊ້ວາດ/ສັ່ງ, ແລ້ວເຮົາ import. ຕ້ອງເລືອກກ່ອນເລີ່ມ S1.
- **ຂອບເຂດ biome**: ເລີ່ມຈາກ forest ແລ້ວຂະຫຍາຍ, ຫຼື ເຮັດທັງ 3 biome ພ້ອມກັນ?
- **ເຫຼັກຄຳ/ຫົວໃຈ** (S4): ບໍ່ໃຫ້ກະທົບກົດ Credit. ແນະນຳບໍ່ເຮັດເຫຼັກຄຳ.
- **ກ້ອນແຂງ (S2)** ອາດເຮັດໃຫ້ enemy patrol, bot, ແລະ Stage 7-ແບບ (ບອທຍ່າງບໍ່ຮອດທາງອອກ) ມີບັນຫາອີກ. ຕ້ອງແລ່ນ Reachability + e2e ເຕັມ.
- **ປະສິດທິພາບໃນໂທລະສັບ**: ຫຼາຍຊັ້ນ parallax + decor ອາດເຮັດ FPS ຕົກ. ຕ້ອງວັດ.
- **ໝູ່ບ້ານ/ສວນ**: ບໍ່ຢູ່ໃນຂອບເຂດ (ມີ builder ແຍກ); ຖ້າຢາກໃຫ້ຄືກັນ ເປັນແຜນຕໍ່.
- ຂໍ້ມູນ AK2 ມາຈາກໜ້າຮ້ານ/ຄຳຕິຊົມ ແລະ ພາບຕົວຢ່າງ 1 ພາບ ບໍ່ແມ່ນຈາກການເຂົ້າໄປຫຼິ້ນ. ການຄາດເດົາກ່ຽວກັບລະບົບພາຍໃນຂອງເຂົາຢ່າງເຊັ່ນຄວາມສູງ tile ບໍ່ຮູ້ແນ່ນອນ.

## ບັນທຶກສະຖານະ S1 (forest) — 2026-11-05

ເຮັດແລ້ວ: ອາຮ໌ດ pxl (`tools/art/forest-stage.px.js`), ຂໍ້ມູນ look ໃນ JSON (`public/data/scenery.json` + `SceneryCatalog.ts`), decor ວາງຈາກ level JSON (`decor`) ຫຼື scatter ຈາກ key/seed (`SceneryDecor.ts`, ບໍ່ກະທົບຜັງດ່ານ), `layout.generate.decor`, backdrop 4 ຊັ້ນ (sky/clouds ຕິດຈໍ, hills/trees ຕິດເສັ້ນພື້ນ), ພື້ນ/ແພລັດຟອມ/ສີດິນຕາມ theme. test: SceneryCatalog.test.ts (ຮູບມີຢູ່ແທ້, ຄ່າຜິດບອກໄຟລ໌+path, decor ຄົງທີ່, ຫຼີກ node/ເຫວ/ກັບດັກ, ບໍ່ປ່ຽນຜັງ).
ຍັງບໍ່ເຮັດ: cave/desert theme, ເພດານຖ້ຳ, S2 ກ້ອນແຂງ, S3 ຊອກລັບ+ຫີບ, S4, ການວັດ FPS ໃນໂທລະສັບຈິງ.

## ບັນທຶກສະຖານະ S2 (ພື້ນຕ່າງລະດັບ) — 2026-11-05

ຜູ້ໃຊ້ສົ່ງພາບ AK2 ເພີ່ມ: ພື້ນຕ່າງລະດັບ, ກຳແພງ, ເກາະກຳແພງ (ຂອງເຮົາມີແຕ່ພື້ນລອຍ). ກວດ code: ຜູ້ຫຼິ້ນມີ wall slide/wall kick/ledge grab ຢູ່ແລ້ວ (`Player.ts`, ໃຊ້ `blocked.left/right` ຂອງ static body) ສະນັ້ນບໍ່ຕ້ອງແກ້ຜູ້ຫຼິ້ນ, ພຽງແຕ່ເພີ່ມກ້ອນແຂງ.
ເຮັດແລ້ວ: `Level.terrain` + `LevelTerrain.ts` (ກົດ, `terrainProblem`, `placeTerrain`), `layout.generate.terrain` (0–3), tile ກຳແພງ `tile_wall_forest.png` (ຕໍ່ເນື່ອງກັບ tile ພື້ນ), ວາດ+collision ໃນ `createGround`, `scenery.json` ມີ `wall`, spike/node/enemy/decor ຫຼີກກ້ອນ, ດ່ານ 2–4 ມີ 1 ຊິ້ນ. ຢືນຢັນໃນເກມ: ຍ່າງຕິດກຳແພງ (blocked.right) ແລະ ກະໂດດຂ້າມໄດ້. test: LevelTerrain.test.ts (500 seed ຕໍ່ biome).
ຂໍ້ຈຳກັດ: ດ່ານ 2 ໜ້າຈໍ ໃສ່ໄດ້ແຕ່ເນີນນ້ອຍ 1 tile; ກຳແພງສູງ/ຊອງເກາະກຳແພງ (ສອງກຳແພງຫັນໜ້າກັນ) ແລະ ຫ້ອງຖ້ຳລົງໃຕ້ດິນ ຍັງບໍ່ເຮັດ ຕ້ອງການດ່ານຍາວກວ່າ ຫຼື ໂລກສູງກວ່າ 720.

## ບັນທຶກສະຖານະ S2b (ເນີນສູງ/ໜ້າຜາ) — 2026-11-05

ເພີ່ມຮູບຮ່າງ: mound 1-2-3-2-1 (ແລະກວ້າງ), ໜ້າຜາຂຶ້ນຫາຊັ້ນສູງ 3 tile ແລ້ວຕັດຊັນ (ຈັບຄູ່ໃຫ້ເກີດຖີ່ຂຶ້ນ). ດ່ານ 2–4 ຂໍ 2 ຊິ້ນ; ດ່ານ 3 ຍາວ 2→3 ໜ້າຈໍ (ຜັງດ່ານປ່ຽນ) ແລະມີໜ້າຜາ. ດ່ານ 2, 4 ຍັງ 2 ໜ້າຈໍ ໄດ້ເນີນນ້ອຍເທົ່ານັ້ນ. ຍັງບໍ່ມີຊ່ອງກຳແພງສອງຝັ່ງ (ເກາະກຳແພງສະຫຼັບ) ເພາະຜູ້ຫຼິ້ນອາດຕິດຢູ່ໃນຊ່ອງ.
