# Merged Smithy window and Grandma Chanthy's shop

- **Date:** 2026-11-02
- **Status:** planned
- **Project:** jo-game (Knowledge Quest)

## Goal

1. Merge the Workshop and the Forge of the Village Hub into one building with one window (tabs), so the player does not walk between two doors and two windows that do almost the same thing.
2. Add a shop run by Grandma Chanthy that works by **barter** (Materials for goods), so the rule "Credit comes only from learning" ([ADR 0005](../adr/0005-wallet-holds-credit-only.md)) stays whole.

Decided with the user (2026-11-02): one building, one window with tabs; barter, no new currency; Chanthy sells Seeds, Potions and food, utility items (repair kit, Backpack/Storage slots) and a daily rotating stock.

## Current context

- `VillageBuilder.ts` has two buildings (`building-workshop` at x = 2400, Forge at `FORGE_X`), two E spots (`open-workshop`, `open-forge`) and a lock on the Forge until the Textbook 1 exam (`book-exam-passed`, `forgeOpen`).
- `WorkshopModal` (229 lines: Craft, Upgrade tabs + `RepairList`) and `ForgeModal` (349 lines: Craft, Upgrade, Repair tabs) are separate windows; `useModalState` has `isWorkshopOpen` / `isForgeOpen`; `useGameEvents` maps `open-workshop` / `open-forge`.
- `recipes.json` has 34 `building: "workshop"` and 23 `building: "forge"` entries; `CraftingWorker` is made per building (`buildingOfJob`); `CraftingQueue` already allows one job at a time for both.
- Chanthy is an NPC at x = 2480 with a dialogue (`grandmaChanthyDialogue.ts`, action `give-herbalist-gift`). Seeds (`herb-seed`, `fiber-seed`, `cactus-seed`) and potions (`herb-potion`, `strength-potion`, ...) exist in `items.json`; `repair-kit` too.
- `WorldTime.dayCount` is saved and can seed a daily stock.

## Approach

### A. One Smithy window

- Keep `building` in `recipes.json` as it is (it still says which tab lists a recipe, and the Forge-locked rule keeps working). No data change.
- New `SmithyModal` with tabs: **ເຄື່ອງມື** (workshop craft), **ອາວຸດ & ເກາະ** (forge craft, locked with a hint until the Textbook 1 exam), **ອັບເກຣດ** (tool + weapon upgrades), **ສ້ອມແປງ** (one `RepairList` for swords, armor and tools). Existing panels (`ToolUpgradePanel`, `RepairList`, `CraftingStatus`) are reused as they are; the craft grid becomes one shared `RecipeGrid` component filtered by `building`.
- One building in the village (the larger Forge art), one E spot, event `open-smithy`; `open-workshop` and `open-forge` stay as aliases that open the right tab, so specs and the dev hooks keep working.
- One smith (`CraftingWorker`) stands in front of the building for any job (`buildingOfJob` is only needed to pick the tab).
- The lock: the Forge tab shows a lock and the hint, the building itself is never locked.

### B. Chanthy's shop (barter)

- `public/data/shop.json`: `stock` entries `{ itemId, price: [{ itemId, count }], limit?, daily?: true }`, validated by a parser (`ShopCatalog.ts`) that names file and path, and checked by `ContentIntegrity.test.ts` (item ids exist, prices are Materials only, never Credit, never a `story` item).
- Domain: `Shop` rules in `application/BuyFromShopUseCase.ts` (takes the Materials, gives the goods, respects `limit` and a full Backpack) and `application/ShopStock.ts` (pure function of `dayCount` and a seed → the daily rotating items; no randomness in the UI).
- Daily stock: `entities.shopPurchases` (`{ dayCount, bought: Record<itemId, number> }`, saved, additive) resets when `dayCount` changes, so a daily limit is per game day.
- Selling back: Materials can be exchanged for other Materials (one fixed rate per pair in `shop.json`, always a loss of 1 in 3 so there is no loop); no sale of goods for Credit.
- UI: `ShopModal` (tabs: Seeds, Potions & food, Supplies, Today), opened from Chanthy's dialogue with a new action `open-shop` (like `open-skin-shop`); the hero is frozen while it is open.

### C. Rules and docs

- Seeds sold for Materials are Seeds that exploring paid for; this is consistent with the intent of [ADR 0007](../adr/0007-materials-can-be-grown-from-explored-seeds.md) but the text says "gave", so add a short ADR (0008) that says a Seed may also be bought with Materials from Chanthy, and that Credit is still never involved.
- `CONTEXT.md`: add **Smithy** (the merged building) and **Shop barter**; keep Workshop/Forge as the names of the tabs.
- `CLAUDE.md`: replace the two window descriptions, add the Shop.

## Steps

1. Domain/application: `ShopCatalog` parser + `shop.json`, `BuyFromShopUseCase`, `ShopStock`, `shopPurchases` in `GameState` + save (bump `CURRENT_SAVE_VERSION`, update `SaveData.test.ts`), unit tests for each, integrity test for `shop.json`.
2. React: `RecipeGrid` extracted from the two modals; `SmithyModal` with four tabs; remove `WorkshopModal` / `ForgeModal`; `useModalState` (`isSmithyOpen`, Esc closes it); `useGameEvents` (`open-smithy`, aliases).
3. Phaser: one Smithy building in `VillageBuilder` (re-use Forge textures, lock logic moves to the tab), one smith in `Game`; re-space the village (a gap is left where the Workshop stood; move the Garden door or a lantern only if needed).
4. Shop: `ShopModal`, Chanthy's dialogue choice `🛒 ເບິ່ງຮ້ານ` with action `open-shop`, `StyleClasses.test.ts` stays green (no Tailwind names).
5. e2e: update `windows.spec`, `crafting_time`, `tool_upgrades`, `features_3_and_4`, `stage1_full_walkthrough`, `dungeon_extensions_1_to_4` for the new building/window; add `shop.spec.ts` (buy a Seed with Materials, daily limit, full Backpack, Credit untouched).
6. Docs: ADR 0008, CONTEXT.md, CLAUDE.md, this plan's status note.

## Files affected

- `src/infrastructure/react/components/SmithyModal.tsx` (new), `RecipeGrid.tsx` (new), `ShopModal.tsx` (new); `WorkshopModal.tsx`, `ForgeModal.tsx` (removed)
- `src/infrastructure/react/App.tsx`, `hooks/useModalState.ts`, `hooks/useGameEvents.ts`, `hooks/useDialogue.ts`
- `src/infrastructure/phaser/scenery/VillageBuilder.ts`, `scenes/Game.ts`, `objects/CraftingWorker.ts`
- `src/infrastructure/dialogue/grandmaChanthyDialogue.ts`
- `public/data/shop.json` (new), `src/infrastructure/content/ShopCatalog.ts` (new), `ContentCatalog.ts`, `ContentIntegrity.test.ts`
- `src/application/BuyFromShopUseCase.ts`, `ShopStock.ts` (new, with tests); `src/domain/entities/GameState.ts`, `SaveData.ts`
- `e2e/*` listed in step 5; `docs/adr/0008-...md`, `CONTEXT.md`, `CLAUDE.md`

## Risks / open questions

- The working tree has 25+ uncommitted changes from the village expansion (Cottage, Pets, Quests). Work on this plan should start from a commit of that work, or it will mix with it.
- Village positions moved in the expansion; several specs still use old x values (`skin_shop`, `crafting_time`, `polish`), so some e2e failures are not caused by this plan.
- Quests that pay Credit for gathering/fighting/crafting already conflict with ADR 0005; the shop must not copy that.
- Prices and the daily list need a balance pass by hand once built (the shop must not undercut exploring for Seeds).
- Daily rotation: decide whether it follows `WorldTime.dayCount` (game days, 20 minutes) or real days; the plan uses game days so it works offline and in tests with `__advanceWorldTime`.
