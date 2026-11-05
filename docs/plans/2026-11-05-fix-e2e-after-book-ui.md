# Fix the 15 failing e2e specs after the Book UI, touch controls and double-jump changes

- **Date:** 2026-11-05
- **Status:** done (PR open). Stage 7 was the e2e bot, not the level: it never pressed Jump to climb after the new ledge grab (fixed in bot.ts). Full e2e: 157 passed, 1 skipped.
- **Project:** jo-game (Knowledge Quest)

## ເປົ້າໝາຍ (Goal)

Full `npm run test:e2e` on `main` (c627a6d) gave 142 passed, 15 failed, 1 skipped. tsc, lint and Vitest (721) are green. Make the e2e suite green again, fix the one real markup bug, find out whether Stage 7 is really blocked, and bring the docs in line with what was built.

## Context ປັດຈຸບັນ

Read from the failure reports in `test-results/*/error-context.md` and the code:

**A. Real bug: duplicate `data-testid`** (shop, garden_storage)
`BookFrame.tsx:83` puts `data-testid={dataTestId}` on the overlay and `:87` puts `data-testid={windowTestId || dataTestId}` on the window, so every window that passes only `dataTestId` has the id twice. `ShopModal` (`dataTestId="shop-modal"`) and `StorageModal` (both props, same value) fail with Playwright "strict mode violation: resolved to 2 elements". `mobile_layout.spec.ts` may rely on a testid on the window to measure it, so check before removing it.

**B. Old locators for the removed header** (9 specs)
The Book UI removed the `<h2>` header, so `h2:has-text(...)` or a title text finds nothing: `smithy` ("Smithy"), `knowledge_quest` (Library title), `playtest_realms` and `audit_ui` ("ກະເປົາເດີນທາງ"), `dungeon_extensions_1_to_4` ("ໂຮງຊ່າງ"), `quest_and_buff_hud` and `stage1_full_walkthrough` ("ກະດານພາລະກິດແຫ່ງປັນຍາ"), `shortcuts` (`text=(Backpack)`), `features_3_and_4` (a button named /ອັບເກຣດ/: the tab is now `role=tab`, not `button`). The windows still open (the smithy snapshot shows the tabs and recipes), so the specs should use `data-testid` (`smithy-tab-*`, `shop-tab-*`, `academy-tab-*` exist already) instead of visible titles.

**C. Design changed on purpose** (2 specs)
- `double_jump.spec.ts:36`: expects the double jump to be locked first; `MovementAbilities` and `SaveData` now give `double-jump` from the start (commit c627a6d, "starting double jump"). The spec's "locked" half is obsolete. `CLAUDE.md` and `skills.json` `movement.unlocks` still say it comes after the Stage 30 Boss.
- `windows.spec.ts`: a selected Backpack slot is now amber `rgb(245,158,11)`, the spec expects cyan `rgb(34,211,238)`.

**D. Unknown: Stage 7 cannot be walked to its exit** (`generated_stages`)
`walkOutOfStage` (`e2e/helpers/stage.ts:58`) calls `bot.goTo(exitX + 55)` for 90 s and the question never opens; the HUD in the snapshot shows 40 % stage progress. Two explanations: (1) the e2e `Bot` (`e2e/helpers/bot.ts`, last touched before the hero redesign) does not fit the new camera zoom 1.75x, ledge grab or double jump, so it gets stuck; (2) the hero really cannot pass something in Stage 7 (a generated platform, a pit, a secret ledge). Other generated-stage specs that passed (e.g. other Stages) point to (1) but this is not proven.

**E. Unknown: `expansion_systems`**
`locator.click` timed out after 120 s. The snapshot was not read yet; possibly an element is covered by the new touch buttons/overlay or the modal moved.

**F. Docs out of date**
`CLAUDE.md` says "there is no Tailwind" and describes the old windows, but `tailwind.css`, `@tailwindcss/vite` and `book/BookFrame.tsx` now exist. `StyleClasses.test.ts` still passes.

## ແນວທາງ (Approach)

Fix real behaviour first, then the specs, then the docs. Specs are updated to use `data-testid` hooks, not translated titles, so the next UI change does not break them again. A spec's intent is kept: only its way of finding the window changes. Nothing is deleted just to make the run green.

## ຂັ້ນຕອນ (Steps)

1. **Stage 7 first (diagnose, no code change yet).** Run `npx playwright test e2e/generated_stages.spec.ts -g "Stage 7"` headed or with a trace; log the hero x and the bot state every second to see where it stops. Replay the same Stage 7 by hand with `?stage=7` at 915×412 and desktop. Decide: bot problem (go to step 6) or level problem (fix the generator seed/platform, with a `LevelReachability` test).
2. **Duplicate testid.** In `BookFrame.tsx` give the window only `windowTestId` (no fallback to `dataTestId`); in `StorageModal` drop the duplicate `windowTestId`. Grep `e2e/` for specs that query the window by that id (`mobile_layout`, `windows`, `storage`, `shop`) and give them a distinct id (`shop-window`, `storage-window`) if they need the inner element.
3. **Header locators (group B).** Replace each `h2:has-text(...)` / `text=...` / `getByRole('button', {name})` with the window's `data-testid` or `getByRole('tab', ...)`. Add a testid to a window that has none (Backpack, Library, Quest Board, Smithy overlay) in the same `dataTestId` pattern. Run each spec on its own.
4. **Design changes (group C).** `double_jump.spec.ts`: keep one test that the second press lifts the hero higher; replace the "locked" half with a check that a new game starts with `double-jump` (or remove the half and say why). Update `skills.json` `movement.unlocks` if it still lists `double-jump`, and `MovementUnlockUseCases.test.ts` already matches the code. `windows.spec.ts`: expect the amber colour, with a comment saying the Book UI uses amber for a selected slot.
5. **expansion_systems.** Read its `error-context.md` and screenshot, find which locator timed out, fix the same way as step 3, or report a new bug if something covers the element.
6. **If Stage 7 was the bot:** update `e2e/helpers/bot.ts` for the new zoom/jump (use the dash or double jump when stuck against a step, re-aim after a ledge grab). Check that Stages 2–6 and 8–10 still pass; if the level was the problem, fix that instead and leave the bot alone.
7. **Docs.** `CLAUDE.md`: Styling section (Tailwind v4 is now loaded next to the hand-written `style.css`; which one wins; the Book UI `BookFrame` and its testid props), the double jump is a starting ability, the phone-window paragraph for the Book UI. `README` only if it mentions Tailwind or the unlock.
8. **Verify.** `npx tsc --noEmit`, `npm run lint`, `npm run test` (read the Test Files/Tests lines, not `tail -3`), then the full `npm run test:e2e` on its own (about 8 min). Expect 0 failed. Look at the Shop, Storage and Smithy windows by eye at 915×412 and 1280×720.
9. **PR.** One branch `fix/e2e-book-ui`; open through `gh api repos/Kittisayst/jo-game/pulls`; merge only when the owner says so. List which specs changed and why in the PR body.

## Files ທີ່ຈະຖືກກະທົບ

- `src/infrastructure/react/components/book/BookFrame.tsx` — window testid no longer falls back to the overlay's
- `src/infrastructure/react/components/StorageModal.tsx` — drop the duplicate `windowTestId`
- `src/infrastructure/react/components/{Backpack,Textbook,QuestBoard,Smithy}Modal.tsx` — testids where a spec needs them
- `e2e/{smithy,knowledge_quest,playtest_realms,audit_ui,dungeon_extensions_1_to_4,quest_and_buff_hud,stage1_full_walkthrough,shortcuts,features_3_and_4,expansion_systems,shop,garden_storage,windows,double_jump}.spec.ts` — locators and the two intended-change expectations
- `e2e/helpers/bot.ts` (only if Stage 7 is the bot) or `public/data/stages.json` seed for Stage 7 (only if it is the level)
- `public/data/skills.json` — only if it still lists `double-jump` under `movement.unlocks`
- `CLAUDE.md`, `docs/plans/HISTORY.md`

## ຄວາມສ່ຽງ / ຄຳຖາມທີ່ຍັງເປີດ (Risks / Open Questions)

- **Stage 7 may be a real, player-facing bug**; step 1 decides before anything else. Do not "fix" it by loosening the helper.
- **Double jump from the start** changes game balance: the secret ledges (only the air dash reaches them) may now be reachable by a double jump, which `LevelReachability.test.ts` checks for a plain jump only. The test passes today, but the owner should confirm that a starting double jump is intended, and if so whether secret-ledge heights need a new rule.
- **Tailwind next to the hand-written CSS** can change classes that `style.css` defines with `!important`; the `StyleClasses.test.ts` allowlist may hide classes that now work differently. Look at windows by eye after the fix.
- The e2e suite takes about 8 minutes and is flaky if run next to a build; run it on its own.
- Open question for the owner: should the testid sit on the overlay or on the window card? Plan assumes overlay = `x-modal`, window = `x-window`.
