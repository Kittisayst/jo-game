/** The `scaling` block of `public/data/stages.json`: how enemies grow with the Stage number. */

import type { StageScaling } from '../../domain/entities/StageScaling';
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
    };
}
