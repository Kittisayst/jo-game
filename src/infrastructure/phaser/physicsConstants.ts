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

/** Distance from a platform sprite's centre up to the surface the hero stands on (px). */
export const PLATFORM_SURFACE_OFFSET = 16;
