/**
 * Builds the platforms, spikes and spawn spots of an ordinary Stage from a biome and a seed, so a Stage
 * does not have to be laid out by hand. The same seed always gives the same Stage. Pure numbers, no Phaser:
 * the result is the same `Level` a hand-written level JSON describes.
 *
 * Platforms come in small stairs (a low step, then a high one) whose gaps stay inside what one jump covers
 * (see LevelReachability.test.ts, which checks this for hundreds of seeds). Spikes sit on bare ground away
 * from platforms, and `placePool` keeps every node and enemy clear of them.
 */

import type { Level } from '../phaser/Level';

export type Biome = 'forest' | 'cave';
export const BIOMES: readonly Biome[] = ['forest', 'cave'];

export interface GenerateSpec
{
    biome: Biome;
    seed: number;
    /** How many screens (800 px each) wide the Stage is. */
    screens: number;
}

export interface GeneratedLevel
{
    level: Level;
    /** Where walking out clears the Stage. */
    exitX: number;
}

export const SCREEN_WIDTH = 800;
export const MIN_SCREENS = 2;
export const MAX_SCREENS = 8;

const EXIT_MARGIN = 100;
/** Nothing is placed before this x: the waypoint and the first sign stand near the start. */
const START_MARGIN = 300;
/** Centre y of a low and of a high step (the ground top is 656; a platform's surface is 16 px above its centre). */
const LOW_Y = 592;
const HIGH_Y = 512;
const PLATFORM_WIDTH = 160;
const SPIKE_Y = 624;
/** A stair starts at least this far before the world's end so even a long one fits (3 steps ~ 500 px). */
const PLATFORM_ROW_MARGIN = 600;
/** How far a node must stand from a spike so the hero is never pushed onto it, and an enemy so its patrol stays clear. */
export const NODE_SPIKE_CLEARANCE = 110;
export const ENEMY_SPIKE_CLEARANCE = 150;

interface BiomeTuning
{
    /** Chance that a stair has a third step. */
    longStair: number;
    /** Bare ground between two stairs (px). */
    groundMin: number;
    groundMax: number;
    /** Spikes per screen. */
    spikesPerScreen: number;
}

const TUNING: Record<Biome, BiomeTuning> = {
    forest: { longStair: 0.25, groundMin: 260, groundMax: 420, spikesPerScreen: 0.5 },
    cave: { longStair: 0.5, groundMin: 200, groundMax: 340, spikesPerScreen: 1 },
};

/** A small deterministic random number generator (mulberry32). */
export function makeRandom (seed: number): () => number
{
    let state = seed >>> 0;
    return () =>
    {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function between (random: () => number, min: number, max: number): number
{
    return Math.round(min + random() * (max - min));
}

export function generateLevel (spec: GenerateSpec): GeneratedLevel
{
    if (!BIOMES.includes(spec.biome)) throw new Error(`Unknown biome ${spec.biome}`);
    if (!Number.isInteger(spec.seed)) throw new Error('A Stage seed must be a whole number');
    if (!Number.isInteger(spec.screens) || spec.screens < MIN_SCREENS || spec.screens > MAX_SCREENS)
    {
        throw new Error(`A generated Stage is ${MIN_SCREENS} to ${MAX_SCREENS} screens wide, got ${spec.screens}`);
    }

    const random = makeRandom(spec.seed);
    const tuning = TUNING[spec.biome];
    const worldWidth = spec.screens * SCREEN_WIDTH;
    const exitX = worldWidth - EXIT_MARGIN;

    const platforms: { x: number; y: number }[] = [];
    let x = START_MARGIN + between(random, 60, 160);
    let first = true;
    while (x < worldWidth - PLATFORM_ROW_MARGIN)
    {
        // The first stair always climbs to a high step so every Stage has a way up
        const steps = first || random() < tuning.longStair ? [LOW_Y, HIGH_Y, LOW_Y] : [LOW_Y, HIGH_Y];
        const take = first ? 2 : steps.length;
        for (let i = 0; i < take; i++)
        {
            platforms.push({ x, y: steps[i] });
            if (i < take - 1) x += PLATFORM_WIDTH + between(random, 30, 90);
        }
        first = false;
        x += PLATFORM_WIDTH + between(random, tuning.groundMin, tuning.groundMax);
    }

    const platformXs = platforms.map(p => p.x);
    const spikeCount = Math.round(tuning.spikesPerScreen * spec.screens);
    const spikes: { x: number; y: number }[] = [];
    for (let attempt = 0; attempt < spikeCount * 20 && spikes.length < spikeCount; attempt++)
    {
        const candidate = between(random, START_MARGIN + 150, exitX - 250);
        const clear = platformXs.every(px => Math.abs(px - candidate) >= 160)
            && spikes.every(s => Math.abs(s.x - candidate) >= 300);
        if (clear) spikes.push({ x: candidate, y: SPIKE_Y });
    }
    spikes.sort((a, b) => a.x - b.x);

    return {
        level: {
            worldWidth,
            scenery: spec.biome,
            spawn: { x: 80, y: 556 },
            platforms,
            spikes,
        },
        exitX,
    };
}

export interface PoolSpec
{
    nodes: string[];
    nodeCount: number;
    enemies: string[];
    enemyCount: number;
}

export interface PoolPlacement
{
    nodes: { id: string; x: number }[];
    enemies: { id: string; x: number }[];
}

function shuffled<T> (items: T[], random: () => number): T[]
{
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--)
    {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/** Every listed id appears at least once (when `count` allows), the rest repeat in list order. */
function pick (ids: string[], count: number): string[]
{
    return Array.from({ length: count }, (_, i) => ids[i % ids.length]);
}

/**
 * Chooses the ground spots for the nodes and enemies of a spawn pool. The walkable stretch is cut into one
 * slice per item so nothing bunches up, each item stands somewhere inside its slice, and a spot too close to a
 * spike is moved sideways until it is clear. Throws when the Stage is too short for that many items.
 */
export function placePool (generated: GeneratedLevel, pool: PoolSpec, seed: number): PoolPlacement
{
    const random = makeRandom(seed);
    const total = pool.nodeCount + pool.enemyCount;
    const result: PoolPlacement = { nodes: [], enemies: [] };
    if (total === 0) return result;

    const from = START_MARGIN;
    const to = generated.exitX - 150;
    const slice = (to - from) / total;
    if (slice < 110) throw new Error(`${total} items do not fit between x=${from} and x=${to}`);

    const items = shuffled([
        ...pick(pool.nodes, pool.nodeCount).map(id => ({ id, node: true })),
        ...pick(pool.enemies, pool.enemyCount).map(id => ({ id, node: false })),
    ], random);
    const spikeXs = (generated.level.spikes ?? []).map(s => s.x);

    items.forEach((item, i) =>
    {
        const clearance = item.node ? NODE_SPIKE_CLEARANCE : ENEMY_SPIKE_CLEARANCE;
        const centre = from + slice * (i + 0.5) + (random() - 0.5) * slice * 0.4;
        // The clear spot nearest to the middle of the slice
        let spot: number | undefined;
        for (let c = from; c <= to; c += 10)
        {
            if (spikeXs.some(sx => Math.abs(sx - c) < clearance)) continue;
            if (spot === undefined || Math.abs(c - centre) < Math.abs(spot - centre)) spot = c;
        }
        if (spot === undefined) throw new Error(`No spot clear of the spikes for ${item.id} near x=${Math.round(centre)}`);
        (item.node ? result.nodes : result.enemies).push({ id: item.id, x: spot });
    });

    return result;
}
