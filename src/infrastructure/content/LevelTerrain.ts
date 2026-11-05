/**
 * Raised ground ("terrain"): solid blocks that stand on the ground of a level, so the ground has levels, walls to
 * wall-slide and wall-jump on, and ledges to grab. Pure numbers, no Phaser, so the builder, the generator, the
 * scene and the tests all read them the same way. Blocks are solid on every side (unlike a platform, which can be
 * jumped through from below).
 */

/** One block: `x` is its left edge, `width` and `height` are whole tiles (see `TERRAIN_TILE`); it stands on the ground. */
export interface TerrainBlock
{
    x: number;
    width: number;
    height: number;
}

export const TERRAIN_TILE = 64;
/** The tallest block (3 tiles). Taller than a jump plus a ledge grab is a wall to climb by wall-jumping, so every block must also be climbable by steps (below). */
export const TERRAIN_MAX_HEIGHT = 192;
/** The most the ground may rise from one block (or the ground) to the next that touches it: one tile is an easy jump. */
export const TERRAIN_MAX_STEP = TERRAIN_TILE;

/** A terrain piece starts no earlier than this and ends this far before the exit (the waypoint and the first sign stand near the start). */
export const TERRAIN_START_MARGIN = 420;
export const TERRAIN_END_MARGIN = 320;

/** How far a node must stand from a block's side (px), and an enemy (its patrol must not reach the wall). */
export const NODE_TERRAIN_CLEARANCE = 60;
export const ENEMY_TERRAIN_CLEARANCE = 150;
/** A spike this close to a block is dropped: the block is the hazard there. */
export const SPIKE_TERRAIN_CLEARANCE = 100;

/** True when `x` is over a block or within `margin` px of one. */
export function isNearTerrain (terrain: readonly TerrainBlock[] | undefined, x: number, margin = 0): boolean
{
    return (terrain ?? []).some(b => x > b.x - margin && x < b.x + b.width + margin);
}

/** The height of the ground at `x`: 0 on the flat ground, else the height of the block over it. */
export function terrainHeightAt (terrain: readonly TerrainBlock[] | undefined, x: number): number
{
    return Math.max(0, ...(terrain ?? []).filter(b => x >= b.x && x < b.x + b.width).map(b => b.height));
}

/**
 * What is wrong with the terrain of a level, or null when it is fine: whole tiles, inside the world and away from
 * its ends, blocks neither overlapping nor over a pit, and every block climbable by steps of at most one tile from
 * a side (the ground, or the block that touches it), so nothing needs perfect play or a wall to climb.
 */
export function terrainProblem (
    worldWidth: number,
    terrain: readonly TerrainBlock[] | undefined,
    pits: readonly { x: number; width: number }[] = []
): string | null
{
    if (terrain === undefined) return null;
    if (!Array.isArray(terrain)) return 'terrain must be a list';
    const sorted = [...terrain].sort((a, b) => a.x - b.x);
    for (let i = 0; i < sorted.length; i++)
    {
        const { x, width, height } = sorted[i];
        const at = `terrain block at x=${x}`;
        if (![x, width, height].every(Number.isFinite)) return `terrain block ${i} needs a number x, width and height`;
        if (width < TERRAIN_TILE || width % TERRAIN_TILE !== 0) return `${at}: width ${width} must be a whole number of tiles (${TERRAIN_TILE} px each)`;
        if (height < TERRAIN_TILE || height % TERRAIN_TILE !== 0 || height > TERRAIN_MAX_HEIGHT) return `${at}: height ${height} must be 1 to ${TERRAIN_MAX_HEIGHT / TERRAIN_TILE} tiles (${TERRAIN_TILE} px each)`;
        if (x < TERRAIN_START_MARGIN || x + width > worldWidth - TERRAIN_END_MARGIN) return `${at}: it must be at least ${TERRAIN_START_MARGIN} px from the start and ${TERRAIN_END_MARGIN} px from the end of the world`;
        if (i > 0 && x < sorted[i - 1].x + sorted[i - 1].width) return `${at}: it overlaps the block before it`;
        if (pits.some(p => x < p.x + p.width + 200 && x + width > p.x - 200)) return `${at}: it must be at least 200 px from a pit`;

        // Climbable from the left or the right: the neighbour that touches it (or the ground) is at most one step lower
        const left = i > 0 && sorted[i - 1].x + sorted[i - 1].width === x ? sorted[i - 1].height : 0;
        const right = i < sorted.length - 1 && sorted[i + 1].x === x + width ? sorted[i + 1].height : 0;
        if (height - left > TERRAIN_MAX_STEP && height - right > TERRAIN_MAX_STEP) return `${at}: it rises more than one tile from both sides (add a lower block beside it)`;
    }
    return null;
}

/**
 * Cuts up to `count` pieces of raised ground into a level, each a small hill or a mound (a step up, a higher top, a
 * step down), clear of every platform, pit and other piece so nothing else has to change height. Every free spot
 * (every 16 px, every shape) is listed and one is drawn, so a piece is found whenever there is room. `random`
 * must be its own generator, so a Stage without terrain is laid out as before. Fewer than `count` pieces come back
 * when the Stage has no room.
 */
export function placeTerrain (
    count: number,
    random: () => number,
    platforms: readonly { x: number }[],
    pits: readonly { x: number; width: number }[],
    worldWidth: number
): TerrainBlock[]
{
    // [tiles wide, tiles high] blocks left to right. A hill is one tile; a mound climbs 1, 2 (and 3) tiles and comes
    // down again; a cliff climbs to a plateau and ends in a sheer wall. The tall ones are listed twice so they come up more
    const mound3: readonly [number, number][] = [[1, 1], [1, 2], [2, 3], [1, 2], [1, 1]];
    const mound3Wide: readonly [number, number][] = [[2, 1], [1, 2], [3, 3], [1, 2], [2, 1]];
    const cliff: readonly [number, number][] = [[1, 1], [1, 2], [3, 3]];
    const shapes: readonly (readonly [number, number][])[] = [
        [[2, 1]], [[3, 1]], [[5, 1]], [[2, 1], [2, 2], [2, 1]], [[1, 1], [3, 2], [1, 1]], [[2, 1], [3, 2], [2, 1]],
        mound3, mound3, mound3Wide, mound3Wide, cliff, cliff,
    ];
    const pieces: TerrainBlock[][] = [];
    const PLATFORM_CLEAR = 80 + 80;
    const PIECE_CLEAR = 300;
    const PIT_CLEAR = 200;

    while (pieces.length < count)
    {
        const free: TerrainBlock[][] = [];
        for (const shape of shapes)
        {
            const total = shape.reduce((sum, [tiles]) => sum + tiles * TERRAIN_TILE, 0);
            for (let x = TERRAIN_START_MARGIN; x + total <= worldWidth - TERRAIN_END_MARGIN; x += 16)
            {
                const end = x + total;
                const clear = platforms.every(p => p.x + PLATFORM_CLEAR <= x || p.x - PLATFORM_CLEAR >= end)
                    && pits.every(p => p.x + p.width + PIT_CLEAR <= x || p.x - PIT_CLEAR >= end)
                    && pieces.every(q => q[q.length - 1].x + q[q.length - 1].width + PIECE_CLEAR <= x || q[0].x - PIECE_CLEAR >= end);
                if (!clear) continue;
                let at = x;
                free.push(shape.map(([tiles, rise]) =>
                {
                    const block = { x: at, width: tiles * TERRAIN_TILE, height: rise * TERRAIN_TILE };
                    at += block.width;
                    return block;
                }));
            }
        }
        if (free.length === 0) break;
        pieces.push(free[Math.floor(random() * free.length)]);
    }
    return pieces.flat().sort((a, b) => a.x - b.x);
}
