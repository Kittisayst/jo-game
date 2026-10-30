/** The top-level blocks of `public/data/stages.json` besides the Stage list: `scaling` and `stageQuestion`. */

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

/** The question asked at the end of a Stage: how much Credit the first correct answer of a Stage pays. */
export function parseStageQuestion (raw: unknown): { credit: number }
{
    const v = makeValidators('stages.json');
    const block = v.asObject(v.asObject(raw, 'root').stageQuestion, 'stageQuestion');
    const credit = v.asNumber(block.credit, 'stageQuestion.credit');
    if (!Number.isInteger(credit) || credit < 0) v.fail('stageQuestion.credit', 'a whole number of Credit, 0 or more');
    return { credit };
}
