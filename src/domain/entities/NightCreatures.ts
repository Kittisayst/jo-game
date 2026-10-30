import type { EnemyDefinition } from './Enemy';
import { StageScaling, scaleEnemyDefinition } from './StageScaling';

/**
 * Night creatures: special monsters that walk a Stage only while it is night (see "Night creature" in
 * CONTEXT.md). They are tougher than the ordinary monsters of their Realm and pay more XP, and they are
 * gone at dawn. Pure rules, no x/y; the numbers come from the `night` block of `stages.json`.
 */
export interface NightTuning
{
    /** How many walk a Stage for every screen of its width. */
    creaturesPerScreen: number;
    /** Their HP, on top of what the Stage's scaling already gives (1.6 = 60 % more). */
    hpMultiplier: number;
    /** Their XP, on top of the Stage's scaling. */
    xpMultiplier: number;
    /** They never appear closer than this to the hero (px), so night does not start with a hit. */
    minDistanceFromHero: number;
    /** The night creatures of each Realm (enemy ids); one is picked for every creature. */
    byRealm: Record<number, string[]>;
}

/** The night creatures that walk Realm `realm` at night (none for a Realm that has none yet). */
export function nightCreatureIdsFor (realm: number, tuning: NightTuning): string[]
{
    return tuning.byRealm[realm] ?? [];
}

/** How many night creatures walk a Stage whose world is `worldWidth` px wide. */
export function nightCreatureCount (worldWidth: number, tuning: NightTuning, screenWidth = 1280): number
{
    return Math.max(1, Math.ceil(worldWidth / screenWidth)) * tuning.creaturesPerScreen;
}

/** The definition a night creature has in Stage `stageNumber`: scaled like any monster of that Stage, then tougher. */
export function scaleNightCreature (
    definition: EnemyDefinition,
    stageNumber: number,
    scaling: StageScaling,
    tuning: NightTuning
): EnemyDefinition
{
    const scaled = scaleEnemyDefinition(definition, stageNumber, scaling);
    return {
        ...scaled,
        maxHp: Math.max(1, Math.round(scaled.maxHp * tuning.hpMultiplier)),
        xp: Math.max(1, Math.round(scaled.xp * tuning.xpMultiplier)),
    };
}

/**
 * Whether a Stage has night creatures at all. Not the first Stage (it teaches the game), and not a Stage with a
 * Mini-boss or a Boss (its arena is already a fight); a Stage can also turn them off with `"night": false`.
 */
export function stageHasNightCreatures (stage: { number: number; night: boolean }, hasBoss: boolean, hasMiniboss: boolean): boolean
{
    return stage.night && stage.number !== 1 && !hasBoss && !hasMiniboss;
}
