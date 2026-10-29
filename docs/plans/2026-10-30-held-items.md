# ຕົວລະຄອນຖືອາວຸດ ແລະເຄື່ອງມືໃຫ້ເຫັນໃນມື (Held item)

- **Date:** 2026-10-30
- **Status:** done steps 1–7, 9 (system + placeholders); step 8 (real PNGs, removing the frame-13 stub) waits for art
- **Project:** jo-game (ພະຈົນໄພຄວາມຮູ້ / Knowledge Quest)

## ເປົ້າໝາຍ (Goal)

ໃຫ້ຜູ້ຫຼິ້ນ **ເຫັນ** ສິ່ງທີ່ຕົວລະຄອນຖືຢູ່: ດາບທີ່ໃສ່ຢູ່ (ດາບໄມ້/ເຫຼັກ/ຜລຶກ) ຕອນຢູ່ໃນດ່ານ, ແລະເຄື່ອງມື (ຂວານ/ຈົກ/ຄ້ອນ) ຕອນຕັດໄມ້ ຂຸດແຮ່ ຫຼືສ້ອມປະຕູ. ຕອນນີ້ການຟັນເຫັນແຕ່ຄື້ນດາບ (slash VFX) ແລະການຕັດໄມ້ເຫັນແຕ່ທ່າຍື່ນແຂນ: ນັກຮຽນບໍ່ຮູ້ວ່າດາບເຫຼັກທີ່ສ້າງມາຢ່າງຍາກຢູ່ໃສ.

ຕັດສິນໃຈແລ້ວກັບຜູ້ໃຊ້ (30 ຕ.ລ. 2026):
1. **ເຄື່ອງມືປ່ຽນເອງອັດຕະໂນມັດ**: ຖືດາບໂດຍປົກກະຕິ; ເວລາ Strike ໃສ່ node ເຄື່ອງມືທີ່ກົງກັນຂຶ້ນມາໃນມືຊົ່ວຄາວ ແລ້ວກັບເປັນດາບ. ບໍ່ມີ hotbar ຫຼືປຸ່ມໃໝ່; ກົດເດີມ "ມີເຄື່ອງມືໃນກະເປົາ = ໃຊ້ໄດ້" ບໍ່ປ່ຽນ.
2. **ມືເປົ່າໃນໝູ່ບ້ານ**: ຖືດາບສະເພາະໃນ Stage.
3. **ລະບົບກ່ອນ + placeholder**: ສ້າງລະບົບພ້ອມຮູບຊົ່ວຄາວທີ່ແຕ້ມຈາກໂຄດ ແລະຂຽນ spec ໃຫ້ຜະລິດ PNG ຈິງ; ວາງ PNG ແລ້ວແທນທີ່ເອງ ບໍ່ຕ້ອງແກ້ໂຄດ.

## Context ປັດຈຸບັນ

- **Skin sheets** (`public/assets/characters/player-skin-*.png`): 512×48 = 16 ເຟຣມ 32×48. idle 0–3, run 4–9, jump 10, fall 11, attack 12–14, wall-slide 15 (`Player.initAnimations`). **ບໍ່ມີອາວຸດແຕ້ມໃນມື** ຍົກເວັ້ນ ເຟຣມ 13 ທີ່ມີຂີດສີຂາວນ້ອຍໆ (ຈະຊ້ອນກັບດາບທີ່ຖື).
- **ທັງ 4 skin ໃຊ້ຮ່າງກາຍແມ່ແບບດຽວກັນ**: ວັດເງົາ (alpha) ທຽບກັບ cyber-blue ຕ່າງກັນ 2–12% ຕໍ່ເຟຣມ (ສ່ວນໃຫຍ່ແມ່ນໝວກ/ເກາະ). ສະນັ້ນ **ຕາຕະລາງຕຳແໜ່ງມືຊຸດດຽວ** ໃຊ້ໄດ້ທຸກ skin (ອາດຕ້ອງ override ເລັກນ້ອຍ).
- **ອາວຸດ**: `EquipmentState` ຖື `equippedWeaponId` ແລະ upgrade level; `WEAPON_CONFIGS` ມີ damage/range/cooldown. `Q` ສະຫຼັບດາບ (`cycleEquippedWeaponUseCase`). React ສະແດງ badge ອາວຸດໃນ HUD.
- **ການຟັນ**: `Player.triggerSlashVfx(weaponId)` ຫຼິ້ນ anim attack + sprite `slash-wood/iron/crystal` (144×48, 3 ເຟຣມ).
- **ການ Strike node**: `InteractionController.harvest` → `harvestResourceNodeUseCase` (ກວດວ່າມີເຄື່ອງມືໂດຍ `itemId.startsWith(requiredTool)`) → `Player.swingToolToward(x)` (ທ່າ attack ບໍ່ມີ VFX).
- **ສ້ອມປະຕູ**: ຕ້ອງມີຄ້ອນ (`RepairBrokenGateUseCase`).
- **ໄອເທັມ**: `items.json` ມີ `iconImage` 32×32 (ຮູບໄອຄອນແບບອຽງ ສຳລັບ UI) ຂອງ `wooden-sword`, `iron-sword`, `crystal-sword`, `axe-t1`, `pickaxe-t1`, `hammer-t1`.
- **Art brief** (`docs/art-direction-brief.md`): pixel art 1:1, outline 1px `#0f172a`, palette "Cyber-Village 32", ແສງຈາກຊ້າຍເທິງ, ຂະໜາດເປັນຜົນຄູນ 4px, PNG RGBA ໂປ່ງໃສ, ກວດດ້ວຍ `asset_report.py`, ບັນທຶກໃນ `docs/asset-manifest.json`.

## ແນວທາງ (Approach)

### ເລືອກ "ຊິ້ນສ່ວນແຍກຕິດມື" (paper-doll overlay) ບໍ່ແຕ້ມອາວຸດລົງໃນ skin

| ທາງເລືອກ | ຂໍ້ດີ | ຂໍ້ເສຍ |
|---|---|---|
| ແຕ້ມອາວຸດລົງທຸກ skin sheet | ພາບລະອຽດທີ່ສຸດ | 4 skin × (3 ດາບ + 3 ເຄື່ອງມື + ມືເປົ່າ) = 28 sheet, ທຸກ skin/ອາວຸດໃໝ່ຄູນກັນ |
| **sprite ອາວຸດແຍກ ຕິດທີ່ຕຳແໜ່ງມືຕໍ່ເຟຣມ** ✅ | ອາວຸດ 1 ຮູບໃຊ້ໄດ້ທຸກ skin; ເພີ່ມອາວຸດ = 1 PNG | ຕ້ອງຕັ້ງຕຳແໜ່ງມື 16 ເຟຣມ; ການໝຸນ pixel art ອາດແຕກເປັນຂັ້ນ |

### ສ່ວນປະກອບ

1. **Domain: ກົດ "ຖືຫຍັງຢູ່" (Held item)** — ຟັງຊັນບໍລິສຸດ, ມີ test:
   - ໝູ່ບ້ານ → `null` (ມືເປົ່າ)
   - ໃນ Stage → ດາບທີ່ໃສ່ຢູ່ (`equippedWeaponId`)
   - ກຳລັງໃຊ້ເຄື່ອງມື (Strike node, ສ້ອມປະຕູ) → ເຄື່ອງມືທີ່ກົງກັບ `requiredTool` ທີ່ມີໃນກະເປົາ (ລະດັບສູງສຸດກ່ອນ)
   - ຍ້າຍການຫາເຄື່ອງມື (`startsWith`) ຈາກ `HarvestResourceNodeUseCase` ໄປເປັນຟັງຊັນກາງ `findTool(backpack, requiredTool)` ໃຫ້ທັງການເກັບ, ການສ້ອມປະຕູ ແລະ Held item ໃຊ້ຮ່ວມກັນ.
   - ເພີ່ມຄຳສັບ **Held item** ໃນ `CONTEXT.md`.
2. **ຂໍ້ມູນ (JSON, ມີ validator)**:
   - `public/data/hand-anchors.json`: 16 ແຖວ ຕໍ່ເຟຣມ `{ x, y, angle, front }` = ຕຳແໜ່ງກຳປັ້ນເທິງເຟຣມ 32×48 (ນັບຈາກມຸມຊ້າຍເທິງ), ມຸມທີ່ອາວຸດຊີ້ (0 = ຊີ້ຂຶ້ນ), ແລະແຕ້ມທາງໜ້າ/ຫຼັງຕົວ. ເຟຣມ attack 12–14 ມີມຸມເປັນການຟັນ (ເຊັ່ນ −70° → 10° → 70°) ຈຶ່ງໄດ້ການແກວ່ງດາບໂດຍບໍ່ຕ້ອງມີ tween. ມີ `overrides` ຕໍ່ skin ຖ້າ skin ໃດມືຢູ່ຕ່າງ.
   - `items.json` ເພີ່ມ `held: { image, gripX, gripY }` ໃຫ້ອາວຸດ/ເຄື່ອງມື (ຮູບໃນມື ແລະຈຸດທີ່ກຳປັ້ນຈັບ). ບໍ່ມີ `image` = ໃຊ້ placeholder.
3. **Phaser: `HeldItemSprite`** (`infrastructure/phaser/objects/`):
   - sprite ດຽວຕິດກັບ Player; ທຸກເຟຣມອ່ານເລກເຟຣມ anim ປັດຈຸບັນ → anchor → ຕັ້ງ x/y (ກັບດ້ານເມື່ອ `flipX`), ມຸມ, `flipX`, depth (ໜ້າ = 10.5 / ຫຼັງ = 9.5), `setOrigin(gripX/w, gripY/h)`.
   - placeholder: ແຕ້ມ texture `held-<itemId>` ດ້ວຍ `Graphics` ເມື່ອບໍ່ມີ PNG (ຄືຂອງ skin/enemy ທີ່ມີ fallback ຢູ່ແລ້ວ).
   - debug (F2 ທີ່ມີຢູ່): ແຕ້ມຈຸດ anchor ສີແດງ ໃຊ້ຕັ້ງຄ່າ.
4. **ຕໍ່ເຂົ້າ scene**: `Game` ບອກ HeldItemSprite ວ່າຢູ່ໝູ່ບ້ານ/ດ່ານ; `weapon-changed` (Q, Forge) → ປ່ຽນ texture; `InteractionController.harvest` ແລະການສ້ອມປະຕູ → ຖືເຄື່ອງມື ~600 ms ແລ້ວກັບເປັນດາບ; ການຟັນ (J/Z) ໃຊ້ anchor ຂອງເຟຣມ attack + slash VFX ເດີມ. **Hitbox/damage ບໍ່ປ່ຽນ** (ຍັງໃຊ້ `range` ໃນ `WEAPON_CONFIGS`): ອັນນີ້ເປັນພາບເທົ່ານັ້ນ.

### Spec ຂອງ Assets (ໃຫ້ຊ່າງ ຫຼື AI art pipeline)

**A. ຮູບອາວຸດ/ເຄື່ອງມືໃນມື (ໃໝ່) — 6 ໄຟລ໌**

| ໄຟລ໌ | ຂະໜາດຮູບໃນຜ້າໃບ (ປະມານ) |
|---|---|
| `public/assets/held/wooden-sword.png` | ຍາວ ~22 px, ໃບກວ້າງ 4 px, ດ້າມ 6 px |
| `public/assets/held/iron-sword.png` | ຍາວ ~24 px, ໃບເຫຼັກ, ກົ້ງດາບ 8 px |
| `public/assets/held/crystal-sword.png` | ຍາວ ~26 px, ໃບຜລຶກສີມ່ວງ/ຟ້າ |
| `public/assets/held/axe-t1.png` | ດ້າມ ~20 px, ຫົວຂວານ 10×8 px |
| `public/assets/held/pickaxe-t1.png` | ດ້າມ ~20 px, ຫົວຈົກ 18×6 px |
| `public/assets/held/hammer-t1.png` | ດ້າມ ~18 px, ຫົວຄ້ອນ 12×8 px |

ກົດທີ່ທຸກໄຟລ໌ຕ້ອງເຮັດຕາມ:
- **ຜ້າໃບ 32×32 PNG RGBA**, ພື້ນໂປ່ງໃສ (alpha 0), pixel art 1:1 ກັບຕົວລະຄອນ (ຕົວລະຄອນສູງ 48 px ຈຶ່ງດາບຍາວ ~½ ຕົວ). **ບໍ່ຂະຫຍາຍ/ຫຍໍ້** ໃນເກມ.
- **ຊີ້ຂຶ້ນຊື່ໆ**: ໃບ/ຫົວຢູ່ເທິງ, ດ້າມຢູ່ລຸ່ມ, ກາງແນວຕັ້ງ x = 16. ເກມເປັນຜູ້ໝຸນເອງ.
- **ຈຸດຈັບ (grip) ທີ່ (16, 26)** ທຸກໄຟລ໌ = ກາງດ້າມບ່ອນກຳປັ້ນຈັບ; ຖ້າຕ່າງໃຫ້ບອກ `gripX/gripY` ໃນ `items.json`.
- outline 1px `#0f172a`, palette Cyber-Village 32 (ໄມ້ `#78350f/#b45309`, ເຫຼັກ `#64748b/#94a3b8/#e2e8f0`, ຜລຶກ `#6d28d9/#a855f7/#a5f3fc`), ແສງຈາກຊ້າຍເທິງ, **ບໍ່ມີ pixel ໂປ່ງໃສເຄິ່ງ** (ການໝຸນແບບ nearest ຈະເຮັດໃຫ້ຂອບມົວເປັນຂີ້ຝຸ່ນ).
- ຮູບດຽວຕໍ່ໄອເທັມ (ບໍ່ມີ animation). ດາບ +1..+3 ບໍ່ຕ້ອງມີຮູບໃໝ່: ເກມເພີ່ມແສງເອງ (tint/glow) ພາຍຫຼັງຖ້າຕ້ອງການ.
- ບໍ່ໃຊ້ໄອຄອນ UI ເດີມແທນ: ໄອຄອນອຽງ 45° ແລະມີຂອບ/ພື້ນສຳລັບ UI ເຊິ່ງໝຸນແລ້ວຜິດທິດ.

**B. ແກ້ skin sheets ເດີມ (4 ໄຟລ໌)**
- ລຶບຂີດສີຂາວທີ່ແຕ້ມໃນມືເຟຣມ 13 (attack) ຂອງທັງ 4 skin ເພື່ອບໍ່ໃຫ້ຊ້ອນກັບດາບ.
- ທຸກເຟຣມ: ມືໜ້າຕ້ອງເປັນກຳປັ້ນ 2–3 px ທີ່ເຫັນຊັດ (ບ່ອນທີ່ anchor ຈະວາງດາບ). ຫ້າມປ່ຽນຂະໜາດເຟຣມ, ລຳດັບເຟຣມ ຫຼືຕຳແໜ່ງຕີນ.

**C. ການກວດ ແລະບັນທຶກ**
- ແລ່ນ `asset_report.py --require-alpha` ຜ່ານ 0 ບັນຫາ; ເພີ່ມທຸກໄຟລ໌ໃນ `docs/asset-manifest.json`.
- ຂ້ອຍຈະສ້າງ contact sheet (ທຸກ skin × 16 ເຟຣມ × 6 ໄອເທັມ) ໃຫ້ກວດວ່າຕິດມືພໍດີ.

## ຂັ້ນຕອນ (Steps)

1. **Domain (TDD)**: `findTool(backpack, requiredTool)` + ໃຊ້ໃນ harvest/repair use case; ກົດ `heldItemFor({ location, equippedWeaponId, activeToolId })`; test; ຄຳສັບ Held item ໃນ `CONTEXT.md`.
2. **ຂໍ້ມູນ**: `hand-anchors.json` (ຄ່າເລີ່ມຕົ້ນຈາກການວັດກຳປັ້ນໃນ sheet cyber-blue), `held` ໃນ `items.json`, validator ໃນ `ContentCatalog` + test (ຕ້ອງມີ 16 ເຟຣມ, grip ຢູ່ໃນຜ້າໃບ, ມຸມ −180..180).
3. **Placeholder**: ແຕ້ມ 6 texture `held-<id>` ດ້ວຍ Graphics ຕາມ spec ຂ້າງເທິງ (ຂະໜາດ/ສີດຽວກັນ) ໃຫ້ລະບົບເຮັດວຽກໄດ້ທັນທີ.
4. **`HeldItemSprite`** + ຕໍ່ໃສ່ `Player` (ເຟຣມ → anchor, flip, depth) ແລະ `Game` (ໝູ່ບ້ານ/ດ່ານ, `weapon-changed`); debug anchor ໃນ F2.
5. **ເຄື່ອງມືອັດຕະໂນມັດ**: `InteractionController.harvest` ແລະການສ້ອມປະຕູເອີ້ນ "ຖືເຄື່ອງມື X ~600 ms".
6. **ຕັ້ງ anchor**: script ສ້າງ contact sheet (skin × ເຟຣມ × ໄອເທັມ) ຈາກ headless browser; ປັບ `hand-anchors.json` ຈົນພໍດີທຸກ skin.
7. **e2e** `held_item.spec.ts`: ໝູ່ບ້ານບໍ່ມີ held item; ໃນດ່ານເຫັນ `held-wooden-sword`; `Q` ປ່ຽນເປັນດາບເຫຼັກ (ຖ້າມີ); `E` ໃສ່ຕົ້ນໄມ້ → `held-axe-t1` ແລ້ວກັບເປັນດາບ; ກັບດ້ານເມື່ອຫັນຊ້າຍ; screenshot 3 ຂະໜາດ.
8. **Spec assets → ຜະລິດ PNG** (ຊ່າງ/AI) ຕາມຂໍ້ A–C; ວາງໄຟລ໌, ເພີ່ມ `held.image` ໃນ `items.json`, ກວດ contact sheet ອີກຄັ້ງ.
9. **ເອກະສານ**: GDD (ຕົວລະຄອນຖືດາບ/ເຄື່ອງມື), how-to-play, `CLAUDE.md` (HeldItemSprite, hand-anchors.json), `art-direction-brief.md` (ໝວດ `public/assets/held/`), ແຜນນີ້ + `HISTORY.md`.

## Files ທີ່ຈະຖືກກະທົບ

- `src/domain/entities/HeldItem.ts` (+ `.test.ts`) — ໃໝ່: ກົດຖືຫຍັງ ແລະ `findTool`
- `src/application/HarvestResourceNodeUseCase.ts`, `RepairBrokenGateUseCase.ts` — ໃຊ້ `findTool` ກາງ
- `CONTEXT.md` — ຄຳສັບ Held item
- `public/data/hand-anchors.json` — ໃໝ່: ຕຳແໜ່ງມື 16 ເຟຣມ
- `public/data/items.json` — `held` ຂອງອາວຸດ 3 + ເຄື່ອງມື 3
- `src/infrastructure/content/ContentCatalog.ts` (+ test) — parser/validator ຂອງ 2 ຢ່າງຂ້າງເທິງ
- `src/infrastructure/phaser/objects/HeldItemSprite.ts` — ໃໝ່
- `src/infrastructure/phaser/objects/Player.ts` — ສົ່ງເລກເຟຣມ/flip ໃຫ້ held sprite; `swingToolToward` ຮັບ itemId
- `src/infrastructure/phaser/scenes/Game.ts`, `Preloader.ts` — ສ້າງ held sprite, ໂຫຼດ `held.image`, ຟັງ `weapon-changed`
- `src/infrastructure/phaser/controllers/InteractionController.ts` — ຖືເຄື່ອງມືຕອນ Strike/ສ້ອມປະຕູ
- `public/assets/held/*.png` (6 ໃໝ່), `public/assets/characters/player-skin-*.png` (ແກ້ເຟຣມ 13)
- `e2e/held_item.spec.ts` — ໃໝ່
- `docs/asset-manifest.json`, `docs/art-direction-brief.md`, GDD, `docs/how-to-play.md`, `CLAUDE.md`

## ຄວາມສ່ຽງ / ຄຳຖາມທີ່ຍັງເປີດ (Risks / Open Questions)

- **ໝຸນ pixel art ແລ້ວແຕກ**: ການໝຸນມຸມແປກ (ເຊັ່ນ 17°) ເຮັດໃຫ້ຂອບເປັນຂັ້ນ. ແກ້: ຈຳກັດມຸມໃນ anchor ໃຫ້ເປັນຂັ້ນ 15° ຫຼື 45°; ຖ້າຍັງບໍ່ງາມ ຂັ້ນຕໍ່ໄປຄືໃຫ້ຊ່າງແຕ້ມ 3 ທ່າ (ຊີ້ຂຶ້ນ, 45°, ນອນ) ເປັນ sheet ນ້ອຍ.
- **skin ຕ່າງກັນ 2–12%**: ຖ້າມື skin ໃດບໍ່ກົງ ໃຊ້ `overrides` ໃນ `hand-anchors.json` ແທນທີ່ຈະແກ້ຮູບ.
- **ຂີດຂາວໃນເຟຣມ 13**: ຖ້າບໍ່ລຶບ ຈະເຫັນ "ສອງອາວຸດ" ຕອນຟັນ; ຕ້ອງແກ້ກ່ອນ ຫຼືພ້ອມກັບຂັ້ນ 8.
- **ໜ້າຮ້ານ Mina** (CSS preview) ບໍ່ສະແດງອາວຸດໃນມື: ນອກຂອບເຂດແຜນນີ້ (ຮ້ານຂາຍ Skin ເທົ່ານັ້ນ).
- **ພາບບໍ່ກົງກັບ hitbox**: ດາບຍາວໃນພາບອາດບໍ່ເທົ່າ `range` ຂອງ `WEAPON_CONFIGS`; ຂະໜາດໃນ spec ເລືອກໃຫ້ໃກ້ຄຽງ (range 48–56 px ວັດຈາກຕົວ) ແຕ່ຈະບໍ່ປ່ຽນກົດການສູ້.
- **ເຟຣມ wall-slide (15)**: ອາດເຊື່ອງອາວຸດ (`front: false`) ຫຼືເກັບໄວ້ຫຼັງ; ຕັດສິນຕອນຕັ້ງ anchor ຈາກ contact sheet.
