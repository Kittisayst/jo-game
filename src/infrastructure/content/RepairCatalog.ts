/** What repairing each weapon and tool costs, as authored in `public/data/repairs.json`. */

import type { RepairRecipe } from '../../application/RepairItemUseCase';
import { parseDrops } from './NodeCatalog';
import { makeValidators } from './validate';

export function parseRepairs (raw: unknown): RepairRecipe[]
{
    const v = makeValidators('repairs.json');
    const seen = new Set<string>();

    return v.asArray(v.asObject(raw, 'root').repairs, 'repairs').map((entry, i): RepairRecipe =>
    {
        const p = `repairs[${i}]`;
        const repair = v.asObject(entry, p);
        const itemId = v.asString(repair.itemId, `${p}.itemId`);
        if (seen.has(itemId)) v.fail(`${p}.itemId`, `an item with one repair recipe (${itemId} appears twice)`);
        seen.add(itemId);

        const ingredients = parseDrops(v, repair.ingredients, `${p}.ingredients`);
        if (ingredients.length === 0) v.fail(`${p}.ingredients`, 'at least one Material (a repair is never free)');

        return {
            itemId,
            building: v.asOneOf(repair.building, ['forge', 'workshop'] as const, `${p}.building`),
            ingredients: ingredients.map(i => ({ itemId: i.itemId, count: i.count })),
        };
    });
}
