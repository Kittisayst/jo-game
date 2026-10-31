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
import { isNearPit, PIT_END_MARGIN, PIT_START_MARGIN, PIT_WIDTHS, type Pit } from './LevelPits';

export type Biome = 'forest' | 'cave';
export const BIOMES: readonly Biome[] = ['forest', 'cave'];

export interface GenerateSpec
{
    biome: Biome;
    seed: number;
    /** How many screens (800 px each) wide the Stage is. */
    screens: number;
    /** Add a secret ledge that only the air dash reaches (see `placeSecretLedge`). */
    secret?: boolean;
    /** How many pits (gaps in the ground that kill) to cut, when they fit (see `placePits`). */
    pits?: number;
}

export interface GeneratedLevel
{
    level: Level;
    /** Where walking out clears the Stage. */
    exitX: number;
    /** The secret ledge, when one was asked for and fits: its x and the y of the surface to stand on. */
    secret?: { x: number; surfaceY: number };
    /** The pits that were asked for and fit (`level.pits` too); fewer than asked when the Stage has no room. */
    pits: Pit[];
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

/**
 * The secret ledge: a high platform with an edge-to-edge gap to its launch platform of 200 to 230 px: more than
 * a running jump to a platform 72 px higher can cross (about 160 px) and less than a jump with the air dash at its top
 * can (about 270 px), and so high above the
 * ground (160 px, a jump lifts about 107) that it cannot be climbed to either. LevelReachability.test.ts checks
 * these numbers against the real jump and dash.
 */
export const SECRET_GAPS: readonly number[] = [210, 220, 200, 230];
/** No other platform may be nearer than this (edge to edge) to the ledge, so only the air dash gets there. */
export const SECRET_CLEARANCE = 205;
/** Centre y of the secret ledge: 72 px above a high step (an easy jump) but 232 px above the ground and 152 above a low step (too high for one). */
const SECRET_Y = 440;

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

/** How far a pit stays from a platform's centre (half a platform and room to land and run up), a spike and another pit. */
export const PIT_PLATFORM_CLEARANCE = 100;
/** A spike this close to a pit is dropped: the pit is the hazard there. */
export const PIT_SPIKE_CLEARANCE = 120;
export const PIT_PIT_CLEARANCE = 250;
/** How far a node must stand from a pit's edge, and an enemy (its patrol and its chase must not reach the edge). */
export const NODE_PIT_CLEARANCE = 90;
export const ENEMY_PIT_CLEARANCE = 170;

/**
 * Cuts up to `count` pits into the ground: each one of `PIT_WIDTHS` (an easy jump), in the middle of the Stage (not
 * near the start or the exit), clear of every platform and other pit, so the hero can run up and jump. A pit takes
 * the place of the spikes near it (a Stage with pits has those hazards instead of them): `generateLevel` drops them.
 * Every free spot (every 10 px, every width) is listed and one is drawn, so a pit is found whenever there is room.
 * The same seed gives the same pits. Fewer than `count` come back when the Stage has no room.
 */
export function placePits (count: number, seed: number, platforms: { x: number }[], exitX: number): Pit[]
{
    const random = makeRandom(seed ^ 0x9e3779b1);
    const pits: Pit[] = [];
    while (pits.length < count)
    {
        const free: Pit[] = [];
        for (const width of PIT_WIDTHS)
        {
            for (let x = PIT_START_MARGIN; x + width <= exitX - PIT_END_MARGIN; x += 10)
            {
                const right = x + width;
                const clear = platforms.every(p => p.x + PIT_PLATFORM_CLEARANCE <= x || p.x - PIT_PLATFORM_CLEARANCE >= right)
                    && pits.every(q => q.x + q.width + PIT_PIT_CLEARANCE <= x || q.x - PIT_PIT_CLEARANCE >= right);
                if (clear) free.push({ x, width });
            }
        }
        if (free.length === 0) break;
        pits.push(free[Math.floor(random() * free.length)]);
    }
    return pits.sort((a, b) => a.x - b.x);
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

    // The secret ledge is added last and uses no random numbers, so a Stage without one is laid out as before
    const secretX = spec.secret ? placeSecretLedge(platforms, exitX) : undefined;
    const secretPlatforms = secretX === undefined ? [] : [{ x: secretX, y: SECRET_Y }];
    if (secretX !== undefined) platforms.push({ x: secretX, y: SECRET_Y });

    // Pits are cut last, with a random generator of their own, so a Stage without them is laid out as before
    const pits = spec.pits ? placePits(spec.pits, spec.seed, platforms, exitX) : [];
    // A pit takes the place of the spikes close to it
    if (pits.length > 0)
    {
        const kept = spikes.filter(s => pits.every(p => s.x + PIT_SPIKE_CLEARANCE <= p.x || s.x - PIT_SPIKE_CLEARANCE >= p.x + p.width));
        spikes.splice(0, spikes.length, ...kept);
    }

    return {
        level: {
            worldWidth,
            scenery: spec.biome,
            spawn: { x: 80, y: 556 },
            platforms,
            ...(secretPlatforms.length > 0 ? { secretPlatforms } : {}),
            spikes,
            ...(pits.length > 0 ? { pits } : {}),
        },
        exitX,
        pits,
        ...(secretX !== undefined ? { secret: { x: secretX, surfaceY: SECRET_Y - 16 } } : {}),
    };
}

/**
 * Finds the x of a secret ledge: beside a platform, one of `SECRET_GAPS` away from its edge, on the right if that fits
 * and on the left if not, and clear of every other platform. Undefined when no platform has such a spot.
 */
function placeSecretLedge (platforms: { x: number; y: number }[], exitX: number): number | undefined
{
    const minX = START_MARGIN + PLATFORM_WIDTH / 2;
    // The ledge may reach over the exit sign: it is high above it, and the hero walks out below
    const maxX = exitX - 40;
    // Only a high step can launch to the ledge (a low step is too far below it), and only high steps can be jumped to it from
    const high = platforms.filter(p => p.y === HIGH_Y);
    for (const launch of [...high].reverse())
    {
        for (const gap of SECRET_GAPS)
        {
            for (const direction of [1, -1])
            {
                const x = launch.x + direction * (PLATFORM_WIDTH + gap);
                if (x < minX || x > maxX) continue;
                const others = high.filter(p => p !== launch);
                if (others.every(p => Math.abs(p.x - x) - PLATFORM_WIDTH >= SECRET_CLEARANCE)) return x;
            }
        }
    }
    return undefined;
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
    const pits = generated.level.pits ?? [];

    items.forEach((item, i) =>
    {
        const clearance = item.node ? NODE_SPIKE_CLEARANCE : ENEMY_SPIKE_CLEARANCE;
        const centre = from + slice * (i + 0.5) + (random() - 0.5) * slice * 0.4;
        // The clear spot nearest to the middle of the slice
        let spot: number | undefined;
        for (let c = from; c <= to; c += 10)
        {
            if (spikeXs.some(sx => Math.abs(sx - c) < clearance)) continue;
            if (isNearPit(pits, c, item.node ? NODE_PIT_CLEARANCE : ENEMY_PIT_CLEARANCE)) continue;
            if (spot === undefined || Math.abs(c - centre) < Math.abs(spot - centre)) spot = c;
        }
        if (spot === undefined) throw new Error(`No spot clear of the spikes for ${item.id} near x=${Math.round(centre)}`);
        (item.node ? result.nodes : result.enemies).push({ id: item.id, x: spot });
    });

    return result;
}
