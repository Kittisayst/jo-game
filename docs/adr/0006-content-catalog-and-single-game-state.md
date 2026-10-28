# Game data is loaded and checked once; the game state is one object loaded in place

An audit against [ADR 0001](0001-clean-architecture-layering.md) found the layers' imports were clean, but the rules and the data they depend on had drifted outward: stack sizes and "what is lost on death" were hard-coded in the domain *and* written in `items.json`; eight screens each fetched JSON on their own and trusted its shape (an enemy file said `type` while the code read `kind`, so every enemy kind was `undefined` without any error); and the live game was a module-level `entities` object whose members were replaced when a save loaded, so a scene holding the old `equipment` kept using a stale copy. We changed three things together because they depend on each other.

1. **Game data is loaded once, before anything renders, and validated.** `loadGameContent()` (`infrastructure/content/ContentCatalog.ts`) fetches `items`, `books`, `questions`, `recipes`, `enemies` and `stages`, runs a parser per file that names the file and path of any mistake (`items.json: items[3].maxStack must be a number`), and shows an error page instead of a half-working game when something is wrong. Screens and scenes read `getGameContent()` synchronously and never `fetch` JSON themselves. A test (`ContentIntegrity.test.ts`) also checks that the files reference each other correctly: recipe ingredients, drops, stage spawns, question pages.
2. **The domain asks an `ItemCatalog` instead of keeping its own lists.** `items.json` is the only place that says what an item is (stack size, category, `story`, heal amount). The catalog is created empty, handed to the `Backpack`, and filled at startup.
3. **The whole game is one `GameState` aggregate whose members are created once and changed in place.** Loading a save calls `loadFromSnapshot` on each member, so no reference held by a scene or screen goes stale. Saving, restoring and resetting are use cases (`SaveSnapshotUseCases.ts`) that take the state plus ports (`SavePort`, skin, settings, stage progress), so they are tested with fakes. The dependency rule from ADR 0001 is now enforced by ESLint (`no-restricted-imports` and `no-restricted-globals` on `domain/` and `application/`).

## Considered options

- **A schema library (zod or similar) for the JSON files** — rejected for now: the files are small and hand-written, a handful of validator helpers produce readable errors with no new dependency, and the integrity test covers the cross-file references a per-file schema cannot. Revisit if the data grows or non-programmers start editing it.
- **React Context for the game state, replacing the `entities` import in screens** — deferred: the Phaser scene needs the same state and is not part of the React tree, so a context alone would not remove the shared instance, and there are no React tests that would benefit yet. Revisit when screens get component tests.
- **Keep each screen fetching its own JSON** — rejected: it duplicated loading, left most files unchecked and made a bad file fail inside a modal.
- **Keep the item rules in the domain and only validate `items.json` against them** — rejected: two sources of truth that must be edited together is how the lists drifted.

## Consequences

- Adding an item is one edit in `items.json`; adding any content means running `npm run test`, which catches dangling ids.
- Anything that needs content before startup finishes (a module-level read of `getGameContent()`) throws; tests build catalogs from the real `items.json` through `domain/testing/itemCatalog.ts`.
- Never assign over a `GameState` member (`entities.equipment = …`); add or use a `loadFromSnapshot`-style method instead.
- `infrastructure/content/` is the one part of `infrastructure/` covered by unit tests, because it is pure data validation (see the update in ADR 0002).
