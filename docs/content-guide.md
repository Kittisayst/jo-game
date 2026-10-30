# Content guide: adding a Realm

A Realm (10 Stages, one subject) is content work. **Every Realm also needs a night creature**: an `enemies.json` entry with `"night": true` (normal kind, `xp`, `moon-dust` among its drops, a 128x28 sheet from `tools/art/build_night_creatures.py`) listed under its number in the `night.byRealm` block of `stages.json` (`ContentIntegrity.test.ts` fails without it). Realm 3 (Stages 21–30, Operating Systems, the desert) followed this same guide, with `tools/art/build_realm3_art.py` and `build_ch3_diagrams.py` for the art and one extra code piece (the End Task skill, an `area` effect). Realm 2 (Stages 11–20) was added with only one small code change (the Boss finisher reads the Realm's own Textbook, see Phase 10 in [the plan](plans/2026-10-29-hundred-stages-realms.md)). Follow the same steps for Realms 3–10. Run `npm run test` after each step: [ContentIntegrity.test.ts](../src/domain/ContentIntegrity.test.ts) and the validators in `ContentCatalog.test.ts` name the file and path of any broken reference.

Content text is Lao. **Lesson text and questions written by an AI or a developer must be checked by a teacher** before the Realm is shown to students.

## 1. The Realm row

`public/data/realms.json` already lists all ten Realms (subject, colour, `bookId`, `shardItem`, `blockItem`). Make sure the Realm's `bookId` names a real book in `books.json` (a Realm with `bookId: null` has no Textbook yet).

## 2. Materials, Resource nodes and Seeds

- `items.json`: new Materials (`category: "material"`, `maxStack`, `icon`, `iconImage`). A Seed also has `plant: { minutes, harvest[] }`.
- `nodes.json`: new kinds of Resource node (`texture`, `requiredTool`, `toolTier`, `strikes`, `drops`; optional `seed` and `regrow`). Make the tier of the first node of the Realm one the player already has: Realm 2's blue ore needs only a T1 Pickaxe, because the T2 Pickaxe is made from blue ore.
- Art: a node is a sheet of equal frames (full, mined; plants add a third Sapling frame). Add the sheet to the list in `Preloader.ts` and draw it with a script in `tools/art/` (see `build_realm2_art.py`); every `iconImage` and book `illustration` must be listed in `docs/asset-manifest.json` (a test checks it).

## 3. Enemies, Mini-boss and Boss

`enemies.json`: ordinary enemies (`kind: "normal"`), the Stage 5 Mini-boss (`miniboss`, with `attacks.moves`) and the Stage 10 Boss (`boss`, with `phases` and `quizFinisher.bookId`). The Mini-boss drops the Realm's `shardItem` ×1 and the Boss ×3 (a test checks the Realm 1 numbers; keep the same for every Realm). Ordinary enemies get tougher with the Stage number automatically (`scaling` in `stages.json`), so write their base numbers once.

The look and the moves of a Boss are still in code (`Boss.ts`); a new Boss is a new entry in the data with the existing look.

## 4. Gear

`items.json` (weapon/tool/armor with `durability`), `recipes.json` (`requiredBookRecipe` = the item id, taught by the Realm's book), `repairs.json` (every item that wears must be repairable; a test checks it) and `unlockedRecipes` of the book. `craftSeconds` (optional, seconds of Game time) gives a recipe a build time; gear and Portal blocks have one, potions and the repair kit are instant. Icons: draw them, or tint the previous tier as `build_realm2_art.py` does until real art exists.

## 5. The Textbook

`books.json`: one page per Stage with a `lesson` number `<stage>-1` (Realm 3 = `21-1` … `30-1`), a `title`, `content`, `keyPoints` and an `illustration` (an SVG; `tools/art/build_ch2_diagrams.py` shows how to draw simple ones). The Realm's first lessons can be pages that already exist.

`questions.json`: at least 3 questions per lesson (`bookId`, `pageNumber`, `lesson`, four `options`, `correctIndex`, `explanation`). A Stage's end question and the Boss finisher are drawn from these; the Boss finisher uses every question of the Realm's book.

## 6. Stages

`stages.json`: turn `{ number, realm, status: "placeholder" }` into a built Stage. An ordinary Stage can hide a secret ledge for the air dash (`"secret": true` in `generate`, plus one `{ "kind": "node", "secret": true, ... }` with a rich `overrides.drops` in the Zone); see "Secret ledges" in CLAUDE.md.

- Ordinary Stage: `layout: { generate: { biome: "forest" | "cave", seed, screens } }`, `lessons: ["<n>-1"]`, a waypoint, a sign, one `spawn-pool` and an `exit` (see Stages 11–14, 16–19).
- Stage 5 and Stage 10 of the Realm: a level JSON in `public/assets/levels/stage-NNN.json` (copy Stage 15 or 20 and move the platforms), with the `miniboss` / `boss` entry. Stage 10 of Realm 1 has the Broken Gate; its id (`gate-ch1`) is tied to code, so a Realm without a gate simply leaves it out.

The map, the opening of the next Stage and the Portal block need no change. Add the Realm's e2e check by copying `e2e/realm2.spec.ts`, and update the counts in `e2e/stage_map.spec.ts`.

## 7. Not data yet

A biome backdrop and ground tile (Realm 2 reuses the cave), recoloured enemies, new Boss moves, and the picture of gear in the hero's hand are still code or art work. They are listed as left over in the plan's Phase 10 notes.
