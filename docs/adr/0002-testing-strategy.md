# Testing strategy: automate the domain/application layers, hand-test infrastructure

The whole point of splitting out `domain/`/`application/` ([ADR 0001](0001-clean-architecture-layering.md)) was to make game rules testable without a browser — so as entities and use cases get built, we're deciding the testing approach now rather than improvising it per-file.

**Runner**: Vitest, not Jest — this is already a Vite project, so Vitest shares its config/resolver for free and needs no separate transform pipeline (ts-jest/babel) to run TypeScript. Tests are colocated next to source (`domain/entities/Enemy.ts` + `domain/entities/Enemy.test.ts`), not gathered into a parallel `tests/` tree.

**Scope**: only `domain/` and `application/` get automated tests. `infrastructure/` (Phaser scenes/sprites, React UI) stays hand-tested in the browser, as it has been throughout this project — Phaser needs a real canvas/WebGL context that a test environment can't cheaply fake, and the physics/rendering it owns is exactly the part Clean Architecture was meant to let us test *around*, not the part we then try to test directly.

**Test doubles for ports**: fakes for domain ports (e.g. an `InMemorySaveRepository` implementing `SaveRepository`) live in `domain/ports/__fakes__/`, shared across whichever use-case tests need them, rather than being redefined per test file.

**Entity references need no lookup for tests, except at the persistence boundary.** Because infrastructure sprites hold a direct reference to their paired domain entity (see "Sprite-entity pairing" in [CONTEXT.md](../../CONTEXT.md)) instead of looking entities up by ID, a use-case test can just construct an entity in-memory and pass it straight to the use case under test — no registry or fake lookup table to set up. `SaveRepository` is the one exception, since persisted data has to be identified by something other than a live object reference.

**Domain events are asserted by subscribing before acting**: a test registers a listener on the domain event emitter, invokes the use case, then asserts the listener fired with the expected payload — not by having the use case return an event value directly. This matches how the emitter is actually consumed in infrastructure (Phaser/React both subscribe, they don't call use cases for a return value they then re-emit).

**Update (28 Oct 2026):** two kinds of infrastructure-adjacent code are also automated because they are pure and cheap to test: the JSON validators in `src/infrastructure/content/` (`ContentCatalog.test.ts`) and a cross-reference check of the shipped `public/data/*.json` files (`src/domain/ContentIntegrity.test.ts`). Phaser scenes and React components remain hand-tested.
