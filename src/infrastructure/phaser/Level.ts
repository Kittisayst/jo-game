import type { EnemyType } from '../../domain/entities/Enemy';

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
    movingPlatforms?: MovingPlatformSpawnData[];
    enemies?: LevelEnemySpawnData[];
    /** Which backdrop and ground the level has: the village, a forest, or a cave. */
    scenery?: 'village' | 'forest' | 'cave' | 'desert';
    /** Where the boss arena starts, when a cave level ends in one (the backdrop and ground change from here). */
    arenaFromX?: number;
}
