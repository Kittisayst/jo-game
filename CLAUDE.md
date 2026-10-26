# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A side-scrolling platformer built on the Phaser + React + TypeScript + Vite template (`phaserjs/template-react-ts`), customized down to a single gameplay scene.

## Commands

```bash
npm install          # install dependencies
npm run dev           # dev server (sends anonymous template usage ping via log.js)
npm run dev-nolog      # dev server, no ping — prefer this one
npm run build          # production build to dist/ (with ping)
npm run build-nolog    # production build to dist/, no ping
npx tsc --noEmit -p tsconfig.json   # typecheck (no dedicated npm script exists)
npm run lint           # lint (runs eslint .)
npm run test          # run domain/application unit tests once (Vitest)
npm run test:watch     # same, in watch mode
```

Vitest ([vitest.config.ts](vitest.config.ts)) only picks up `src/domain/**/*.test.ts` and `src/application/**/*.test.ts` — infrastructure has no automated tests by design, see [docs/adr/0002-testing-strategy.md](docs/adr/0002-testing-strategy.md).

## Phaser 4 reference

`.claude/skills/` holds one Skill per Phaser 4 topic (`scenes`, `physics-arcade`, `cameras`, `tweens`, `tilemaps`, `input-keyboard-mouse-touch`, `scale-and-responsive`, `v3-to-v4-migration`, etc. — 27 total). **Consult the relevant skill before writing or reviewing any Phaser code** — they cover this exact Phaser version (4.0.0) and catch v3→v4 breaking changes that don't show up in habit or muscle memory. [docs/phaser-guides/](docs/phaser-guides/) has deeper hand-written guides (rendering internals, pixel-art filtering, shaders, compressed textures) for when a skill's Quick Start isn't enough. Both were extracted from a vendored copy of the Phaser source (`docs/phaser-master/`, gitignored, present only if it was pulled locally) so they survive independent of that clone.

The dev server's configured port is 8080 ([vite/config.dev.mjs](vite/config.dev.mjs)), but Vite auto-increments to the next free port if it's taken — check the terminal output for the actual URL. Build output goes to `dist/`, config split across `vite/config.dev.mjs` and `vite/config.prod.mjs`.

## Architecture

**Clean Architecture, 3 layers — see [CONTEXT.md](CONTEXT.md) and [docs/adr/0001-clean-architecture-layering.md](docs/adr/0001-clean-architecture-layering.md) for the full rationale.** `domain/` (entities + rules, zero Phaser/browser imports, zero spatial data) → `application/` (use cases orchestrating the domain) → `infrastructure/` (Phaser scenes/sprites *and* React UI, both calling use cases directly). So far only [domain/DomainEvents.ts](src/domain/DomainEvents.ts) exists (the framework-free emitter both use cases and infrastructure will subscribe to) — entities, use cases, and `application/` itself get created when the first real one is actually needed (e.g. adding an enemy or score), following the patterns in [docs/adr/0002-testing-strategy.md](docs/adr/0002-testing-strategy.md). Everything else that exists today lives in `infrastructure/`, under `infrastructure/phaser/` (game code) and `infrastructure/react/` (UI code).

**React shell renders one Phaser instance.** [main.tsx](src/main.tsx) → [infrastructure/react/App.tsx](src/infrastructure/react/App.tsx) → [infrastructure/react/PhaserGame.tsx](src/infrastructure/react/PhaserGame.tsx), which calls `StartGame()` from [infrastructure/phaser/main.ts](src/infrastructure/phaser/main.ts) once (guarded by a `useRef` null-check) and mounts the canvas into a `div#game-container`. Game config (canvas size, scale mode, Arcade Physics gravity, scene list) lives in `infrastructure/phaser/main.ts`.

**React ↔ Phaser communication goes through EventBus, not props.** [infrastructure/EventBus.ts](src/infrastructure/EventBus.ts) is a `Phaser.Events.EventEmitter` shared by both sides — it lives directly under `infrastructure/` (not nested in `phaser/` or `react/`) because it's a cross-cutting bridge between them. A scene emits `'current-scene-ready'` (with `this`) once it's set up; `PhaserGame.tsx` listens for that event and forwards the live scene instance to React via the `currentActiveScene` prop and the forwarded ref (`{ game, scene }`). Any new scene that needs to be reachable from React must emit this event itself — it is not automatic. Note this is distinct from the *domain event* emitter the ADR calls for once `domain/`/`application/` exist — that one must not depend on the `phaser` package, so it cannot reuse this `EventBus`.

**Single-scene design.** The project was deliberately collapsed from the template's original five scenes (Boot → Preloader → MainMenu → Game → GameOver) down to just [scenes/Game.ts](src/infrastructure/phaser/scenes/Game.ts), which does its own (asset-less) setup in `create()`. There is no menu, no loading screen, no game-over flow — reintroducing any of that means adding scenes back to the `scene: []` array in `infrastructure/phaser/main.ts`.

**Player is a self-contained Arcade Sprite.** [objects/Player.ts](src/infrastructure/phaser/objects/Player.ts) extends `Physics.Arcade.Sprite` and owns its own placeholder texture generation, movement constants, and per-frame `update(cursors)` — `Game.ts` just constructs it, adds a collider against the ground, and forwards `cursors` each frame. Follow this pattern for future Phaser-side game objects: generate texture lazily on first use, keep *movement/rendering* logic inside the object's own `update()`. Once `domain/`/`application/` exist, non-spatial rules (health, AI decisions, scoring) belong there instead, invoked from this object's `update()` or from collision callbacks in `Game.ts` — see the Clean Architecture note above.

**World is larger than the viewport; camera follows the player.** Ground and sky are `TileSprite`s tiled across a `WORLD_WIDTH` far wider than the design resolution, so physics/camera bounds (`physics.world.setBounds`, `camera.setBounds`) must stay in sync with `WORLD_WIDTH`/`WORLD_HEIGHT` constants at the top of `Game.ts`. The sky tile is drawn with `setScrollFactor(0.3)` for parallax. All ground/sky/player art is placeholder — flat-color rectangles/ellipses generated at runtime via `Graphics.generateTexture()`, not loaded image assets.

**Design resolution is 16:9 (1280×720) with `Scale.FIT`.** This was chosen deliberately after testing: `Scale.ENVELOP` (fill container by cropping) cut off the ground/player entirely at common 16:9 laptop resolutions since the old 4:3 canvas didn't match typical monitor aspect ratios. Keep `WORLD_HEIGHT` in `Game.ts` equal to the config `height` in `infrastructure/phaser/main.ts`.

**Phaser types vs. runtime imports.** Type-only references (e.g. `Phaser.Types.Input.Keyboard.CursorKeys`, `Phaser.Physics.Arcade.Body`) can use the ambient global `Phaser` namespace without an import. Anything used at *runtime* (base classes to `extends`, enums like `Scale`) must be imported as a named export from `'phaser'` — there is no default export.
