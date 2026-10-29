# jo-game

"Knowledge Quest": a 2D learning adventure on Phaser + React. The player learns from a Textbook, crafts gear, explores a Stage for Materials and returns to the Village Hub. Architected as three layers (domain, application, infrastructure) so game rules stay testable and independent of Phaser/React.

## Language

**Domain layer**:
Framework-agnostic core holding entities and business rules — health, wallet, backpack, textbook progress, stage progression. Never imports Phaser or the browser; never holds x/y coordinates or any spatial data.
_Avoid_: core, engine, model layer

**Entity** (domain):
A plain TypeScript object with identity and non-spatial state — e.g. an Enemy's health/facingDirection/isDead, a Health, a Wallet. Position, velocity, and collision belong to the infrastructure layer's Phaser sprites, never to the entity.
_Avoid_: model, game object

**Application layer**:
Use cases that orchestrate domain entities in reaction to something the infrastructure layer detected (a collision, an overlap, a button press) — e.g. PerformAttackUseCase, SubmitBookExamUseCase, CompleteStageUseCase. Called directly by infrastructure code; never calls back into infrastructure itself.
_Avoid_: services, business logic layer, managers

**Infrastructure layer**:
The outer layer holding everything framework-specific: Phaser scenes/sprites (physics, rendering, input) and React components (HUD, textbook and shop modals). Both call into application use cases and both implement domain ports. This is the only layer allowed to know about pixels, coordinates, `localStorage`, or DOM/canvas.
_Avoid_: phaser layer, presentation layer (it covers React too, not just Phaser)

**Port**:
An interface declared in the domain layer for a capability the domain needs from the outside world — e.g. `SaveRepository`. The infrastructure layer supplies the concrete implementation (e.g. a `localStorage`-backed repository); the domain never knows which one.
_Avoid_: repository (reserve "repository" for the concrete infrastructure implementation, "port" for the interface)

**Domain event**:
A notification emitted through a small custom emitter that lives in the domain layer (not `Phaser.Events.EventEmitter`), so both the Phaser scene and the React UI can react to the same state change without either depending on the other's framework.
_Avoid_: EventBus (that name is reserved for the existing Phaser↔React bridge in `src/infrastructure/EventBus.ts`, which is a separate, infrastructure-only concern)

**Spatial ownership**:
Only infrastructure (Phaser Arcade Physics sprites) ever tracks x/y position or performs collision/overlap detection. When physics detects something meaningful (wall hit, overlap with a goal zone), infrastructure translates that into a use-case call — the domain is told *what happened*, never *where*.

**Sprite-entity pairing**:
Every infrastructure Phaser sprite that represents something with domain rules (Enemy, Player) holds a direct reference to its paired domain Entity — e.g. an `EnemySprite` has an `entity: Enemy` field. Infrastructure passes that entity straight into a use case (`defeatEnemyUseCase(sprite.entity)`); there is no ID or lookup registry in between. A registry/ID is only introduced where infrastructure has no live object to hold a reference across — e.g. save/load, where the `SaveRepository` port necessarily deals in IDs and serialized data instead of live entities.
_Avoid_: entity ID, entity registry/lookup (for gameplay entities — reserve ID-based lookup for the persistence port only)

**Pairing is optional, not automatic**:
Not every infrastructure game object needs a paired domain Entity. A pairing exists only when there's an actual rule or piece of state for the domain to own — health, AI decisions, Credit, and the like. A game object that is pure geometry with no rules (e.g. a static floating platform — just a position and a collision box) stays entirely inside infrastructure, with nothing in `domain/` or `application/` for it at all. Don't create an Entity speculatively "because this is a game object" — wait until a real rule shows up.

**Chapter**:
One lesson of the curriculum: one Textbook, one Stage, one Boss. Beating the Boss for the first time completes the Chapter.

**Stage**:
The explorable run of a Chapter, walked left to right and divided into Zones. Its layout is infrastructure-owned spatial data loaded from `stages.json` (zones, spawn points, resource nodes, gate) and a level JSON (platforms, world width); that layout has no domain Entity (see "Pairing is optional, not automatic"). Enemies and Resource nodes respawn each time the player enters.
_Avoid_: level, map

**Zone**:
One section of a Stage (forest, cavern, Broken Gate, boss arena), each with its own enemies and resources.

**Resource node**:
A tree, stone, iron vein or herb standing in a Zone that gives Materials when harvested. It needs a matching tool (an axe for trees, a pickaxe for stone and iron; herbs need none) and a number of Strikes, different for each node (a tree takes 3). It respawns, intact, each time the player enters the Stage.

**Mini-boss**:
A stronger enemy that guards a Zone and drops story Materials (the Cave Guardian drops crystal). Unlike normal enemies it has special attacks, each announced by a Telegraph. Touching it or being hit by its attack costs one heart, like every other enemy.

**Telegraph**:
The warning an enemy gives before a special attack (a red flash and a mark over its head), long enough for the player to react. An attack never lands without one.

**Strike**:
One press of the interact key on a Resource node. The node gives its Materials only when the last Strike lands; a Strike is refused, and not counted, if the player lacks the tool or the Backpack cannot hold the Materials. Strikes already made are kept until the player leaves the Stage.
_Avoid_: hit (a hit is damage to Health), hp (that is Health)

**Credit**:
The currency earned only by learning (passing a Book exam, Daily Practice, finishing a Chapter by answering the Boss question). Killing enemies never gives Credit, and there is no separate coin currency; the Wallet holds Credit only.
_Avoid_: coins, money, gold

**Health**:
The player's hit points, shown as hearts. Dropping to zero sends the player back to the Village Hub (with the Material loss rule), not to a game-over screen. There are no extra lives, scores, or star ratings.
_Avoid_: lives, score, game over

**Material**:
A resource gathered only by exploring a Stage (wood, stone, iron ore, herb, fiber, crystal, boss core). Lost 50% on death or emergency retreat, except story Materials (crystal, boss core), which are always kept.
_Avoid_: resource (for the item; "Resource node" is the place it is harvested from)

**Textbook**:
A purchasable Book of short pages for one Chapter. Passing its exam unlocks the Recipes tied to it.
_Avoid_: lesson, course

**Village Hub**:
The safe place between Stages with no enemies; the player walks to buildings (Library, Academy, Workshop, Forge, World Gate) and returns here to heal and save.

**Skin**:
A cosmetic look for the player character, bought once with Credit and kept forever. The free default is always owned. Skins change nothing about gameplay. Buying and changing a Skin both happen only at the Skin shop in the Village Hub, never from a menu.
_Avoid_: costume, outfit

**Wallet**:
The player's Credit balance. It holds no other currency.

**Backpack**:
The player's carried items (Materials, tools, weapons, crafted gear) in a fixed number of slots; this is what is at risk when the player dies.

**Broken Gate**:
The gate between the cavern Zone and the boss arena. It stays closed until the player brings the right tool and a Repair Kit and answers a question from the Chapter's Textbook.

**Game state**:
Everything that makes up one player's game (Wallet, Backpack, Health, Equipment, Textbook progress, Skins, stage progress, settings), held in one `GameState` aggregate. Its members are created once and changed in place when a save is loaded.
_Avoid_: session (the old score-and-lives `GameSession` no longer exists), store, globals

**Content catalog**:
The game's JSON data (items, textbooks, questions, recipes, enemies, stages) loaded and checked once at startup. Rules that depend on what an item is ask the item catalog; screens and scenes read the loaded content and never fetch data themselves.
_Avoid_: data loader, assets (assets are images and sounds)

**Skin shop**:
The only shop in the game, run by the NPC Mina in the Village Hub. It sells Skins for Credit and nothing else (no items, no Materials), so Credit still comes only from learning. Talking to Mina is the only way to open it.
_Avoid_: store, merchant, coin shop (the old coin shop is gone)
