import type { EnemyDefinition } from './Enemy';
import { realmOf } from './StageNumber';

/** How enemies grow with the Stage number, from `scaling` in `stages.json`. */
export interface StageScaling
{
    /** Share of base HP added per Stage after the first (0.08 = +8 % of base HP each). */
    enemyHpPerStage: number;
    /** Damage added per Realm after the first. */
    enemyDamagePerRealm: number;
    /** Chance added to every drop per Realm after the first (a chance never goes above 1). */
    dropBonusPerRealm: number;
}

export const NO_SCALING: StageScaling = { enemyHpPerStage: 0, enemyDamagePerRealm: 0, dropBonusPerRealm: 0 };

/**
 * The definition an enemy has in Stage `stageNumber`. Only ordinary enemies grow: a Mini-boss and a Boss
 * are tuned by hand in `enemies.json`, so their numbers do not move with the Stage they stand in.
 */
export function scaleEnemyDefinition (
    definition: EnemyDefinition,
    stageNumber: number,
    scaling: StageScaling
): EnemyDefinition
{
    if (definition.kind !== 'normal' && definition.kind !== 'elite') return definition;

    const stagesBeyondFirst = Math.max(0, stageNumber - 1);
    const realmsBeyondFirst = Math.max(0, realmOf(stageNumber) - 1);

    return {
        ...definition,
        maxHp: Math.max(1, Math.round(definition.maxHp * (1 + scaling.enemyHpPerStage * stagesBeyondFirst))),
        damage: definition.damage + scaling.enemyDamagePerRealm * realmsBeyondFirst,
        drops: definition.drops.map(drop => ({
            ...drop,
            chance: Math.min(1, drop.chance + scaling.dropBonusPerRealm * realmsBeyondFirst),
        })),
    };
}
