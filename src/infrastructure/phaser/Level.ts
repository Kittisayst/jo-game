/**
 * Infrastructure-owned layout data for one playable level — pure spatial data,
 * loaded from JSON rather than hand-written as code. See "Level" in CONTEXT.md
 * and docs/adr/0003-level-data-as-loaded-json.md.
 *
 * Nothing here is verified against this shape at runtime — a malformed level
 * JSON file will fail in whatever way reading a missing/wrong-typed field fails.
 */

import type { EnemyType } from '../../domain/entities/Enemy';

export interface EnemySpawnData
{
    x: number;
    y: number;
    patrolDistance?: number;
    speed?: number;
    type?: EnemyType;
}

export interface PowerUpSpawnData
{
    x: number;
    y: number;
    type: 'heart' | 'star' | 'spring';
}

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

export interface BossSpawnData
{
    x: number;
    y: number;
    hp?: number;
}

export interface Level
{
    worldWidth: number;
    finishX: number;
    spawn: { x: number; y: number };
    platforms: { x: number; y: number }[];
    coins?: { x: number; y: number }[];
    enemies?: EnemySpawnData[];
    powerUps?: PowerUpSpawnData[];
    spikes?: SpikeSpawnData[];
    movingPlatforms?: MovingPlatformSpawnData[];
    boss?: BossSpawnData;
    finishType?: 'flag' | 'door';
    scenery?: 'village' | 'default' | 'plains' | 'sky-islands' | 'boss-arena';
    nextLevel?: string | null;
    trackTime?: boolean;
}


