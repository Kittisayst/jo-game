/**
 * Pits (ເຫວ): gaps in the ground of a level. The hero who falls in dies (see "Pit" in CONTEXT.md). Pure numbers,
 * no Phaser, so the level builder, the scene, the generator and the tests all read them the same way.
 */

/** A gap in the ground: from `x` (its left edge) for `width` px. */
export interface Pit
{
    x: number;
    width: number;
}

/**
 * The widths a generated pit can have. Every one is within what an easy jump crosses (the same share of a jump
 * the platforms use, see LevelReachability.test.ts), so a pit never needs perfect timing.
 */
export const PIT_WIDTHS: readonly number[] = [90, 100, 110, 115];

/** A pit starts no earlier than this (the waypoint and the first sign stand near the start) and ends this far before the exit. */
export const PIT_START_MARGIN = 380;
export const PIT_END_MARGIN = 200;

/** The solid ground of a level as `[from, to]` spans, left to right, with the pits cut out. */
export function groundSpans (worldWidth: number, pits: readonly Pit[] = []): [number, number][]
{
    const spans: [number, number][] = [];
    let from = 0;
    for (const pit of [...pits].sort((a, b) => a.x - b.x))
    {
        if (pit.x > from) spans.push([from, pit.x]);
        from = Math.max(from, pit.x + pit.width);
    }
    if (from < worldWidth) spans.push([from, worldWidth]);
    return spans;
}

/** True when `x` is over a pit or within `margin` px of one. */
export function isNearPit (pits: readonly Pit[] | undefined, x: number, margin = 0): boolean
{
    return (pits ?? []).some(pit => x > pit.x - margin && x < pit.x + pit.width + margin);
}

/** The pit nearest to `x` (by its edges), or undefined when there is none. */
export function nearestPit (pits: readonly Pit[] | undefined, x: number): Pit | undefined
{
    let best: Pit | undefined;
    let bestDistance = Infinity;
    for (const pit of pits ?? [])
    {
        const distance = x < pit.x ? pit.x - x : x > pit.x + pit.width ? x - (pit.x + pit.width) : 0;
        if (distance < bestDistance)
        {
            best = pit;
            bestDistance = distance;
        }
    }
    return best;
}

/** What is wrong with the pits of a level, or null when they are fine (whole numbers, inside the world, apart). */
export function pitProblem (worldWidth: number, pits: readonly Pit[] | undefined): string | null
{
    if (pits === undefined) return null;
    if (!Array.isArray(pits)) return 'pits must be a list';
    const sorted = [...pits].sort((a, b) => a.x - b.x);
    for (let i = 0; i < sorted.length; i++)
    {
        const { x, width } = sorted[i];
        if (!Number.isFinite(x) || !Number.isFinite(width)) return `pit ${i} needs a number x and a number width`;
        if (width < 40 || width > 400) return `pit at x=${x}: width ${width} must be from 40 to 400`;
        if (x < 200 || x + width > worldWidth - 200) return `pit at x=${x}: it must be at least 200 px from both ends of the world`;
        if (i > 0 && x < sorted[i - 1].x + sorted[i - 1].width + 200) return `pit at x=${x}: it must be at least 200 px from the pit before it`;
    }
    return null;
}
