/** The top-level blocks of `public/data/stages.json` besides the Stage list: `scaling` and `stageQuestion`. */

import type { StageScaling } from '../../domain/entities/StageScaling';
import type { NightTuning } from '../../domain/entities/NightCreatures';
import { makeValidators } from './validate';

export function parseStageScaling (raw: unknown): StageScaling
{
    const v = makeValidators('stages.json');
    const scaling = v.asObject(v.asObject(raw, 'root').scaling, 'scaling');

    const read = (key: keyof StageScaling): number =>
    {
        const value = v.asNumber(scaling[key], `scaling.${key}`);
        if (value < 0) v.fail(`scaling.${key}`, 'a number, 0 or more');
        return value;
    };

    return {
        enemyHpPerStage: read('enemyHpPerStage'),
        enemyDamagePerRealm: read('enemyDamagePerRealm'),
        dropBonusPerRealm: read('dropBonusPerRealm'),
        enemyXpPerStage: read('enemyXpPerStage'),
    };
}

/** The question asked at the end of a Stage: how much Credit the first correct answer of a Stage pays. */
export function parseStageQuestion (raw: unknown): { credit: number }
{
    const v = makeValidators('stages.json');
    const block = v.asObject(v.asObject(raw, 'root').stageQuestion, 'stageQuestion');
    const credit = v.asNumber(block.credit, 'stageQuestion.credit');
    if (!Number.isInteger(credit) || credit < 0) v.fail('stageQuestion.credit', 'a whole number of Credit, 0 or more');
    return { credit };
}

/** The `night` block of `stages.json`: how night creatures appear (see `NightCreatures`). */
export function parseNightTuning (raw: unknown): NightTuning
{
    const v = makeValidators('stages.json');
    const night = v.asObject(v.asObject(raw, 'root').night, 'night');

    const perScreen = v.asNumber(night.creaturesPerScreen, 'night.creaturesPerScreen');
    if (!Number.isInteger(perScreen) || perScreen < 1 || perScreen > 4) v.fail('night.creaturesPerScreen', 'a whole number from 1 to 4');
    const hpMultiplier = v.asNumber(night.hpMultiplier, 'night.hpMultiplier');
    if (hpMultiplier < 1) v.fail('night.hpMultiplier', '1 or more (night creatures are tougher)');
    const xpMultiplier = v.asNumber(night.xpMultiplier, 'night.xpMultiplier');
    if (xpMultiplier < 1) v.fail('night.xpMultiplier', '1 or more (night creatures pay more)');
    const minDistanceFromHero = v.asNumber(night.minDistanceFromHero, 'night.minDistanceFromHero');
    if (minDistanceFromHero < 300) v.fail('night.minDistanceFromHero', '300 or more (night must not start with a hit)');

    const byRealm: Record<number, string[]> = {};
    for (const [key, value] of Object.entries(v.asObject(night.byRealm, 'night.byRealm')))
    {
        const realm = Number(key);
        if (!Number.isInteger(realm) || realm < 1 || realm > 10) v.fail(`night.byRealm.${key}`, 'a Realm number from 1 to 10');
        const ids = v.asArray(value, `night.byRealm.${key}`).map((id, i) => v.asString(id, `night.byRealm.${key}[${i}]`));
        if (ids.length === 0) v.fail(`night.byRealm.${key}`, 'at least one night creature');
        byRealm[realm] = ids;
    }

    return { creaturesPerScreen: perScreen, hpMultiplier, xpMultiplier, minDistanceFromHero, byRealm };
}

/** Every id of the `night` block must be an enemy marked `night: true`, and such an enemy is for the night only. */
export function checkNightCreatures (tuning: NightTuning, enemies: { id: string; night?: boolean }[]): void
{
    const v = makeValidators('stages.json');
    for (const [realm, ids] of Object.entries(tuning.byRealm))
    {
        for (const id of ids)
        {
            const enemy = enemies.find(e => e.id === id);
            if (!enemy) v.fail(`night.byRealm.${realm}`, `the id of an enemy in enemies.json (${id} is not there)`);
            else if (enemy.night !== true) v.fail(`night.byRealm.${realm}`, `an enemy with "night": true (${id} is not one)`);
        }
    }
}
