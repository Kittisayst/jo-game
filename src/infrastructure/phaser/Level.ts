import type { EnemyType } from '../../domain/entities/Enemy';
import type { TerrainBlock } from '../content/LevelTerrain';

export interface SpikeSpawnData
{
    x: number;
    y: number;
}

export interface MovingPlatformSpawnData
{
    x: number;
    y: number;
    distanceX?: number;
    distanceY?: number;
    speed?: number;
}

export interface LevelEnemySpawnData
{
    enemyId: string;
    type?: EnemyType;
    x: number;
    y: number;
    patrolDistance?: number;
    speed?: number;
    scale?: number;
}

export interface Level
{
    worldWidth: number;
    spawn: { x: number; y: number };
    platforms: { x: number; y: number }[];
    /** Platforms (also listed in `platforms`) that only the air dash reaches: a secret ledge with a reward on it. */
    secretPlatforms?: { x: number; y: number }[];
    spikes?: SpikeSpawnData[];
    /** Gaps in the ground (ເຫວ): the hero who falls in dies. `x` is the left edge. Not in the first Stage or a boss arena. */
    pits?: { x: number; width: number }[];
    /** Raised ground: solid blocks standing on the ground (whole tiles; each climbable by steps, see `terrainProblem`). */
    terrain?: TerrainBlock[];
    movingPlatforms?: MovingPlatformSpawnData[];
    enemies?: LevelEnemySpawnData[];
    /** Which backdrop and ground the level has: the village, a forest, or a cave. */
    scenery?: 'village' | 'forest' | 'cave' | 'desert';
    /** Where the boss arena starts, when a cave level ends in one (the backdrop and ground change from here). */
    arenaFromX?: number;
    /** Which look from `scenery.json` the level has, when not the one named by `scenery`. */
    theme?: string;
    /** Decor placed by hand (ids of the theme's decor): used as written, an empty list means none. Scenery only. */
    decor?: { id: string; x: number; flip?: boolean }[];
    /** Decor pieces per 800 px screen when it is scattered from a seed (0 = none); the theme's number when missing. */
    decorPerScreen?: number;
}
