# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"ພະຈົນໄພຄວາມຮູ້ / Knowledge Quest": a 2D learning-adventure game built on the Phaser 4 + React + TypeScript + Vite template (`phaserjs/template-react-ts`). The player learns from a Textbook, crafts gear, explores a Stage for Materials, and returns to the Village Hub — the design lives in [docs/Game Design Doc-Village Hub.md](docs/Game%20Design%20Doc-Village%20Hub.md) (Lao). Read [CONTEXT.md](CONTEXT.md) for the glossary before naming anything: **Chapter, Stage, Zone, Credit, Material, Textbook, Village Hub, Health** — and avoid *level, score, coins, lives, game over*, which belong to the old platformer this game replaced. Hard rules: **Credit comes only from learning; Materials come only from exploring** (see [docs/adr/0005-wallet-holds-credit-only.md](docs/adr/0005-wallet-holds-credit-only.md)).

The plan that aligned the code with the GDD is [docs/plans/2026-10-28-village-hub-alignment.md](docs/plans/2026-10-28-village-hub-alignment.md); each phase has a status note listing what is done and what was left over.

## Commands

```bash
npm install          # install dependencies
npm run dev-nolog    # dev server, no ping — prefer this one (npm run dev sends an anonymous template usage ping)
npm run build-nolog  # production build to dist/, no ping (npm run build pings)
npx tsc --noEmit -p tsconfig.json   # typecheck (no dedicated npm script exists)
npm run lint         # eslint .
npm run test         # domain/application unit tests once (Vitest)
npm run test:watch   # same, in watch mode
npm run test:e2e     # Playwright specs in e2e/ (starts the dev server itself)
```

`npm run lint` enforces the dependency rule: files in `domain/` and `application/` fail lint if they import `phaser`, `react`, `infrastructure/` (or, for domain, `application/`) or touch `window`/`localStorage`. Game rules belong in a use case, not in a modal or scene: the UI calls the use case and reacts to its result or event.

Vitest ([vitest.config.ts](vitest.config.ts)) picks up `src/domain/**/*.test.ts`, `src/application/**/*.test.ts` and the pure data-validator tests in `src/infrastructure/content/`; infrastructure is checked by typecheck, the Playwright specs and playing the game, see [docs/adr/0002-testing-strategy.md](docs/adr/0002-testing-strategy.md). `e2e/playthrough.spec.ts` is an opt-in experimental bot (`PLAYTHROUGH=1`) that plays with real keys; see its header for what it can and cannot do. Run e2e on its own — running it while `build` is going starves the CPU and makes specs flaky.

The dev server's configured port is 8080 ([vite/config.dev.mjs](vite/config.dev.mjs)); Vite moves to the next free port if it is taken. [.claude/launch.json](.claude/launch.json) holds the preview config. Build config is split across `vite/config.dev.mjs` and `vite/config.prod.mjs`.

## Phaser 4 reference

`.claude/skills/` holds one Skill per Phaser 4 topic (`scenes`, `physics-arcade`, `cameras`, `tweens`, `tilemaps`, `input-keyboard-mouse-touch`, `scale-and-responsive`, `v3-to-v4-migration`, etc.). **Consult the relevant skill before writing or reviewing Phaser code** — they cover this exact version (4.0.0) and catch v3→v4 breaking changes. [docs/phaser-guides/](docs/phaser-guides/) has deeper hand-written guides. `docs/phaser-master/` is a gitignored local copy of the Phaser source, present only if pulled.

## Architecture

**Clean Architecture, 3 layers** — see [CONTEXT.md](CONTEXT.md) and [docs/adr/0001-clean-architecture-layering.md](docs/adr/0001-clean-architecture-layering.md).

- `src/domain/` — entities and rules, no Phaser/React/DOM imports, no x/y. `entities/` (Wallet, Backpack, Book, Quiz, Health, Boss, Enemy, EquipmentState, Skin, StageProgression, SaveData, …), `ports/` (interfaces the outside world implements), `utils/` (e.g. `nextObjective`), and [DomainEvents.ts](src/domain/DomainEvents.ts), the framework-free emitter.
- `src/application/` — one use case per file (`PurchaseBookUseCase`, `SubmitBookExamUseCase`, `PerformAttackUseCase`, `HarvestResourceNodeUseCase`, `ReturnToVillageUseCase`, `AwardChapterClearUseCase`, …), each with a colocated `.test.ts`. They orchestrate entities, emit domain events (`player-died`, `boss-damaged`, `skin-changed`, …) and are called directly from infrastructure.
- `src/infrastructure/` — everything framework-specific:
  - `phaser/` — `main.ts` (game config), `scenes/` (`Preloader`, `TitleScene`, `Game`), `objects/` (Player, Enemy, Boss, NPC, Spike, platforms), `scenery/` (`VillageBuilder`, `StageBuilder`, `WorldBuilder`), `controllers/` (`CombatController`, `InteractionController`), `stages/StageDefinition.ts`, `effects/` (particles, floating text), `Level.ts` + `levelCatalog.ts`.
  - `react/` — `App.tsx`, `PhaserGame.tsx`, `components/` (HUD and the modals: Textbook, Academy, Workshop, Forge, Backpack, GateRepair, Waypoint, QuizFinisher, StageMap, Skin, Settings, `TitleMenu` (the full-screen start menu: CSS background art, keyboard and mouse list, Continue/New Game once there is progress), pause menu), `hooks/` (`useGameEvents` subscribes to game/domain events, `useGlobalShortcuts` for M/B/Esc/I, `useModalState` for every modal's open state and Esc-closes-the-top-one, `useSkinShop`, `useDialogue`).
  - `composition.ts` creates the one live `entities` (a domain `GameState`) and the concrete `repositories` (localStorage ports); `saveSnapshot.ts` is a thin bridge from `entities` to the save use cases (`createCurrentSnapshot`, `autoSaveGame`, `restoreEntitiesFromSnapshot`, `resetEntitiesToNewGame`); `storage/` has `SaveManager` (3 slots + autosave, implements `SavePort`) and `safeStorage`; `audio/SoundManager`; `content/` loads and validates the game data.

**Two scenes of gameplay, one `Game` scene class.** [Preloader](src/infrastructure/phaser/scenes/Preloader.ts) loads assets and JSON, [TitleScene](src/infrastructure/phaser/scenes/TitleScene.ts) plays the title music and runs the start transition (the start screen itself is React's `TitleMenu`), and [Game](src/infrastructure/phaser/scenes/Game.ts) runs both the Village Hub and the Stage, chosen by `levelKey` (`village` or `stage-ch1`). Switching is done by restarting `Game` with a different `levelKey` (React emits `change-level`). A new scene must be added to the `scene: []` array in `main.ts`, and one that React needs to reach must emit `'current-scene-ready'` itself.

**React ↔ Phaser go through `EventBus`** ([infrastructure/EventBus.ts](src/infrastructure/EventBus.ts), a `Phaser.Events.EventEmitter`), not props. The scene opens modals with events (`open-library`, `open-academy`, `open-workshop`, `open-forge`, `open-gate-repair`, `open-waypoint`, `open-stage-map`, `open-quiz-finisher`, `start-dialogue`); React answers with `change-level`, `quiz-finisher-passed/failed`, `gate-repaired`, `dialogue-open-state`; the scene reports `stage-cleared`, `backpack-changed`, `weapon-changed`. `PhaserGame.tsx` forwards the live scene via the `currentActiveScene` prop and the `{ game, scene }` ref. This is separate from `DomainEvents`, which must not depend on `phaser`.

**Data-driven content, loaded once and checked.** Gameplay data is JSON, not code. [main.tsx](src/main.tsx) calls `loadGameContent()` ([infrastructure/content/ContentCatalog.ts](src/infrastructure/content/ContentCatalog.ts)) before rendering: it fetches `items`, `books`, `questions`, `recipes`, `enemies` and `stages` from `public/data/`, validates each with a parser that names the file and path of any mistake (`items.json: items[3].maxStack must be a number`), and on failure shows an error page instead of a broken game. Screens and scenes then read `getGameContent()` synchronously — never `fetch` JSON yourself. `items.json` also fills `entities.itemCatalog` (the domain `ItemCatalog`), which is where stack sizes and "what is lost on death" come from (`story: true` items are kept); do not keep your own list of item ids in code. [ContentIntegrity.test.ts](src/domain/ContentIntegrity.test.ts) checks that the files reference each other correctly (recipe ingredients, drops, stage spawns, question pages), so run `npm run test` after editing any JSON. The reasoning, and what was deliberately not done (a schema library, React Context), is in [ADR 0006](docs/adr/0006-content-catalog-and-single-game-state.md).
- `public/data/stages.json` owns each Stage's Zones, signs, waypoints, resource nodes, enemy and boss spawns and the broken gate ([StageDefinition.ts](src/infrastructure/phaser/stages/StageDefinition.ts) holds its parser).
- `public/assets/levels/{village,stage-ch1}.json` — world width, player spawn, platforms, spikes, moving platforms ([ADR 0003](docs/adr/0003-level-data-as-loaded-json.md)).
- Adding a Stage means: a level JSON + a `levelCatalog.ts` entry + a `stages.json` entry + (if new) `enemies.json` ids. Balance numbers (prices, HP, drops) belong in the JSON and the GDD, not in scenes.

**Save data.** `SaveData.ts` defines the snapshot (`CURRENT_SAVE_VERSION = 6`); `migrateSaveSnapshot` sanitises anything loaded and starts older saves fresh, keeping only settings. Change the schema → bump the version and update `SaveData.test.ts`. The snapshot logic is in domain/application, not in React: `GameState.toSnapshot` / `loadFromSnapshot` and the use cases in `SaveSnapshotUseCases.ts` (create, restore, reset), tested with fake ports. Call `autoSaveGame()` after a change worth keeping rather than building a snapshot by hand: it writes at most every 3 seconds but postpones (never drops) a request that comes too soon, and saves the latest state when the page is hidden or closed. `GameState` members are created once and loaded **in place** — never assign over `entities.equipment`, `entities.books` and the like, or references held by scenes and screens go stale.

**Sprite–entity pairing.** Phaser objects that carry rules (Player, Enemy, Boss) hold a direct reference to their domain entity and pass it into use cases; geometry-only objects (platforms, spikes) have no entity. Keep movement/rendering inside the object's own `update()`; put rules (health, damage, drops, Credit) in `domain/`/`application/`.

**Gameplay constants.** Design resolution is 1280×720 with `Scale.FIT`; `WORLD_HEIGHT` in `Game.ts` must equal the config height in `main.ts`. Art is mostly placeholder shapes drawn with `Graphics` / generated textures plus the skin spritesheets in `public/assets/`.

**Phaser types vs. runtime imports.** Type-only references (`Phaser.Physics.Arcade.Body`, `Phaser.Scene`) can use the ambient global `Phaser` namespace; anything used at runtime (base classes, enums) must be a named import from `'phaser'` — there is no default export.

## Known leftovers

Achievements were removed (they paid coins and had no UI); they can return later as learning achievements that never pay Credit. Chapter 2's question bank is too small to show students; the Cave Guardian has no special attacks yet; `App.tsx` still holds one large event/shortcut effect. Details are in the plan's phase notes.
