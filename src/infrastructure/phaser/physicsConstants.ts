/** World gravity (px/s²), shared by the game config and the level checks. */
export const GRAVITY_Y = 800;

/**
 * How far the feet of every character reach below its hitbox. The ground tile's grass starts 2 px below
 * its top edge and trees, signs and nodes stand 2 px into it, so characters do the same instead of
 * hovering on the edge. Hitboxes are this much shorter than the art at the bottom.
 */
export const GROUND_SINK = 2;

/** Upward speed of a jump (px/s). */
export const JUMP_SPEED = 420;

/** Sideways speed of the hero while running (px/s). */
export const MOVE_SPEED = 220;

/** The highest one jump can lift the hero, in px (v² / 2g). Measured in game: about 107. */
export const MAX_JUMP_RISE = (JUMP_SPEED * JUMP_SPEED) / (2 * GRAVITY_Y);

/** Extra gravity while the hero is falling (px/s²): a snappier descent. The jump going up uses `GRAVITY_Y` alone. */
export const FALL_GRAVITY_EXTRA = 420;

/** How far the hero's centre may stop short of a platform's edge and still stand on it (half the hitbox, px). */
export const HERO_HALF_WIDTH = 11;

/**
 * The widest gap (edge to edge, px) a running jump can cross to land on a platform `rise` px higher than the one
 * it left (negative: lower), with perfect timing and no margin. With `dashDistance` (Dash speed × duration) the
 * hero also dashes at the top of the jump: no gravity for that moment, so the Dash adds its whole distance.
 * -Infinity when the platform is higher than a jump reaches.
 */
export function maxLeapGap (rise: number, dashDistance = 0): number
{
    const apex = MAX_JUMP_RISE;
    if (rise > apex) return -Infinity;
    const timeUp = JUMP_SPEED / GRAVITY_Y;
    const timeDown = Math.sqrt((2 * (apex - rise)) / (GRAVITY_Y + FALL_GRAVITY_EXTRA));
    return MOVE_SPEED * (timeUp + timeDown) + dashDistance - HERO_HALF_WIDTH;
}

/** Distance from a platform sprite's centre up to the surface the hero stands on (px). */
export const PLATFORM_SURFACE_OFFSET = 16;
