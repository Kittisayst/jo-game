# ຮ້ານ Skin ກັບ NPC Mina ໃນໝູ່ບ້ານ

- **Date:** 2026-10-29
- **Status:** done (code, tests, screenshots); not yet merged
- **Project:** jo-game (ພະຈົນໄພຄວາມຮູ້ / Knowledge Quest)

## ເປົ້າໝາຍ (Goal)

ຊື້ ແລະປ່ຽນ Skin ໄດ້ແຕ່ທີ່ **NPC Mina** ໃນ Village Hub ເທົ່ານັ້ນ (ບໍ່ແມ່ນຈາກເມນູໜ້າເລີ່ມ/ເມນູພັກ) ແລະປັບໜ້າຮ້ານໃຫ້ສວຍຂຶ້ນ. ຜົນຂອງການ grill ຮອບ 1–2 ຢູ່ລຸ່ມນີ້; ຄຳສັບຢູ່ໃນ `CONTEXT.md` (Skin, Skin shop) ແລ້ວ.

## ສິ່ງທີ່ຕົກລົງແລ້ວ

1. ຮ້ານຂາຍ **ສະເພາະ Skin** ດ້ວຍ Credit (ບໍ່ຂາຍຢາ/ໄອເທັມ) ເພື່ອຮັກສາກົດ "Credit ມາຈາກການຮຽນ" (ADR 0005).
2. NPC **Mina** ຢືນຢູ່ແຖວຕະຫຼາດນ້ອຍ x≈1290 (ລະຫວ່າງໂຮງຕີເຫຼັກ 1140 ກັບປະຕູມິຕິ 1420); ບໍ່ເພີ່ມອາຄານ.
3. **ລຶບ** ປຸ່ມ "ຮ້ານຊຸດ (Skins)" ອອກຈາກເມນູໜ້າເລີ່ມ ແລະເມນູພັກ; ເປີດຮ້ານໄດ້ແຕ່ຈາກ Mina ແລະບັງຄັບໃນໂຄດ (ບໍ່ແມ່ນແຕ່ຊ່ອນປຸ່ມ).
4. ກົດ `E` ໃກ້ Mina → ບົດສົນທະນາສັ້ນ → ເລືອກ "👗 ເບິ່ງຊຸດ" ຈຶ່ງເປີດຮ້ານ ("👋 ໄວ້ກ່ອນ" ປິດທັນທີ).
5. ໜ້າຮ້ານ: ພາບຕົວລະຄອນຈິງ (spritesheet), try-on, ສະແດງ Credit ທີ່ເຫຼືອ + ເຫດຜົນຊື້ບໍ່ໄດ້, layout 2 ຝັ່ງ ເລືອກດ້ວຍ ↑↓/Enter, ສີທອງ/ມ່ວງຄືໜ້າເລີ່ມ.
6. **try-on ສະແດງສະເພາະພາບໃນໜ້າຮ້ານ**: ຕົວລະຄອນໃນເກມບໍ່ປ່ຽນ ແລະບໍ່ບັນທຶກຫຍັງຈົນກວ່າຈະກົດ "ໃສ່" ແທ້.
7. ບົດສົນທະນາ Mina: "ຍິນດີຕ້ອນຮັບ! ຊຸດໃໝ່ຊ່ວຍໃຫ້ເຈົ້າເດັ່ນໃນການເດີນທາງ ແຕ່ຈ່າຍດ້ວຍ Credit ທີ່ໄດ້ຈາກການຮຽນເທົ່ານັ້ນນະ." ຖ້າຍັງບໍ່ໄດ້ຊື້ປຶ້ມບົດ 1 ເພີ່ມ "ເກັບ 20 Credit ໄວ້ຊື້ປຶ້ມຕຳລາກ່ອນນະ."
8. ຜູ້ເຖົ້າເພີ່ມຕົວເລືອກ "👗 ມີບ່ອນປ່ຽນຊຸດບໍ?" (ບອກວ່າ Mina ຢູ່ທາງຂວາໃກ້ປະຕູມິຕິ). ຂໍ້ຄວາມຕ້ອນຮັບທີ່ເວົ້າເຖິງ "NPC Mina" ຈະກາຍເປັນຄວາມຈິງໂດຍບໍ່ຕ້ອງແກ້.
9. ບໍ່ເພີ່ມບ່ອນສະແດງ skin ນອກໜ້າຮ້ານ/ຕົວລະຄອນ. save ເກົ່າທີ່ໃສ່ skin ຢູ່ແລ້ວ ໃສ່ຕໍ່ໄດ້.

## Context ປັດຈຸບັນ (ຈາກການອ່ານໂຄດ)

- `SkinModal` (97 ແຖວ) ເປີດຈາກ `TitleMenu` ແລະ `PauseMenuModal` ຜ່ານ `useSkinShop.openSkinModal`.
- NPC ຢູ່ໃນ scene ມີແຕ່ຜູ້ເຖົ້າ (`Game.elderNpc`); `InteractionController` ຮູ້ຈັກ NPC ໂຕດຽວ (`interactables.elderNpc`).
- `NPC.ts` ມີ texture ສ້າງຈາກໂຄດ `npc-merchant` (ເສື້ອມ່ວງ + ຜ້າພັນຄໍທອງ ຂອງ "Merchant Mina") ຄ້າງຢູ່ ໃຊ້ຕໍ່ໄດ້.
- `useDialogue` ຮູ້ຈັກແຕ່ graph `village_elder`; `DialogueGraph` ມີ `if` ໃນຕົວເລືອກ ແຕ່ບໍ່ມີທາງບອກ "ເມື່ອຈົບໃຫ້ເຮັດ action".

## ຂັ້ນຕອນ (Steps)

ເຮັດໃນກິ່ງໃໝ່ `feat/skin-shop-npc`.

1. **Domain (TDD):** ເພີ່ມ `action?: string` ໃຫ້ `DialogueNode` ໃນ `Dialogue.ts` (ເຊັ່ນ `'open-skin-shop'`) ແລະ API ໃຫ້ຜູ້ເອີ້ນຮູ້ວ່າ node ປັດຈຸບັນມີ action. ເພີ່ມ test ໃນ `AdvanceDialogueUseCase.test.ts`/`Dialogue.test.ts`.
2. **ບົດສົນທະນາ:** `infrastructure/dialogue/skinShopDialogue.ts` ສ້າງ graph ຈາກຄ່າ `hasBoughtFirstBook` (ສອງ variant ຂອງ line); ເພີ່ມຕົວເລືອກ "ມີບ່ອນປ່ຽນຊຸດບໍ?" ໃນ `villageElderDialogue.ts`. test ກວດວ່າ variant ຖືກຕ້ອງ (ເພາະເປັນ pure function ຈຶ່ງຈັດໄວ້ໃຕ້ `src/infrastructure/content/` ຫຼືໃຫ້ builder ເປັນ domain ຖ້າບໍ່ມີ import ຂອງ infra).
3. **NPC ໃນ scene:** ໃນ `Game.create` ເຂດໝູ່ບ້ານ ສ້າງ `NPC` Mina (texture `npc-merchant`, ປ້າຍ "🛍️ [E] ລົມກັບ Mina") ທີ່ x≈1290; ແກ້ `InteractionController` ຈາກ `elderNpc` ໂຕດຽວເປັນລາຍການ NPC ພ້ອມ prompt/ການກະທຳຂອງແຕ່ລະໂຕ; `onInteract` ສົ່ງ `start-dialogue` ດ້ວຍ graph id `skin_shop`.
4. **React:** `useDialogue` ຮັບ graph ຫຼາຍອັນ (registry ຕາມ id) ແລະເມື່ອຮອດ node ທີ່ມີ `action: 'open-skin-shop'` ໃຫ້ປິດ dialogue ແລະເອີ້ນ `openSkinModal`. `useSkinShop.openSkinModal` ຢອມແຕ່ເມື່ອ `currentLevel === 'village'` (ບັງຄັບໃນໂຄດ).
5. **ລຶບທາງເຂົ້າເກົ່າ:** ເອົາ item `menu-skins-btn` ອອກຈາກ `TitleMenu.tsx` (ແລະ prop `onOpenSkinModal`), ເອົາປຸ່ມອອກຈາກ `PauseMenuModal.tsx`, ແກ້ `App.tsx`.
6. **ໜ້າຮ້ານໃໝ່:** ຂຽນ `SkinModal.tsx` ໃໝ່ (layout 2 ຝັ່ງ, ລາຍການຊ້າຍ ເລືອກດ້ວຍ ↑↓/Enter ແລະເມົາສ໌; ຂວາ = ພາບໃຫຍ່ + ລາຍລະອຽດ + ປຸ່ມ ຊື້/ໃສ່; Esc ປິດ). ພາບຕົວລະຄອນຈາກ `assets/characters/player-skin-*.png` (ເຟຣມ 32×48) ເຄື່ອນໄຫວດ້ວຍ CSS sprite. state `previewSkinId` ຢູ່ໃນ modal ເທົ່ານັ້ນ. ສະແດງ Credit ປັດຈຸບັນ → ຫຼັງຊື້ ແລະເຫດຜົນຊື້ບໍ່ໄດ້ (ບໍ່ພໍ / ກັນ 20 ໄວ້ຊື້ປຶ້ມ ເຊິ່ງມີໃນ `PurchaseSkinUseCase` ແລ້ວ). CSS ສີທອງ/ມ່ວງໃນ `public/style.css` (ແທນ `.skin-*` ເກົ່າ).
7. **e2e:** ແກ້ `title_and_village.spec.ts` (ບໍ່ມີ `#menu-skins-btn` ແລະບໍ່ມີປຸ່ມ Skins ໃນເມນູພັກ); spec ໃໝ່ `skin_shop.spec.ts`: ຍ່າງຫາ Mina → `E` → ເລືອກ "ເບິ່ງຊຸດ" → ເຫັນຮ້ານ → try-on ບໍ່ປ່ຽນ skin ທີ່ໃສ່ ແລະບໍ່ເສຍ Credit → ຊື້ບໍ່ໄດ້ເມື່ອ Credit ເຫຼືອ 20 (ມີຂໍ້ຄວາມເຫດຜົນ) → ຕັ້ງ Credit ພໍ ຊື້ ແລະໃສ່ ແລະຕົວລະຄອນໃນເກມປ່ຽນ ແລະ save ມີ skin ນັ້ນ. ເບິ່ງ screenshot ຢ່າງໜ້ອຍ 2 ຂະໜາດ.
8. **ເອກະສານ:** `CONTEXT.md` (ແກ້ແລ້ວ), GDD (ລາຍຊື່ NPC/ຮ້ານ ແລະແຖວ Skin ວ່າຊື້ທີ່ Mina), `CLAUDE.md` (ຮ້ານ Skin ເປີດຈາກ NPC), `docs/how-to-play.md` (ບອກວ່າໄປຫາ Mina), ແຜນນີ້ + `HISTORY.md`.

## Files ທີ່ຈະຖືກກະທົບ

- `src/domain/entities/Dialogue.ts` (+test), `src/application/AdvanceDialogueUseCase.ts` (ຖ້າຕ້ອງສະແດງ action).
- `src/infrastructure/dialogue/skinShopDialogue.ts` (ໃໝ່), `villageElderDialogue.ts`.
- `src/infrastructure/phaser/scenes/Game.ts`, `controllers/InteractionController.ts`, `objects/NPC.ts` (ຖ້າຕ້ອງແກ້ prompt).
- `src/infrastructure/react/App.tsx`, `hooks/useDialogue.ts`, `hooks/useSkinShop.ts`, `components/SkinModal.tsx`, `TitleMenu.tsx`, `PauseMenuModal.tsx`, `public/style.css`.
- `e2e/title_and_village.spec.ts`, `e2e/skin_shop.spec.ts` (ໃໝ່).
- ເອກະສານ: `CONTEXT.md`, GDD, `CLAUDE.md`, `docs/how-to-play.md`.

## ຄວາມສ່ຽງ / ຄຳຖາມທີ່ຍັງເປີດ (Risks / Open Questions)

- **ຕົວລະຄອນໃນຮ້ານ**: ຕ້ອງເບິ່ງວ່າ spritesheet ຂອງ skin ແຕ່ລະອັນຈັດເຟຣມແນວໃດ (idle/ຍ່າງ) ກ່ອນເຮັດ CSS sprite; ຖ້າບໍ່ຕົງກັນໃຊ້ເຟຣມດຽວຄ້າງ.
- **ພາບ Mina** ເປັນຮູບສີ່ຫຼ່ຽມສ້າງຈາກໂຄດຄືຜູ້ເຖົ້າ (ບໍ່ມີ sprite ແທ້); ເຫັນໄດ້ແຕ່ຢາບ.
- **ວັດ Mina ຢູ່ x≈1290** ອາດຊ້ອນກັບປ້າຍອາຄານ/ປະຕູມິຕິ (1420); ຕ້ອງເບິ່ງຕາ ແລະປັບ.
- **ບົດສົນທະນາ + action** ເພີ່ມ concept ໃໝ່ໃຫ້ `DialogueGraph` (`action`); ຕ້ອງບໍ່ເຮັດໃຫ້ບົດສົນທະນາຜູ້ເຖົ້າເສຍ.
- ການບັງຄັບ "ເປີດໄດ້ແຕ່ໃນໝູ່ບ້ານ" ເປັນກົດຂອງ UI ບໍ່ແມ່ນ domain (ເພາະ domain ບໍ່ຮູ້ຈັກສະຖານທີ່); ຖ້າຕ້ອງການໃຫ້ແໜ້ນຂຶ້ນຄ່ອຍຍ້າຍເປັນ use case.
- ລາຄາ Skin 40/80/120 ຍັງເປັນຄ່າຊົ່ວຄາວ (ບໍ່ປ່ຽນໃນແຜນນີ້).
