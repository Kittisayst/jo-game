import { describe, expect, it } from 'vitest';
import { Backpack } from './Backpack';
import { ItemCatalog, ItemDefinition } from './ItemCatalog';

const item = (id: string, extra: Partial<ItemDefinition> = {}): ItemDefinition => ({
    id, name: id, nameEn: id, description: '', category: 'weapon', maxStack: 1, icon: '', ...extra,
});

const catalog = new ItemCatalog([
    item('iron-sword', { durability: 80 }),
    item('axe-t1', { category: 'tool', durability: 40 }),
    item('wooden-sword'),
    item('wood', { category: 'material', maxStack: 99 }),
]);

describe('Backpack durability', () =>
{
    it('reads a new item as full and an item that never wears as null', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('iron-sword', 1);
        backpack.addItem('wooden-sword', 1);

        expect(backpack.getDurability('iron-sword')).toEqual({ current: 80, max: 80, state: 'ok' });
        expect(backpack.getDurability('wooden-sword')).toBeNull();
        expect(backpack.getDurability('crystal-sword')).toBeNull();
    });

    it('wears an item down and reports what changed, then low, then broken, never below zero', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('iron-sword', 1);

        expect(backpack.wearItem('iron-sword')).toEqual({ itemId: 'iron-sword', previous: 80, current: 79, max: 80 });
        backpack.wearItem('iron-sword', 63);
        expect(backpack.getDurability('iron-sword')).toMatchObject({ current: 16, state: 'low' });
        backpack.wearItem('iron-sword', 100);
        expect(backpack.getDurability('iron-sword')).toMatchObject({ current: 0, state: 'broken' });
    });

    it('keeps a broken item in the Backpack', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('axe-t1', 1);
        backpack.wearItem('axe-t1', 40);

        expect(backpack.getItemCount('axe-t1')).toBe(1);
        expect(backpack.getDurability('axe-t1')?.state).toBe('broken');
    });

    it('does not wear an item it does not have or one that never wears', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('wooden-sword', 1);

        expect(backpack.wearItem('iron-sword')).toBeNull();
        expect(backpack.wearItem('wooden-sword')).toBeNull();
    });

    it('restores an item to full', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('iron-sword', 1);
        backpack.wearItem('iron-sword', 50);

        expect(backpack.restoreItem('iron-sword')).toBe(true);
        expect(backpack.getDurability('iron-sword')?.current).toBe(80);
        expect(backpack.restoreItem('wooden-sword')).toBe(false);
    });

    it('takes a tenth of the maximum off every item that wears when the hero dies', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('iron-sword', 1);
        backpack.addItem('axe-t1', 1);
        backpack.addItem('wooden-sword', 1);
        backpack.addItem('wood', 10);

        const changes = backpack.wearAllDurable();

        expect(changes.map(c => [c.itemId, c.previous, c.current])).toEqual([['iron-sword', 80, 72], ['axe-t1', 40, 36]]);
    });

    it('keeps durability through saving, loading and sorting', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('wood', 5);
        backpack.addItem('iron-sword', 1);
        backpack.wearItem('iron-sword', 30);

        const loaded = new Backpack(backpack.toSnapshot(), catalog);
        expect(loaded.getDurability('iron-sword')?.current).toBe(50);

        loaded.sortSlots();
        expect(loaded.getDurability('iron-sword')?.current).toBe(50);
    });

    it('saves nothing extra for an item that was never worn, and loads a missing value as full', () =>
    {
        const backpack = new Backpack([], catalog);
        backpack.addItem('iron-sword', 1);

        expect(backpack.toSnapshot()[0]).toEqual({ slotIndex: 0, itemId: 'iron-sword', count: 1 });
        const loaded = new Backpack([{ slotIndex: 3, itemId: 'iron-sword', count: 1 }], catalog);
        expect(loaded.getDurability('iron-sword')?.current).toBe(80);
    });

    it('never counts a stored value above the maximum', () =>
    {
        const loaded = new Backpack([{ slotIndex: 0, itemId: 'iron-sword', count: 1, durability: 500 }], catalog);

        expect(loaded.getDurability('iron-sword')?.current).toBe(80);
    });
});
