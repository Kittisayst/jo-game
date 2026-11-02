import { afterEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Backpack } from '../domain/entities/Backpack';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
import { ShopPurchases } from '../domain/entities/ShopPurchases';
import { buyFromShopUseCase, dailyOffers, SHOP_PURCHASE_EVENT, type ShopCatalog, type ShopEntry } from './ShopUseCases';

const catalog = new ItemCatalog([
    { id: 'herb', name: 'Herb', nameEn: 'Herb', icon: 'h', description: '', category: 'material', maxStack: 99 },
    { id: 'herb-seed', name: 'Seed', nameEn: 'Seed', icon: 's', description: '', category: 'material', maxStack: 99 },
    { id: 'potion', name: 'Potion', nameEn: 'Potion', icon: 'p', description: '', category: 'consumable', maxStack: 20 },
] as never);

const seed: ShopEntry = { itemId: 'herb-seed', price: [{ itemId: 'herb', count: 3 }] };
const potion: ShopEntry = { itemId: 'potion', price: [{ itemId: 'herb', count: 1 }], dailyLimit: 2 };

describe('buyFromShopUseCase', () =>
{
    const events: string[] = [];
    const onBought = (p: { itemId: string }) => events.push(p.itemId);
    afterEach(() => DomainEvents.off(SHOP_PURCHASE_EVENT, onBought));

    it('takes the Materials, gives the item and says so', () =>
    {
        events.length = 0;
        DomainEvents.on(SHOP_PURCHASE_EVENT, onBought);
        const backpack = new Backpack([], catalog);
        backpack.addItem('herb', 7);

        expect(buyFromShopUseCase(seed, backpack, new ShopPurchases(), 1)).toEqual({ success: true });
        expect(backpack.getItemCount('herb')).toBe(4);
        expect(backpack.getItemCount('herb-seed')).toBe(1);
        expect(events).toEqual(['herb-seed']);
    });

    it('changes nothing when the Materials are short', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('herb', 2);
        expect(buyFromShopUseCase(seed, backpack, new ShopPurchases(), 1)).toEqual({ success: false, reason: 'insufficient_materials' });
        expect(backpack.getItemCount('herb')).toBe(2);
        expect(backpack.getItemCount('herb-seed')).toBe(0);
    });

    it('refuses when the Backpack has no room, and takes nothing', () =>
    {
        const backpack = new Backpack([], catalog, 1);
        backpack.addItem('herb', 99);
        // One slot, still holding Herb after the price is taken: no room for the Potion
        expect(buyFromShopUseCase(potion, backpack, new ShopPurchases(), 1)).toEqual({ success: false, reason: 'backpack_full' });
        expect(backpack.getItemCount('herb')).toBe(99);
        // A price that empties the slot makes room for the item
        const single = new Backpack([], catalog, 1);
        single.addItem('herb', 1);
        expect(buyFromShopUseCase(potion, single, new ShopPurchases(), 1).success).toBe(true);
        expect(single.getItemCount('potion')).toBe(1);
    });

    it('counts a daily limit per Game day', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('herb', 10);
        const purchases = new ShopPurchases();
        expect(buyFromShopUseCase(potion, backpack, purchases, 4).success).toBe(true);
        expect(buyFromShopUseCase(potion, backpack, purchases, 4).success).toBe(true);
        expect(buyFromShopUseCase(potion, backpack, purchases, 4)).toEqual({ success: false, reason: 'sold_out' });
        expect(backpack.getItemCount('herb')).toBe(8);
        // A new day starts again
        expect(buyFromShopUseCase(potion, backpack, purchases, 5).success).toBe(true);
    });
});

describe('ShopPurchases', () =>
{
    it('is saved and loaded, ignoring bad entries', () =>
    {
        const a = new ShopPurchases();
        a.record('x', 3);
        a.record('x', 3);
        const b = new ShopPurchases();
        b.loadFrom(a.toSnapshot());
        expect(b.boughtToday('x', 3)).toBe(2);
        expect(b.boughtToday('x', 4)).toBe(0);

        b.loadFrom({ dayCount: -1, bought: { y: 'many' as unknown as number, z: 1 } });
        expect(b.toSnapshot()).toEqual({ dayCount: 0, bought: { z: 1 } });
        b.loadFrom(undefined);
        expect(b.toSnapshot()).toEqual({ dayCount: 0, bought: {} });
    });
});

describe('dailyOffers', () =>
{
    const pool = ['a', 'b', 'c', 'd'].map(itemId => ({ itemId, price: [{ itemId: 'herb', count: 1 }] }));
    const shop: ShopCatalog = { stock: { seeds: [], potions: [], supplies: [] }, dailyCount: 2, dailyPool: pool };

    it('gives the same offers all day and turns through the pool', () =>
    {
        const ids = (day: number) => dailyOffers(shop, day).map(e => e.itemId);
        expect(ids(0)).toEqual(['a', 'b']);
        expect(ids(0)).toEqual(ids(0));
        expect(ids(1)).toEqual(['c', 'd']);
        expect(ids(2)).toEqual(['a', 'b']);
    });
});
