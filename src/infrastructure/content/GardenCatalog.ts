/** What each extra Garden Plot costs, as authored in `public/data/garden.json`. */

import type { ExpansionCosts } from '../../application/GardenUseCases';
import { MAX_PLOTS, STARTING_PLOTS } from '../../domain/entities/Garden';
import { parseDrops } from './NodeCatalog';
import { makeValidators } from './validate';

export function parseGardenExpansions (raw: unknown): ExpansionCosts
{
    const v = makeValidators('garden.json');
    const costs = v.asArray(v.asObject(raw, 'root').expansions, 'expansions').map((cost, i) =>
    {
        const ingredients = parseDrops(v, cost, `expansions[${i}]`);
        if (ingredients.length === 0) v.fail(`expansions[${i}]`, 'at least one Material (a Plot is never free)');
        return ingredients.map(ing => ({ itemId: ing.itemId, count: ing.count }));
    });

    const extra = MAX_PLOTS - STARTING_PLOTS;
    if (costs.length !== extra) v.fail('expansions', `exactly ${extra} entries, one for each Plot after the first ${STARTING_PLOTS}`);
    return costs;
}
