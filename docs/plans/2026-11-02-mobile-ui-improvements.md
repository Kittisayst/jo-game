# Mobile UI: smaller, clearer, more room for the game

- **Date:** 2026-11-02
- **Status:** M1 and M2 done for 10 windows (Smithy, Shop, Backpack, Academy, Library, World Map, Quest Board, Character, Storage + the small dialogs Waypoint, Gate repair, Garden seed picker); M3–M5 still planned
- **Project:** jo-game (Knowledge Quest)

## Goal

On a phone the UI is too big and gets in the way: windows show one row of content under a tall header, the quest panel and toasts cover the play area, some buttons are too small to hit, and on a narrower phone the HUD grows to three rows. Make the phone layout (landscape first) compact, readable and easy to tap, without changing the desktop look.

## How this was checked

The dev build was opened in Chromium at three phone sizes and every main screen was captured and measured (script output and screenshots in `tools/art/out/mobile-audit/`, not committed):

- **Android landscape 915×412** (close to the owner's phone, 2000×923 px at about 2.2×)
- **Small phone landscape 667×375** (iPhone 8 / SE class)
- **Android portrait 412×915**

Screens: title, village, Stage 2, Backpack, Smithy, Shop, Academy, Library, World Map, Quest Board, dialogue.

## Findings

Numbers are CSS pixels at 915×412 unless said otherwise.

### A. Windows waste the height (biggest problem)

Every window (Backpack, Smithy, Shop, Academy, Library, World Map, Quest Board) keeps its desktop chrome on a 412 px tall screen: a header of 90–150 px (icon, title, a one-line subtitle, padding 24–28 px), a tab row, then a footer. What is left for content is about **180–220 px**, which shows **one row** of recipes, items or quests.

- **Smithy and Shop:** the tab row is cut in half by the content below it (the labels are clipped), so the tabs are hard to read and to hit.
- **Academy:** the tab labels wrap to two lines ("Spaced Repetition (Daily Practice)"), the content starts at about y = 300.
- **Backpack:** the slot grid is cut after one row; the item labels are **9 px**.
- **World Map:** the header and the gate row take the whole screen; the Stage grid starts at the bottom edge. Labels are 11 px.
- The windows are 92% wide but their content is laid out for desktop (two columns of large cards with long descriptions).

### B. The play area is covered

- **Quest tracker** (right side): 186×259 px, **13% of the screen** (19% at 667×375), always open, under the HUD buttons and over the jump button's column. It repeats what the Quest Board shows.
- **Welcome toast** in the village: about 500×75 px in the middle of the screen for 5 s, over the hero's path.
- **Hint row** (tutorial) under the HUD: one more full-width row.
- The game canvas is letterboxed (16:9 in a 20:9 screen): 732 px wide with 91 px black bars left and right. The HUD and touch buttons sit partly on the bars (good) but the top HUD and the quest panel still overlap the canvas.

### C. Touch targets and text

- Too small to hit reliably (under 44 px): **Swap [Q] and Dash buttons 39×38**, the hint ✕ 14×20, the quest panel ↗ 27×26 and − 28×16, the top-right HUD buttons 33 px high (Backpack, Textbooks, Menu).
- Text under 12 px: 7–15 elements per screen (Backpack 9 px, World Map 11 px, HUD labels 10.9 px). Lao text needs more height than Latin to stay readable.
- Emoji are used as icons everywhere (HUD, tabs, buttons). They render differently per phone (the owner's Huawei shows other glyphs) and cannot be tinted. Not a priority to replace all, but the touch buttons and HUD should use the game's own pixel icons.

### D. Narrow phones

At 667×375 the HUD vitals row wraps again: **118 px high, 18% of the screen** (the previous fix only handled 812 px wide). The quest panel then overlaps the welcome toast and the jump button.

### E. Portrait

The game is landscape-only. In portrait everything stacks (HUD 238 px tall, the canvas is a strip in the middle) and the "turn your phone" hint is a small pill. It should be a clear full-screen message instead of a broken layout behind a pill.

### F. What is already fine

Title screen, dialogue box (large, readable, close button 44 px+), the jump / move / attack buttons (62–80 px), HUD vitals at 915 px wide (77 px, two rows), safe-area insets on the HUD corners.

## Approach

Treat "phone" as its own layout tier instead of shrinking desktop windows:

- **One breakpoint for phones in landscape:** `(max-height: 520px)` (already used by the HUD) for height-driven rules, plus `(max-width: 760px)` for the narrow-phone HUD. Write them as CSS tokens (`--ui-gap`, `--ui-pad`, `--ui-header-h`, `--ui-font-s`, `--tap`) set at `:root` and overridden in the phone media query, so components read tokens instead of each window getting its own phone rules.
- **Windows become full-screen sheets on phones:** no outer margin, a 44 px header bar (icon, title, close; the subtitle hidden or moved into a "?" tooltip), tabs as a single scrollable row of 40 px pills, content fills the rest and scrolls, footer folded into the header. One shared CSS class (`.game-window` with `.game-window__header`, `__tabs`, `__body`) that every window adopts, instead of each window's own Tailwind-like utilities.
- **Grids adapt to width:** item/recipe cards go from two big columns to a compact list (icon, name, cost chips, action) on phones; the Backpack grid uses `repeat(auto-fill, minmax(56px, 1fr))` so 7–8 slots fit per row.
- **Less on top of the game:** the quest tracker starts collapsed on phones (a 44 px pill "📜 4" that opens it), toasts move to the top centre under the HUD, shorter and 3 s, the hint row merges into the toast area.
- **Touch:** every control at least 44×44 px (48 for gameplay buttons), 8 px apart; small icons keep their look but get a bigger hit area (padding or `::after`).
- **Text:** at least 12 px everywhere on phones (13 px for Lao body text), line-height 1.4 for Lao.
- **Portrait:** a full-screen "turn your phone sideways" overlay over the game (the game pauses), not a pill.

## Steps

**M1 — Tokens and the phone tier (no visible change on desktop)**
1. Add the `:root` tokens and the phone overrides in `style.css`; a short comment block that lists them.
2. Add `e2e/mobile_layout.spec.ts`: at 915×412 and 667×375 open each window and assert the header ≤ 56 px, content area ≥ 60% of the height, no text under 12 px, no button under 44 px in the window; HUD left cluster ≤ 80 px high at both sizes; nothing outside the viewport. It fails first, then each step makes part of it pass.

**M2 — Windows as phone sheets** (biggest win)
3. Shared `.game-window` structure; move Smithy, Shop and Backpack first (most used), then Academy, Library, Quest Board, World Map, Character, Garden picker, Storage, Gate Repair, Waypoint.
4. Compact card list for recipes, shop items and quests on phones; Backpack grid with 56 px slots and 12 px labels.
5. Tabs: single row, horizontal scroll, 40 px tall pills, never clipped.

**M3 — The play area**
6. Quest tracker collapsed by default on phones (remember the choice), 44 px toggle.
7. Toasts (welcome, rewards, sleep) top-centre under the HUD, max one line on phones, 3 s.
8. HUD at 667 px wide: hide the XP bar track and the time label text (keep the icon + time), so the vitals stay in one row; the hint shortens to one line with "…".

**M4 — Touch and text**
9. Swap and Dash buttons 48 px; top-right HUD buttons 44 px tall; ✕, ↗, − get 44 px hit areas.
10. Minimum font sizes per the tokens; Lao line-height.
11. Touch buttons and HUD icons: replace emoji with the game's pixel icons where an icon already exists (`public/assets/ui`, items), keep emoji only for decoration.

**M5 — Portrait and polish**
12. Full-screen portrait overlay (pauses the game while shown).
13. Check on the owner's phone (Huawei, Chrome, installed shortcut) and at 915×412, 667×375, 1280×720 desktop; update `polish.spec` limits if the new layout changes them on purpose; screenshots before/after in the PR.

## Files affected

- `public/style.css` — tokens, phone tier, `.game-window`, compact cards, quest tracker, toasts, touch sizes, portrait overlay
- `src/infrastructure/react/components/*Modal.tsx` (Smithy, Shop, Backpack, Academy, Library/Textbook, QuestBoard, StageMap, Character, Storage, GardenSeedPicker, GateRepair, Waypoint) — adopt `.game-window` markup; no rule changes
- `QuestTrackerHud.tsx` — collapsed by default on phones
- `Hud.tsx` — narrow-phone vitals, toast position
- `index.html` — portrait overlay element (replaces the pill)
- `e2e/mobile_layout.spec.ts` (new), `e2e/polish.spec.ts`, `e2e/mobile.spec.ts`
- `StyleClasses.test.ts` keeps every new class defined

## Risks / open questions

- **Size of the change:** about 13 windows. Doing M2 for the three most used windows first gives most of the benefit; the rest can follow window by window.
- **Desktop must not change by accident:** every new rule lives under the phone media query or behind a token whose desktop value equals today's value. The existing e2e (windows, polish) guard the desktop look.
- **Text that only lives in a subtitle** (e.g. "Materials only, never Credit" in the Shop) must stay reachable when the subtitle is hidden on phones: keep it as a one-line note in the body or behind a "?".
- **Letterboxing:** filling the full 20:9 width with the game (Phaser `Scale.EXPAND` or a wider world view) would give more play area, but it changes camera framing, the touch layout and every level's visible width. Out of scope here; worth its own plan.
- **Emoji to pixel icons:** only where an icon exists; drawing new icons is art work for later.
- **Decisions for the owner:** (1) quest tracker collapsed by default on phones, or removed from phones entirely (the Quest Board has the same list)? (2) portrait: full block with a message, or allow a portrait layout later? (3) start with M2 for Smithy/Shop/Backpack only, or all windows in one go?
