/**
 * Layout of every Stage as authored in `public/data/stages.json`. Everything in a Stage is an entry of
 * a Zone's `contents`, told apart by its `kind` (node, enemy, miniboss, boss, sign, waypoint, gate, exit).
 * Platforms, spikes and the player spawn stay in the level JSON named by `layout` (see Level.ts), or, for an
 * ordinary Stage, are generated from `layout: { "generate": { biome, seed, screens } }` (see StageGenerator.ts),
 * in which case a `spawn-pool` entry scatters nodes and enemies over the generated ground.
 *
 * `parseStageDefinitions` checks the shape once at load time so a typo in the JSON fails loudly with the
 * offending path instead of as an undefined deep in a scene, and turns the `contents` of each Zone into the
 * lists the scene builds from (nodes with their kind already resolved from `nodes.json`, enemy spawns, signs…).
 */

import type { EnemyType } from '../../../domain/entities/Enemy';
import {
    BOSS_STAGE_IN_REALM,
    MINIBOSS_STAGE_IN_REALM,
    positionInRealm,
    realmOf,
    stageOfLesson,
    stageIdOf,
    STAGE_COUNT,
} from '../../../domain/entities/StageNumber';
import { NodeDefinition, NodeSeed, parseDrops, parseSeed, StageDrop } from '../../content/NodeCatalog';
import {
    BIOMES, Biome, GeneratedLevel, generateLevel, placePool,
} from '../../content/StageGenerator';
import { makeValidators } from '../../content/validate';

export type { StageDrop };

const ENEMY_TYPES: EnemyType[] = ['slime', 'slime-flying', 'slime-armored', 'slime-spitter'];
export const STAGE_CONTENT_KINDS = [
    'node', 'enemy', 'miniboss', 'boss', 'sign', 'waypoint', 'gate', 'exit', 'spawn-pool',
] as const;
export type StageContentKind = typeof STAGE_CONTENT_KINDS[number];
/** Where enemies stand when a Stage does not say (the top of the ground minus the enemy). */
const DEFAULT_ENEMY_Y = 580;

export interface StageResourceNode
{
    id: string;
    /** Id of the kind in `nodes.json`, such as `oak-tree`. */
    type: string;
    label: string;
    icon: string;
    texture: string;
    reach: number;
    requiredTool: string | null;
    toolTier: number;
    x: number;
    /** The y of the surface it stands on when that is not the ground (a node on the secret ledge). */
    surfaceY?: number;
    /** True for the reward on the secret ledge. */
    secret?: boolean;
    /** How many Strikes it takes to deplete the node (see "Strike" in CONTEXT.md). */
    strikes: number;
    drops: StageDrop[];
    /** The Seed this plant may drop, from `nodes.json` or the Stage's override. */
    seed?: NodeSeed;
    /** Minutes before a harvested small plant is grown again (from `nodes.json`). */
    regrowMinutes?: number;
}

export interface StageEnemySpawn
{
    /** Key into `enemies.json`; supplies HP and drops. */
    enemyId: string;
    x: number;
    y: number;
    type?: EnemyType;
    patrolDistance?: number;
    speed?: number;
    scale?: number;
    /** Warning text floating above the spawn, used for the miniboss. */
    sign?: string;
    /** True for `kind: "miniboss"`. */
    miniboss: boolean;
}

export interface StageBossSpawn
{
    enemyId: string;
    x: number;
    y: number;
    /** Title banner shown at the top of the arena. */
    banner?: string;
}

export interface StageWaypoint
{
    x: number;
    /** Name shown in the prompt and passed to the waypoint modal. */
    name: string;
    /** Floating text above the waypoint orb. */
    label: string;
}

export interface StageSign
{
    x: number;
    text: string;
    color?: string;
    stroke?: string;
}

export interface StageGate
{
    id: string;
    x: number;
    requiredTool: string;
    requiredItem: string;
    requiresQuiz: boolean;
    quizBookId: string;
}

/** Walking to this x clears the Stage (a Stage with a Boss is cleared by the Boss instead). */
export interface StageExit
{
    x: number;
}

export interface StageZone
{
    id: string;
    name: string;
    signs: StageSign[];
    waypoints: StageWaypoint[];
    resourceNodes: StageResourceNode[];
    enemySpawns: StageEnemySpawn[];
    gate?: StageGate;
    bossSpawn?: StageBossSpawn;
    exit?: StageExit;
}

export interface StageDefinition
{
    /** `stage-001` … `stage-100`. */
    id: string;
    number: number;
    realm: number;
    /** `placeholder` Stages are shown grey on the map and cannot be entered. */
    status: 'ready' | 'placeholder';
    name: string;
    nameEn: string;
    /** Path of the level JSON (platforms, spikes, world width), null for a placeholder or a generated Stage. */
    layout: string | null;
    /** The level built from `layout.generate`, for a generated Stage. */
    generated?: GeneratedLevel;
    /** Lesson numbers (`3-1`) the question at the end of this Stage is drawn from. */
    lessons: string[];
    /** A safe Stage (the first one): dying in it loses no Materials. */
    safe: boolean;
    /** False when night creatures never walk this Stage (`"night": false` in `stages.json`). */
    night: boolean;
    zones: StageZone[];
}

export function isStageReady (stage: StageDefinition): boolean
{
    return stage.status === 'ready';
}

export function getStageEnemySpawns (stage: StageDefinition): StageEnemySpawn[]
{
    return stage.zones.flatMap(zone => zone.enemySpawns);
}

export function getStageBossSpawn (stage: StageDefinition): StageBossSpawn | undefined
{
    return stage.zones.find(zone => zone.bossSpawn)?.bossSpawn;
}

export function getStageExit (stage: StageDefinition): StageExit | undefined
{
    return stage.zones.find(zone => zone.exit)?.exit;
}

export function getStageDefinition (stages: StageDefinition[] | undefined, stageId: string): StageDefinition | undefined
{
    return stages?.find(stage => stage.id === stageId);
}

const v = makeValidators('stages.json');
const { asObject, asArray, asString, asNumber, optionalNumber, optionalString, fail } = v;

function placeholder (number: number): StageDefinition
{
    return {
        id: stageIdOf(number),
        number,
        realm: realmOf(number),
        status: 'placeholder',
        name: `ດ່ານ ${number}`,
        nameEn: `Stage ${number}`,
        layout: null,
        lessons: [],
        safe: false,
        night: false,
        zones: [],
    };
}

function parseNode (
    entry: Record<string, unknown>,
    path: string,
    nodes: ReadonlyMap<string, NodeDefinition>,
    placement?: { surfaceY: number; secret: boolean }
): StageResourceNode
{
    const nodeId = asString(entry.node, `${path}.node`);
    const kind = nodes.get(nodeId);
    if (!kind) fail(`${path}.node`, `an id from nodes.json (${[...nodes.keys()].join(', ')}), got ${nodeId}`);

    const x = asNumber(entry.x, `${path}.x`);
    let strikes = kind!.strikes;
    let drops = kind!.drops;
    let seed = kind!.seed;
    if (entry.overrides !== undefined)
    {
        const overrides = asObject(entry.overrides, `${path}.overrides`);
        for (const key of Object.keys(overrides))
        {
            if (key !== 'strikes' && key !== 'drops' && key !== 'seed') fail(`${path}.overrides.${key}`, 'one of strikes, drops, seed');
        }
        if (overrides.strikes !== undefined)
        {
            strikes = asNumber(overrides.strikes, `${path}.overrides.strikes`);
            if (!Number.isInteger(strikes) || strikes < 1) fail(`${path}.overrides.strikes`, 'a whole number of Strikes, at least 1');
        }
        if (overrides.drops !== undefined) drops = parseDrops(v, overrides.drops, `${path}.overrides.drops`);
        if (overrides.seed !== undefined) seed = parseSeed(v, overrides.seed, `${path}.overrides.seed`);
    }

    return {
        id: optionalString(entry.id, `${path}.id`) ?? `${nodeId}-${x}`,
        type: nodeId,
        label: kind!.label,
        icon: kind!.icon,
        texture: kind!.texture,
        reach: kind!.reach,
        requiredTool: kind!.requiredTool,
        toolTier: kind!.toolTier,
        x,
        ...(placement ? { surfaceY: placement.surfaceY, secret: placement.secret } : {}),
        strikes,
        drops,
        ...(seed ? { seed } : {}),
        ...(kind!.regrowMinutes !== undefined ? { regrowMinutes: kind!.regrowMinutes } : {}),
    };
}

function parseEnemy (entry: Record<string, unknown>, path: string, miniboss: boolean): StageEnemySpawn
{
    const type = entry.type as EnemyType | undefined;
    if (type !== undefined && !ENEMY_TYPES.includes(type)) fail(`${path}.type`, `one of ${ENEMY_TYPES.join(', ')}`);

    return {
        enemyId: asString(entry.enemy, `${path}.enemy`),
        x: asNumber(entry.x, `${path}.x`),
        y: optionalNumber(entry.y, `${path}.y`) ?? DEFAULT_ENEMY_Y,
        type,
        patrolDistance: optionalNumber(entry.patrolDistance, `${path}.patrolDistance`),
        speed: optionalNumber(entry.speed, `${path}.speed`),
        scale: optionalNumber(entry.scale, `${path}.scale`),
        sign: optionalString(entry.sign, `${path}.sign`),
        miniboss,
    };
}

/** What a Zone needs from the generated level of its Stage, to expand `spawn-pool` and an `exit` without an x. */
interface GeneratedContext
{
    generated: GeneratedLevel;
    /** Seed of the pool in this Zone: the Stage's seed plus a step per Zone. */
    poolSeed: number;
}

function parseSpawnPool (
    entry: Record<string, unknown>,
    path: string,
    nodes: ReadonlyMap<string, NodeDefinition>,
    context: GeneratedContext | undefined,
    parsed: StageZone
): void
{
    if (!context) fail(path, 'used only in a Stage with a generated layout ("layout": { "generate": ... })');

    const nodeIds = asArray(entry.nodes ?? [], `${path}.nodes`).map((id, i) => asString(id, `${path}.nodes[${i}]`));
    const enemyIds = asArray(entry.enemies ?? [], `${path}.enemies`).map((id, i) => asString(id, `${path}.enemies[${i}]`));
    const nodeCount = optionalNumber(entry.count, `${path}.count`) ?? 0;
    const enemyCount = optionalNumber(entry.enemyCount, `${path}.enemyCount`) ?? 0;
    if (!Number.isInteger(nodeCount) || nodeCount < 0) fail(`${path}.count`, 'a whole number of nodes, 0 or more');
    if (!Number.isInteger(enemyCount) || enemyCount < 0) fail(`${path}.enemyCount`, 'a whole number of enemies, 0 or more');
    if (nodeCount > 0 && nodeIds.length === 0) fail(`${path}.nodes`, 'a list of node ids when count is more than 0');
    if (enemyCount > 0 && enemyIds.length === 0) fail(`${path}.enemies`, 'a list of enemy ids when enemyCount is more than 0');

    let placed;
    try
    {
        placed = placePool(
            context!.generated,
            { nodes: nodeIds, nodeCount, enemies: enemyIds, enemyCount },
            context!.poolSeed
        );
    }
    catch (error)
    {
        fail(path, `a pool that fits the generated Stage (${(error as Error).message})`);
    }

    for (const node of placed!.nodes)
    {
        parsed.resourceNodes.push(parseNode({ node: node.id, x: node.x }, path, nodes));
    }
    for (const enemy of placed!.enemies)
    {
        parsed.enemySpawns.push(parseEnemy({
            enemy: enemy.id,
            x: enemy.x,
            type: entry.enemyType,
            patrolDistance: entry.patrolDistance,
            speed: entry.speed,
        }, path, false));
    }
}

function parseZone (
    raw: unknown,
    path: string,
    nodes: ReadonlyMap<string, NodeDefinition>,
    context?: GeneratedContext
): StageZone
{
    const zone = asObject(raw, path);
    const parsed: StageZone = {
        id: asString(zone.id, `${path}.id`),
        name: asString(zone.name, `${path}.name`),
        signs: [],
        waypoints: [],
        resourceNodes: [],
        enemySpawns: [],
    };

    asArray(zone.contents, `${path}.contents`).forEach((rawEntry, i) =>
    {
        const entryPath = `${path}.contents[${i}]`;
        const entry = asObject(rawEntry, entryPath);
        const kind = entry.kind as StageContentKind;
        if (!STAGE_CONTENT_KINDS.includes(kind)) fail(`${entryPath}.kind`, `one of ${STAGE_CONTENT_KINDS.join(', ')}`);

        switch (kind)
        {
            case 'node':
                if (entry.secret === true)
                {
                    // The reward of the secret ledge: its place comes from the generated level
                    const secret = context?.generated.secret;
                    if (!secret) fail(`${entryPath}.secret`, 'used only in a Stage whose layout asks for a secret ledge ("generate": { ..., "secret": true }) and where one fits');
                    parsed.resourceNodes.push(parseNode({ ...entry, x: secret!.x }, entryPath, nodes, { surfaceY: secret!.surfaceY, secret: true }));
                }
                else
                {
                    parsed.resourceNodes.push(parseNode(entry, entryPath, nodes));
                }
                break;
            case 'enemy':
                parsed.enemySpawns.push(parseEnemy(entry, entryPath, false));
                break;
            case 'miniboss':
                parsed.enemySpawns.push(parseEnemy(entry, entryPath, true));
                break;
            case 'boss':
                if (parsed.bossSpawn) fail(entryPath, 'the only boss of its zone');
                parsed.bossSpawn = {
                    enemyId: asString(entry.enemy, `${entryPath}.enemy`),
                    x: asNumber(entry.x, `${entryPath}.x`),
                    y: asNumber(entry.y, `${entryPath}.y`),
                    banner: optionalString(entry.banner, `${entryPath}.banner`),
                };
                break;
            case 'sign':
                parsed.signs.push({
                    x: asNumber(entry.x, `${entryPath}.x`),
                    text: asString(entry.text, `${entryPath}.text`),
                    color: optionalString(entry.color, `${entryPath}.color`),
                    stroke: optionalString(entry.stroke, `${entryPath}.stroke`),
                });
                break;
            case 'waypoint': {
                const name = asString(entry.name, `${entryPath}.name`);
                parsed.waypoints.push({
                    x: asNumber(entry.x, `${entryPath}.x`),
                    name,
                    label: optionalString(entry.label, `${entryPath}.label`) ?? `🌀 ${name}`,
                });
                break;
            }
            case 'gate':
                if (parsed.gate) fail(entryPath, 'the only gate of its zone');
                parsed.gate = {
                    id: asString(entry.id, `${entryPath}.id`),
                    x: asNumber(entry.x, `${entryPath}.x`),
                    requiredTool: asString(entry.requiredTool, `${entryPath}.requiredTool`),
                    requiredItem: asString(entry.requiredItem, `${entryPath}.requiredItem`),
                    requiresQuiz: entry.requiresQuiz === true,
                    quizBookId: asString(entry.quizBookId, `${entryPath}.quizBookId`),
                };
                break;
            case 'exit':
                if (parsed.exit) fail(entryPath, 'the only exit of its zone');
                parsed.exit = {
                    x: entry.x === undefined && context
                        ? context.generated.exitX
                        : asNumber(entry.x, `${entryPath}.x`),
                };
                break;
            case 'spawn-pool':
                parseSpawnPool(entry, entryPath, nodes, context, parsed);
                break;
        }
    });

    return parsed;
}

function parseGenerate (raw: unknown, path: string): { biome: Biome; seed: number; screens: number; secret: boolean }
{
    const generate = asObject(asObject(raw, path).generate, `${path}.generate`);
    const biome = asString(generate.biome, `${path}.generate.biome`) as Biome;
    if (!BIOMES.includes(biome)) fail(`${path}.generate.biome`, `one of ${BIOMES.join(', ')}`);
    const seed = asNumber(generate.seed, `${path}.generate.seed`);
    if (!Number.isInteger(seed)) fail(`${path}.generate.seed`, 'a whole number');
    const screens = asNumber(generate.screens, `${path}.generate.screens`);
    if (generate.secret !== undefined && typeof generate.secret !== 'boolean') fail(`${path}.generate.secret`, 'true or false');
    return { biome, seed, screens, secret: generate.secret === true };
}

function parseStage (raw: unknown, index: number, nodes: ReadonlyMap<string, NodeDefinition>): StageDefinition
{
    const path = `stages[${index}]`;
    const entry = asObject(raw, path);
    const number = asNumber(entry.number, `${path}.number`);
    if (number !== index + 1) fail(`${path}.number`, `${index + 1} (stages are listed in order, 1 to ${STAGE_COUNT})`);
    const realm = asNumber(entry.realm, `${path}.realm`);
    if (realm !== realmOf(number)) fail(`${path}.realm`, `${realmOf(number)} for stage ${number}`);

    if (entry.status !== 'ready' && entry.status !== 'placeholder') fail(`${path}.status`, 'ready or placeholder');
    if (entry.status === 'placeholder') return placeholder(number);

    const generate = typeof entry.layout === 'object' && entry.layout !== null
        ? parseGenerate(entry.layout, `${path}.layout`)
        : undefined;
    const generated = generate ? generateLevel(generate) : undefined;

    const stage: StageDefinition = {
        id: stageIdOf(number),
        number,
        realm,
        status: 'ready',
        name: asString(entry.name, `${path}.name`),
        nameEn: asString(entry.nameEn, `${path}.nameEn`),
        layout: generate ? null : asString(entry.layout, `${path}.layout`),
        generated,
        safe: entry.safe === true,
        night: entry.night !== false,
        lessons: asArray(entry.lessons ?? [], `${path}.lessons`).map((lesson, j) =>
        {
            const text = asString(lesson, `${path}.lessons[${j}]`);
            if (stageOfLesson(text) !== number) fail(`${path}.lessons[${j}]`, `a lesson number of stage ${number}, written ${number}-<order>`);
            return text;
        }),
        zones: asArray(entry.zones, `${path}.zones`).map((z, j) => parseZone(
            z,
            `${path}.zones[${j}]`,
            nodes,
            generated && generate ? { generated, poolSeed: generate.seed + j * 131 } : undefined
        )),
    };
    if (stage.zones.length === 0) fail(`${path}.zones`, 'at least one zone');

    if (generate?.secret && !generated?.secret) fail(`${path}.layout.generate.secret`, 'a secret ledge that fits this Stage (try another seed or more screens)');
    if (generated?.secret)
    {
        const rewards = stage.zones.flatMap(z => z.resourceNodes).filter(n => n.secret).length;
        if (rewards !== 1) fail(`${path}.zones`, 'exactly one node with "secret": true (the reward on the secret ledge)');
    }

    const spawns = getStageEnemySpawns(stage);
    const minibosses = spawns.filter(s => s.miniboss).length;
    const hasBoss = getStageBossSpawn(stage) !== undefined;
    const position = positionInRealm(number);

    if (minibosses > 0 && position !== MINIBOSS_STAGE_IN_REALM) fail(`${path}.zones`, `without a miniboss (only stage ${MINIBOSS_STAGE_IN_REALM} of a realm has one)`);
    if (position === MINIBOSS_STAGE_IN_REALM && minibosses !== 1) fail(`${path}.zones`, 'exactly one miniboss (stage 5 of a realm)');
    if (hasBoss && position !== BOSS_STAGE_IN_REALM) fail(`${path}.zones`, `without a boss (only stage ${BOSS_STAGE_IN_REALM} of a realm has one)`);
    if (position === BOSS_STAGE_IN_REALM && !hasBoss) fail(`${path}.zones`, 'a boss (stage 10 of a realm)');
    const exits = stage.zones.filter(z => z.exit).length;
    if (exits === 0 && !hasBoss) fail(`${path}.zones`, 'an exit or a boss, or the stage cannot be cleared');
    if (exits > 0 && hasBoss) fail(`${path}.zones`, 'either an exit or a boss, not both');

    const nodeIds = new Set<string>();
    for (const node of stage.zones.flatMap(z => z.resourceNodes))
    {
        if (nodeIds.has(node.id)) fail(`${path}.zones`, `with unique node ids (${node.id} appears twice, give one an "id")`);
        nodeIds.add(node.id);
    }
    return stage;
}

/**
 * Validates the parsed JSON of `stages.json` and returns the 100 Stages in order. `nodes` are the kinds from
 * `nodes.json` that `{ "kind": "node" }` entries refer to.
 */
export function parseStageDefinitions (raw: unknown, nodes: readonly NodeDefinition[]): StageDefinition[]
{
    const nodeMap = new Map(nodes.map(node => [node.id, node] as const));
    const list = asArray(asObject(raw, 'root').stages, 'stages');
    if (list.length !== STAGE_COUNT) fail('stages', `exactly ${STAGE_COUNT} entries, got ${list.length}`);
    return list.map((entry, i) => parseStage(entry, i, nodeMap));
}
