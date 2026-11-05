/**
 * Where the decor of a level stands. Pure numbers, no Phaser. A level JSON may list its own `decor` (then that
 * list is used as written); otherwise the pieces are scattered from a seed, so a level looks the same every time
 * and the scatter never changes the layout, the nodes or the enemies (decor has no collision).
 */

import { makeRandom } from './StageGenerator';
import type { DecorKind, SceneryTheme } from './SceneryCatalog';

export interface DecorPlacement
{
    /** A `DecorKind.id` of the theme. */
    id: string;
    x: number;
    flip?: boolean;
}

export interface DecorInput
{
    worldWidth: number;
    /** `Level.decor`: the author's own list (an empty list means no decor). */
    authored?: DecorPlacement[];
    /** `Level.decorPerScreen`: pieces per 800 px screen instead of the theme's number (0 = none). */
    perScreen?: number;
    /** Places to keep clear (nodes, enemies, signs, waypoints, the exit, the start), with how wide each is (px). */
    avoid?: { x: number; clear: number }[];
    /** Gaps in the ground: nothing stands over them. */
    pits?: { x: number; width: number }[];
    /** Raised ground: nothing stands in or against it. */
    terrain?: { x: number; width: number }[];
    /** Spikes: nothing stands on them. */
    spikes?: { x: number }[];
}

const SCREEN = 800;
/** Two pieces are never closer than this (px, centre to centre). */
export const DECOR_MIN_GAP = 70;
const EDGE_MARGIN = 40;
const SPIKE_CLEAR = 60;
const PIT_CLEAR = 30;
const TERRAIN_CLEAR = 40;

/** A small stable number out of a text, so a level's key gives it its own scatter. */
export function seedOf (text: string): number
{
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return hash >>> 0;
}

export function placeDecor (theme: SceneryTheme, input: DecorInput, seed: number): DecorPlacement[]
{
    if (input.authored) return input.authored.filter(p => theme.decor.items.some(k => k.id === p.id));

    const perScreen = input.perScreen ?? theme.decor.perScreen;
    const wanted = Math.round(perScreen * input.worldWidth / SCREEN);
    if (wanted <= 0 || theme.decor.items.length === 0) return [];

    const random = makeRandom(seed ^ 0x5bd1e995);
    const bag: DecorKind[] = theme.decor.items.flatMap(kind => Array.from({ length: kind.weight }, () => kind));
    const avoid = input.avoid ?? [];
    const placed: DecorPlacement[] = [];

    for (let attempt = 0; attempt < wanted * 25 && placed.length < wanted; attempt++)
    {
        const x = Math.round(EDGE_MARGIN + random() * (input.worldWidth - 2 * EDGE_MARGIN));
        const kind = bag[Math.floor(random() * bag.length)];
        const flip = random() < 0.5;
        const clear = placed.every(p => Math.abs(p.x - x) >= DECOR_MIN_GAP)
            && avoid.every(a => Math.abs(a.x - x) >= a.clear)
            && (input.spikes ?? []).every(s => Math.abs(s.x - x) >= SPIKE_CLEAR)
            && (input.terrain ?? []).every(t => x < t.x - TERRAIN_CLEAR || x > t.x + t.width + TERRAIN_CLEAR)
            && (input.pits ?? []).every(pit => x < pit.x - PIT_CLEAR || x > pit.x + pit.width + PIT_CLEAR);
        if (clear) placed.push({ id: kind.id, x, ...(flip ? { flip } : {}) });
    }
    return placed.sort((a, b) => a.x - b.x);
}
