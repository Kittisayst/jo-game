/**
 * Names of the places the player can be in. The Stages themselves (names, layouts, contents) come from
 * `stages.json`; only the village has no entry there.
 */
import { stageNumberOf } from '../../domain/entities/StageNumber';

export const VILLAGE_LEVEL_KEY = 'village';
export const VILLAGE_LEVEL_PATH = 'assets/levels/village.json';

/** The Garden: a walkable place beside the village where Seeds are planted in Plots on the ground. */
export const GARDEN_LEVEL_KEY = 'garden';
export const GARDEN_LEVEL_PATH = 'assets/levels/garden.json';

/** Places that are not a numbered Stage (they have no entry in `stages.json`). */
export function isHomeLevel (levelKey: string): boolean
{
    return levelKey === VILLAGE_LEVEL_KEY || levelKey === GARDEN_LEVEL_KEY;
}

/** Short label for the HUD, such as "ໝູ່ບ້ານ" or "ດ່ານ 12". */
export function hudLabelOf (levelKey: string): string
{
    if (levelKey === VILLAGE_LEVEL_KEY) return 'ໝູ່ບ້ານ';
    if (levelKey === GARDEN_LEVEL_KEY) return 'ສວນຜັກ';
    const stageNumber = stageNumberOf(levelKey);
    return stageNumber === null ? levelKey : `ດ່ານ ${stageNumber}`;
}

/** Title for the pause menu, such as "Village 🏡" or "Stage 12". */
export function shortTitleOf (levelKey: string): string
{
    if (levelKey === VILLAGE_LEVEL_KEY) return 'Village 🏡';
    if (levelKey === GARDEN_LEVEL_KEY) return 'Garden 🌱';
    const stageNumber = stageNumberOf(levelKey);
    return stageNumber === null ? levelKey : `Stage ${stageNumber}`;
}
