/**
 * Names of the places the player can be in. The Stages themselves (names, layouts, contents) come from
 * `stages.json`; only the village has no entry there.
 */
import { stageNumberOf } from '../../domain/entities/StageNumber';

export const VILLAGE_LEVEL_KEY = 'village';
export const VILLAGE_LEVEL_PATH = 'assets/levels/village.json';

/** Short label for the HUD, such as "ໝູ່ບ້ານ" or "ດ່ານ 12". */
export function hudLabelOf (levelKey: string): string
{
    if (levelKey === VILLAGE_LEVEL_KEY) return 'ໝູ່ບ້ານ';
    const stageNumber = stageNumberOf(levelKey);
    return stageNumber === null ? levelKey : `ດ່ານ ${stageNumber}`;
}

/** Title for the pause menu, such as "Village 🏡" or "Stage 12". */
export function shortTitleOf (levelKey: string): string
{
    if (levelKey === VILLAGE_LEVEL_KEY) return 'Village 🏡';
    const stageNumber = stageNumberOf(levelKey);
    return stageNumber === null ? levelKey : `Stage ${stageNumber}`;
}
