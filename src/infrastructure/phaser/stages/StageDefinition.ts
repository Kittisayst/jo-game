/**
 * Layout of one Stage as authored in `public/data/stages.json`: its Zones, where
 * Materials can be gathered, where enemies and the boss stand, and the broken gate.
 * Platforms, spikes and the player spawn stay in the level JSON (see Level.ts).
 *
 * `parseStageDefinitions` checks the shape once at load time so a typo in the
 * JSON fails loudly with the offending path instead of as an undefined deep in a scene.
 */

import type { EnemyType } from '../../../domain/entities/Enemy';
import { makeValidators } from '../../content/validate';

export type ResourceNodeType = 'tree' | 'herb' | 'stone' | 'iron-vein';

const RESOURCE_NODE_TYPES: ResourceNodeType[] = ['tree', 'herb', 'stone', 'iron-vein'];
const ENEMY_TYPES: EnemyType[] = ['slime', 'slime-flying', 'slime-armored', 'slime-spitter'];

export interface StageDrop
{
    itemId: string;
    count: number;
}

export interface StageResourceNode
{
    id: string;
    type: ResourceNodeType;
    requiredTool: string | null;
    toolTier: number;
    x: number;
    hp: number;
    drops: StageDrop[];
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

export interface StageZone
{
    id: string;
    name: string;
    startX: number;
    endX: number;
    sign?: StageSign;
    waypoint?: StageWaypoint;
    resourceNodes?: StageResourceNode[];
    enemySpawns?: StageEnemySpawn[];
    gate?: StageGate;
    bossSpawn?: StageBossSpawn;
}

export interface StageDefinition
{
    id: string;
    chapter: number;
    name: string;
    nameEn: string;
    width: number;
    height: number;
    zones: StageZone[];
}

export function getStageEnemySpawns (stage: StageDefinition): StageEnemySpawn[]
{
    return stage.zones.flatMap(zone => zone.enemySpawns ?? []);
}

export function getStageBossSpawn (stage: StageDefinition): StageBossSpawn | undefined
{
    return stage.zones.find(zone => zone.bossSpawn)?.bossSpawn;
}

export function getStageDefinition (stages: StageDefinition[] | undefined, stageId: string): StageDefinition | undefined
{
    return stages?.find(stage => stage.id === stageId);
}

const { asObject, asArray, asString, asNumber, optionalNumber, optionalString, fail } = makeValidators('stages.json');

function parseDrops (value: unknown, path: string): StageDrop[]
{
    return asArray(value, path).map((raw, i) =>
    {
        const drop = asObject(raw, `${path}[${i}]`);
        return {
            itemId: asString(drop.itemId, `${path}[${i}].itemId`),
            count: asNumber(drop.count, `${path}[${i}].count`),
        };
    });
}

function parseNode (raw: unknown, path: string): StageResourceNode
{
    const node = asObject(raw, path);
    const type = node.type as ResourceNodeType;
    if (!RESOURCE_NODE_TYPES.includes(type)) fail(`${path}.type`, `one of ${RESOURCE_NODE_TYPES.join(', ')}`);

    const requiredTool = node.requiredTool === null ? null : asString(node.requiredTool, `${path}.requiredTool`);

    return {
        id: asString(node.id, `${path}.id`),
        type,
        requiredTool,
        toolTier: asNumber(node.toolTier, `${path}.toolTier`),
        x: asNumber(node.x, `${path}.x`),
        hp: asNumber(node.hp, `${path}.hp`),
        drops: parseDrops(node.drops, `${path}.drops`),
    };
}

function parseEnemySpawn (raw: unknown, path: string): StageEnemySpawn
{
    const spawn = asObject(raw, path);
    const type = spawn.type as EnemyType | undefined;
    if (type !== undefined && !ENEMY_TYPES.includes(type)) fail(`${path}.type`, `one of ${ENEMY_TYPES.join(', ')}`);

    return {
        enemyId: asString(spawn.enemyId, `${path}.enemyId`),
        x: asNumber(spawn.x, `${path}.x`),
        y: asNumber(spawn.y, `${path}.y`),
        type,
        patrolDistance: optionalNumber(spawn.patrolDistance, `${path}.patrolDistance`),
        speed: optionalNumber(spawn.speed, `${path}.speed`),
        scale: optionalNumber(spawn.scale, `${path}.scale`),
        sign: optionalString(spawn.sign, `${path}.sign`),
    };
}

function parseZone (raw: unknown, path: string): StageZone
{
    const zone = asObject(raw, path);
    const parsed: StageZone = {
        id: asString(zone.id, `${path}.id`),
        name: asString(zone.name, `${path}.name`),
        startX: asNumber(zone.startX, `${path}.startX`),
        endX: asNumber(zone.endX, `${path}.endX`),
    };

    if (zone.sign !== undefined)
    {
        const sign = asObject(zone.sign, `${path}.sign`);
        parsed.sign = {
            x: asNumber(sign.x, `${path}.sign.x`),
            text: asString(sign.text, `${path}.sign.text`),
            color: optionalString(sign.color, `${path}.sign.color`),
            stroke: optionalString(sign.stroke, `${path}.sign.stroke`),
        };
    }

    if (zone.waypoint !== undefined)
    {
        const wp = asObject(zone.waypoint, `${path}.waypoint`);
        parsed.waypoint = {
            x: asNumber(wp.x, `${path}.waypoint.x`),
            name: asString(wp.name, `${path}.waypoint.name`),
            label: asString(wp.label, `${path}.waypoint.label`),
        };
    }

    if (zone.resourceNodes !== undefined)
    {
        parsed.resourceNodes = asArray(zone.resourceNodes, `${path}.resourceNodes`)
            .map((n, i) => parseNode(n, `${path}.resourceNodes[${i}]`));
    }

    if (zone.enemySpawns !== undefined)
    {
        parsed.enemySpawns = asArray(zone.enemySpawns, `${path}.enemySpawns`)
            .map((e, i) => parseEnemySpawn(e, `${path}.enemySpawns[${i}]`));
    }

    if (zone.gate !== undefined)
    {
        const gate = asObject(zone.gate, `${path}.gate`);
        parsed.gate = {
            id: asString(gate.id, `${path}.gate.id`),
            x: asNumber(gate.x, `${path}.gate.x`),
            requiredTool: asString(gate.requiredTool, `${path}.gate.requiredTool`),
            requiredItem: asString(gate.requiredItem, `${path}.gate.requiredItem`),
            requiresQuiz: gate.requiresQuiz === true,
            quizBookId: asString(gate.quizBookId, `${path}.gate.quizBookId`),
        };
    }

    if (zone.bossSpawn !== undefined)
    {
        const boss = asObject(zone.bossSpawn, `${path}.bossSpawn`);
        parsed.bossSpawn = {
            enemyId: asString(boss.enemyId, `${path}.bossSpawn.enemyId`),
            x: asNumber(boss.x, `${path}.bossSpawn.x`),
            y: asNumber(boss.y, `${path}.bossSpawn.y`),
            banner: optionalString(boss.banner, `${path}.bossSpawn.banner`),
        };
    }

    return parsed;
}

/** Validates the parsed JSON of `stages.json` and returns typed stage definitions. */
export function parseStageDefinitions (raw: unknown): StageDefinition[]
{
    return asArray(raw, 'root').map((rawStage, i) =>
    {
        const path = `stages[${i}]`;
        const stage = asObject(rawStage, path);
        return {
            id: asString(stage.id, `${path}.id`),
            chapter: asNumber(stage.chapter, `${path}.chapter`),
            name: asString(stage.name, `${path}.name`),
            nameEn: asString(stage.nameEn, `${path}.nameEn`),
            width: asNumber(stage.width, `${path}.width`),
            height: asNumber(stage.height, `${path}.height`),
            zones: asArray(stage.zones, `${path}.zones`).map((z, j) => parseZone(z, `${path}.zones[${j}]`)),
        };
    });
}
