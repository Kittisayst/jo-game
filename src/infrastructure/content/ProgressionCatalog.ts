/** `public/data/progression.json`: the Hero Level curve (see `HeroLevel`). */

import { HERO_LEVEL_CAP, type ProgressionTuning } from '../../domain/entities/HeroLevel';
import type { StatsTuning } from '../../domain/entities/HeroStats';
import { makeValidators } from './validate';

export function parseProgression (raw: unknown): ProgressionTuning
{
    const v = makeValidators('progression.json');
    const root = v.asObject(raw, 'root');

    const maxLevel = v.asNumber(root.maxLevel, 'maxLevel');
    if (!Number.isInteger(maxLevel) || maxLevel < 2 || maxLevel > HERO_LEVEL_CAP) v.fail('maxLevel', `a whole number from 2 to ${HERO_LEVEL_CAP}`);

    const curve = v.asObject(root.xpCurve, 'xpCurve');
    const base = v.asNumber(curve.base, 'xpCurve.base');
    if (base <= 0) v.fail('xpCurve.base', 'more than 0');
    const exponent = v.asNumber(curve.exponent, 'xpCurve.exponent');
    if (exponent < 1) v.fail('xpCurve.exponent', '1 or more');

    const pointsPerLevel = v.asNumber(root.pointsPerLevel, 'pointsPerLevel');
    if (!Number.isInteger(pointsPerLevel) || pointsPerLevel < 0) v.fail('pointsPerLevel', 'a whole number, 0 or more');

    const over = v.asObject(root.overlevel, 'overlevel');
    const levelsPerStage = v.asNumber(over.levelsPerStage, 'overlevel.levelsPerStage');
    if (levelsPerStage <= 0) v.fail('overlevel.levelsPerStage', 'more than 0');
    const offset = v.asNumber(over.offset, 'overlevel.offset');
    if (offset < 0) v.fail('overlevel.offset', '0 or more');
    const xpShare = v.asNumber(over.xpShare, 'overlevel.xpShare');
    if (xpShare < 0 || xpShare > 1) v.fail('overlevel.xpShare', 'between 0 and 1');

    return { maxLevel, xpCurve: { base, exponent }, pointsPerLevel, overlevel: { levelsPerStage, offset, xpShare } };
}

/**
 * The Stats part of `progression.json`. The ceilings of the four Stats must add up to the points of Hero Level
 * `maxLevel` (`(maxLevel - 1) × pointsPerLevel`), so a hero at the top has filled every Stat and no point is wasted.
 */
export function parseStatsTuning (raw: unknown): StatsTuning
{
    const v = makeValidators('progression.json');
    const root = v.asObject(raw, 'root');
    const stats = v.asObject(root.stats, 'stats');

    const readStat = (id: string, key: string, positive = true): { maxPoints: number; value: number } =>
    {
        const stat = v.asObject(stats[id], `stats.${id}`);
        const maxPoints = v.asNumber(stat.maxPoints, `stats.${id}.maxPoints`);
        if (!Number.isInteger(maxPoints) || maxPoints < 1) v.fail(`stats.${id}.maxPoints`, 'a whole number, 1 or more');
        const value = v.asNumber(stat[key], `stats.${id}.${key}`);
        if (positive && value <= 0) v.fail(`stats.${id}.${key}`, 'more than 0');
        return { maxPoints, value };
    };

    const attack = readStat('attack', 'perPoint');
    const hearts = readStat('hearts', 'pointsPerHeart');
    if (!Number.isInteger(hearts.value)) v.fail('stats.hearts.pointsPerHeart', 'a whole number');
    const guard = readStat('guard', 'blockChancePerPoint');
    if (guard.maxPoints * guard.value > 0.75) v.fail('stats.guard', 'a block chance of at most 75 % at the ceiling');
    const agility = readStat('agility', 'speedPerPoint');

    const total = attack.maxPoints + hearts.maxPoints + guard.maxPoints + agility.maxPoints;
    const maxLevel = v.asNumber(root.maxLevel, 'maxLevel');
    const pointsPerLevel = v.asNumber(root.pointsPerLevel, 'pointsPerLevel');
    const expected = (maxLevel - 1) * pointsPerLevel;
    if (total !== expected) v.fail('stats', `ceilings that add up to ${expected} points (Hero Level ${maxLevel} fills every Stat), not ${total}`);

    const respec = v.asObject(root.respec, 'respec');
    const ingredients = v.asArray(respec.ingredients, 'respec.ingredients').map((entry, i) =>
    {
        const p = `respec.ingredients[${i}]`;
        const ingredient = v.asObject(entry, p);
        const count = v.asNumber(ingredient.count, `${p}.count`);
        if (!Number.isInteger(count) || count < 1) v.fail(`${p}.count`, 'a whole number, 1 or more');
        return { itemId: v.asString(ingredient.itemId, `${p}.itemId`), count };
    });
    if (ingredients.length === 0) v.fail('respec.ingredients', 'at least one Material (starting over is never free)');

    return {
        stats: {
            attack: { maxPoints: attack.maxPoints, perPoint: attack.value },
            hearts: { maxPoints: hearts.maxPoints, pointsPerHeart: hearts.value },
            guard: { maxPoints: guard.maxPoints, blockChancePerPoint: guard.value },
            agility: { maxPoints: agility.maxPoints, speedPerPoint: agility.value },
        },
        respec: { ingredients },
    };
}
