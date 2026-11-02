import { DomainEvents } from '../domain/DomainEvents';
import { Backpack, CraftingIngredient } from '../domain/entities/Backpack';
import { ShopPurchases } from '../domain/entities/ShopPurchases';

export const SHOP_PURCHASE_EVENT = 'shop-purchase';

export type ShopTab = 'seeds' | 'potions' | 'supplies';

/** One thing Grandma Chanthy sells: paid for with Materials, never Credit. */
export interface ShopEntry
{
    itemId: string;
    price: CraftingIngredient[];
    /** How many can be bought in one Game day; none = no limit. */
    dailyLimit?: number;
}

export interface ShopCatalog
{
    /** The fixed stock, by tab. */
    stock: Record<ShopTab, ShopEntry[]>;
    /** How many of the pool are on sale each day. */
    dailyCount: number;
    /** Today's offers are taken from here, turning with the day. */
    dailyPool: ShopEntry[];
}

export interface ShopPurchasePayload
{
    itemId: string;
}

/** The offers of a Game day: the same ones all day, a different pair the next day (no randomness). */
export function dailyOffers (catalog: ShopCatalog, dayCount: number): ShopEntry[]
{
    const pool = catalog.dailyPool;
    const count = Math.min(catalog.dailyCount, pool.length);
    const start = (dayCount * count) % Math.max(pool.length, 1);
    return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

export type BuyFromShopResult =
    | { success: true }
    | { success: false; reason: 'insufficient_materials' | 'backpack_full' | 'sold_out' };

/** Buys one of an entry: the price is taken, the item given. Nothing changes when it cannot be done. */
export function buyFromShopUseCase (
    entry: ShopEntry,
    backpack: Backpack,
    purchases: ShopPurchases,
    dayCount: number
): BuyFromShopResult
{
    if (entry.dailyLimit !== undefined && purchases.boughtToday(entry.itemId, dayCount) >= entry.dailyLimit)
    {
        return { success: false, reason: 'sold_out' };
    }
    if (entry.price.some(ing => backpack.getItemCount(ing.itemId) < ing.count))
    {
        return { success: false, reason: 'insufficient_materials' };
    }
    // Room is checked as if the price were already taken (a price can free the very slot the item needs)
    if (!backpack.canCraftAfterRemoving(entry.price, entry.itemId, 1))
    {
        return { success: false, reason: 'backpack_full' };
    }

    for (const ing of entry.price) backpack.removeItem(ing.itemId, ing.count);
    backpack.addItem(entry.itemId, 1);
    purchases.record(entry.itemId, dayCount);

    DomainEvents.emit<ShopPurchasePayload>(SHOP_PURCHASE_EVENT, { itemId: entry.itemId });
    return { success: true };
}
