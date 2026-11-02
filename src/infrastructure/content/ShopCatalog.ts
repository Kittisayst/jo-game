/** What Grandma Chanthy sells and for which Materials, as authored in `public/data/shop.json`. */

import type { ShopCatalog, ShopEntry, ShopTab } from '../../application/ShopUseCases';
import { parseDrops } from './NodeCatalog';
import { makeValidators } from './validate';

const TABS: readonly ShopTab[] = ['seeds', 'potions', 'supplies'];

export function parseShop (raw: unknown): ShopCatalog
{
    const v = makeValidators('shop.json');
    const root = v.asObject(raw, 'root');

    const parseEntry = (entry: unknown, path: string): ShopEntry =>
    {
        const e = v.asObject(entry, path);
        const price = parseDrops(v, e.price, `${path}.price`);
        if (price.length === 0) v.fail(`${path}.price`, 'at least one Material (nothing is free)');
        const dailyLimit = v.optionalNumber(e.dailyLimit, `${path}.dailyLimit`);
        if (dailyLimit !== undefined && (!Number.isInteger(dailyLimit) || dailyLimit < 1)) v.fail(`${path}.dailyLimit`, 'a whole number of 1 or more');
        return {
            itemId: v.asString(e.itemId, `${path}.itemId`),
            price: price.map(ing => ({ itemId: ing.itemId, count: ing.count })),
            ...(dailyLimit !== undefined ? { dailyLimit } : {}),
        };
    };

    const stockRaw = v.asObject(root.stock, 'stock');
    const stock = {} as Record<ShopTab, ShopEntry[]>;
    for (const tab of TABS)
    {
        stock[tab] = v.asArray(stockRaw[tab], `stock.${tab}`).map((e, i) => parseEntry(e, `stock.${tab}[${i}]`));
    }

    const daily = v.asObject(root.daily, 'daily');
    const dailyPool = v.asArray(daily.pool, 'daily.pool').map((e, i) => parseEntry(e, `daily.pool[${i}]`));
    const dailyCount = v.asNumber(daily.count, 'daily.count');
    if (!Number.isInteger(dailyCount) || dailyCount < 1 || dailyCount > dailyPool.length) v.fail('daily.count', `a whole number from 1 to the ${dailyPool.length} entries of the pool`);

    return { stock, dailyCount, dailyPool };
}
