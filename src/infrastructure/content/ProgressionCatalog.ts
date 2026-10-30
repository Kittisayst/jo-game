/** `public/data/progression.json`: the Hero Level curve (see `HeroLevel`). */

import { HERO_LEVEL_CAP, type ProgressionTuning } from '../../domain/entities/HeroLevel';
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
