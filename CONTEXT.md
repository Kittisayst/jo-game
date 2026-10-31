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

**Realm**:
One subject of the curriculum and one colour of portal: ten Stages (numbers 10k+1 to 10k+10), one Textbook, a Mini-boss at Stage 5 and a Boss at Stage 10. There are ten Realms. Moving into the next Realm needs the Portal block of the Realm before it. This replaces the earlier "Chapter" (one Textbook, one Stage, one Boss).
_Avoid_: chapter, world, level

**Stage number**:
A Stage's place in the whole game, 1 to 100. The Realm of Stage n is ceil(n / 10). A Stage that is not built yet is a placeholder: it is shown grey on the Stage map and cannot be entered.

**Lesson number**:
A Textbook page written `<stage number>-<order>`, such as `12-3` (the third lesson of Stage 12). The question at the end of a Stage is drawn from that Stage's lessons.

**Stage**:
One explorable run of a Realm, walked left to right and divided into Zones. Its layout is infrastructure-owned spatial data loaded from `stages.json` (everything in a Stage is an entry of its `contents`) and a level JSON or a generated layout (platforms, world width); that layout has no domain Entity (see "Pairing is optional, not automatic"). Enemies respawn each time the player enters, and so do Resource nodes that regrow "on enter" (see Regrow).
_Avoid_: level, map

**Zone**:
One section of a Stage (forest, cavern, Broken Gate, boss arena), each with its own enemies and resources.

**Resource node**:
A tree, stone, iron vein, herb or other plant standing in a Zone that gives Materials when harvested; the hero must stand right next to it (about the reach of the tool), not just near its picture. It needs a matching tool (an axe for trees, a pickaxe for stone and iron; herbs need none) and a number of Strikes, different for each node (a tree takes 3). Its kind comes from `nodes.json`, not from code. It comes back according to its Regrow rule.

**Regrow**:
How a Resource node comes back after it is depleted. "On enter": intact each time the player enters the Stage (trees, stone, iron). "Minutes": it becomes a Sapling and can be harvested again only after that much real time has passed, even while the game is closed (small plants).

**Seed**:
An item that may drop when a plant Resource node is harvested (a chance set in `nodes.json`). Planted in a Plot of the Garden it grows into that plant.

**Sapling**:
The picture and state of a plant Resource node that is still growing; it cannot be harvested yet.

**Garden**:
A separate scene reached from the Village Hub where Seeds are planted in Plots. No watering: plant, wait, harvest.

**Plot**:
One planting spot of the Garden: empty, growing or ready. The Garden starts with six and can be expanded with Materials.

**Skill**:
An active power the hero learns by passing the exam of a Realm's Textbook (one for each Realm, such as Power Wave for Realm 1). A Skill has a **rank** from 1 to 3, raised at the Academy for Credit and Materials: a higher rank has a shorter cooldown and a stronger effect. Two Skills can be on the **skill slots**, K and L; using one starts its **cooldown**, counted in Game time. A Skill never pays Credit and never makes Materials.

**Secret ledge**:
A high platform in a Stage that one jump cannot reach: the gap to its launch platform is wider than a jump crosses but within a jump with the air dash. It has a reward on it (a rich Resource node, with a ✨ over it so it can be seen from afar), so the air dash is worth having.

**Tool upgrade**:
An axe or pickaxe raised from +0 to +3 at the Workshop for Materials (never Credit). An upgraded tool counts for more of a Strike, so a tree or a rock takes fewer Strikes. The level belongs to the kind of tool (every Axe T1 is the same level). This is how chopping gets faster: it is not a Skill.

**Hero Level**:
The hero's level, 1 to 150 (in code `HeroLevel`; the bare word *level* stays banned because the old platformer's levels and `Level.ts` are Stage layouts). Every level gained gives a Stat point. It is a small boost on top of the gear the Textbooks teach, never a replacement for it.
_Avoid_: level (alone), rank (that is a Skill's)

**XP**:
What a defeated monster pays towards the next Hero Level. It is not Credit: it cannot be turned into Credit and buys nothing. A monster in a Stage far below the hero's level pays a fifth, so leaving and re-entering a low Stage is no way to farm.
_Avoid_: experience points, exp

**Stat point**:
Given for every Hero Level (149 by level 150); the hero spends each on a Stat in the Character window (C). Taking them all back costs Materials, never Credit.

**Stat**:
One of four things Stat points go into: Attack (damage of the sword and Skills), Hearts (an extra heart for every 10 points), Guard (the chance that a hit does nothing) and Agility (walking speed). Each has a ceiling and the ceilings add up to the points of the top level, so the hero at level 150 has filled every Stat. A Stat is a small boost on top of the gear, never a replacement for it.
_Avoid_: attribute, skill (that is a Skill)

**World time**:
The time of day in the world, counted in Game time (it moves only while the game runs, like the build queue, and is saved). One day is 20 minutes: dawn, day, dusk, **night** (the last 6 minutes), dawn. At night the world is darker (never so dark that the platforms and spikes cannot be read) and, in a later phase of the Hero Level plan, Night creatures walk the Stages and the hero can sleep at the Bed. Real time (the Garden's plants) does not follow it.
_Avoid_: clock (that is the real-time `Clock` port), time of day (say World time)

**Pit** (ເຫວ):
A gap in a Stage's ground. The hero who falls into it dies at once (Armor, hearts, invincibility and the Dash do not matter: the ground is gone) and goes home like any death. A generated Stage with pits is told by its `pits` count in `stages.json`; each pit is at most 115 px wide (an easy jump), stands clear of platforms and the start and the exit, and takes the place of the spikes near it. There are none in the first Stage or in a Mini-boss or Boss Stage.
_Avoid_: hole, trap, hazard (a spike is a hazard that hurts; a pit kills)

**Night creature**:
A special monster that walks a Stage only while it is night (one per Realm so far, listed in the `night` block of `stages.json`). It is tougher than the day's monsters of its Realm and pays more XP, it never appears near the hero, it drops Moon Dust, it walks a Stage once a night (leaving and coming back in the same night makes no new ones, so it is no way to farm), and it fades away at dawn (no drop, no XP). The first Stage and a Mini-boss or Boss Stage have none.
_Avoid_: ghost, nightmare, boss (it is not one)

**Bed**:
The place in the Village Hub (east end, past the World Gate) where the hero sleeps. From dusk until the morning, E there fades the screen, jumps World time to the morning, fills the hearts and Armor hearts, moves a build job on by the time that went by (it counts Game time) and saves. By day it does nothing. The Garden does not change: it is on real time, so sleeping never grows a plant.
_Avoid_: inn, rest point (a Waypoint is the safe Stage spot)

**Moon Dust**:
The Material night creatures drop. Taking back every Stat point costs Moon Dust, so starting over is a night's hunting (never Credit). A plain Material: halved on death.

**Stun**:
An enemy held still for a few seconds by a Skill (such as Ping): it cannot patrol, attack or hurt the hero by touching, and an attack it was starting is cut short. It counts Game time. A Boss is never stunned.

**Dash**:
A quick burst sideways (Shift, or the touch button) that the hero has from the start. For its first moments nothing can hurt the hero: this is the **dodge**. It has a cooldown. The **air dash** (a Dash in the air, once per jump) is a **movement ability** the hero gets by beating the Boss of Stage 10; the double jump is a later one (Stage 30).

**Crafting job**:
What the Workshop or the Forge is making: one recipe with a build time, one at a time. The Materials and Credit are taken when it starts, the time counts Game time (only while the game is being played), and the result is collected by hand when it is done. A recipe with no build time is made at once.

**Storage chest**:
A chest in the Village Hub holding 40 items. What is in it is never lost on death.

**Held item**:
What the hero visibly holds: nothing in the Village Hub, the equipped weapon in a Stage, and for a moment the matching tool while striking a Resource node or repairing a gate. It is only a picture; reach and damage come from the weapon's stats.

**Mini-boss**:
A stronger enemy at Stage 5 of a Realm that drops one Portal shard (the Cave Guardian also drops crystal). Unlike normal enemies it has special attacks, each announced by a Telegraph. Touching it or being hit by its attack costs one heart, like every other enemy.

**Telegraph**:
The warning an enemy gives before a special attack (a red flash and a mark over its head), long enough for the player to react. An attack never lands without one.

**Strike**:
One press of the interact key on a Resource node. The node gives its Materials only when the last Strike lands; a Strike is refused, and not counted, if the player lacks the tool or the Backpack cannot hold the Materials. Strikes already made are kept until the player leaves the Stage.
_Avoid_: hit (a hit is damage to Health), hp (that is Health)

**Credit**:
The currency earned only by learning (passing a Book exam, Daily Practice, answering the question at the end of a Stage, finishing a Realm's Boss). Killing enemies never gives Credit, and there is no separate coin currency; the Wallet holds Credit only.
_Avoid_: coins, money, gold

**Health**:
The player's hit points, shown as hearts. Dropping to zero sends the player back to the Village Hub (with the Material loss rule), not to a game-over screen. There are no extra lives, scores, or star ratings.
_Avoid_: lives, score, game over

**Material**:
A resource gained by exploring a Stage, or grown from a Seed that exploring gave (wood, stone, iron ore, herb, fiber, crystal, boss core). Credit still comes only from learning. Lost 50% on death or emergency retreat (Seeds too), except story Materials (crystal, boss core, Portal shards and blocks), which are always kept.
_Avoid_: resource (for the item; "Resource node" is the place it is harvested from)

**Portal shard**:
What the Boss (3) and the Mini-boss (1) of a Realm drop every time they are defeated. A story Material of the Realm's colour.

**Portal block**:
Five Portal shards of one colour, plus the Realm's Materials, crafted at the Forge once the Realm's Textbook exam is passed. Placed once in the World Gate, it opens the next Realm for good. A story Material.

**Durability**:
How worn a weapon, tool or Armor piece is. It goes down by one per attack, Strike or hit taken. At zero the item is Broken: it stays in the Backpack but works worse (a weapon does half damage, a tool needs twice the Strikes, Armor gives no Armor hearts). Repaired at the Forge with Materials, never with Credit. The starting wooden sword never wears.
_Avoid_: HP (that is Health)

**Armor**:
Three pieces worn at once (head, body, feet). Each gives Armor hearts; boots may add a little speed. Shown as icons only, not drawn on the hero.

**Armor heart**:
Protection that is lost before Health and comes back when the player returns to the Village Hub.

**Potion**:
A drink made at the Workshop: heal, strength (+50% damage for 60 s), armor (+1 Armor heart) or speed (+30% for 60 s). Drunk from the Quick slot with R (Q swaps the sword).

**Quick slot**:
The one Potion kind chosen in the Backpack to be drunk with R.

**Tutorial step**:
One hint of the first Stage, shown until the thing it teaches has been done (walk, harvest, strike a tree, fight, open the Backpack, finish the Stage, then read, craft and plant in the Village). Defined in `tutorial.json`; done steps are saved.

**Textbook**:
A purchasable Book of short pages for one Realm. Passing its exam unlocks the Recipes tied to it.
_Avoid_: lesson, course

**Village Hub**:
The safe place between Stages with no enemies; the player walks to buildings (Library, Academy, Workshop, Forge, World Gate), the Garden door and the Storage chest and returns here to heal and save.

**Skin**:
A cosmetic look for the player character, bought once with Credit and kept forever. The free default is always owned. Skins change nothing about gameplay. Buying and changing a Skin both happen only at the Skin shop in the Village Hub, never from a menu.
_Avoid_: costume, outfit

**Wallet**:
The player's Credit balance. It holds no other currency.

**Backpack**:
The player's carried items (Materials, tools, weapons, crafted gear) in a fixed number of slots; this is what is at risk when the player dies.

**Broken Gate**:
The gate between the cavern Zone and the boss arena of Stage 10 of Realm 1. It stays closed until the player brings the right tool and a Repair Kit and answers a question from the Realm's Textbook.

**World Gate**:
The gate in the Village Hub that chooses a Stage and holds the ten Portal slots. Placing a Portal block opens the next Realm.

**Game state**:
Everything that makes up one player's game (Wallet, Backpack, Health, Equipment, Textbook progress, Skins, stage progress, settings), held in one `GameState` aggregate. Its members are created once and changed in place when a save is loaded.
_Avoid_: session (the old score-and-lives `GameSession` no longer exists), store, globals

**Content catalog**:
The game's JSON data (items, textbooks, questions, recipes, enemies, stages) loaded and checked once at startup. Rules that depend on what an item is ask the item catalog; screens and scenes read the loaded content and never fetch data themselves.
_Avoid_: data loader, assets (assets are images and sounds)

**Skin shop**:
The only shop in the game, run by the NPC Mina in the Village Hub. It sells Skins for Credit and nothing else (no items, no Materials), so Credit still comes only from learning. Talking to Mina is the only way to open it.
_Avoid_: store, merchant, coin shop (the old coin shop is gone)
