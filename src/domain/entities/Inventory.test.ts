import { describe, expect, it } from 'vitest';
import { getItemDefinition, Inventory, ITEM_CATALOG } from './Inventory';

describe('Inventory domain entity & item catalog', () =>
{
    it('defines catalog with valid items', () =>
    {
        expect(ITEM_CATALOG.length).toBe(4);
        for (const item of ITEM_CATALOG)
        {
            expect(item.id).toBeTruthy();
            expect(item.maxStack).toBeGreaterThan(0);
            expect(item.price).toBeGreaterThan(0);
            expect(item.icon).toBeTruthy();
        }
    });

    it('retrieves item definition', () =>
    {
        const potion = getItemDefinition('heal-potion');
        expect(potion).toBeDefined();
        expect(potion?.effectType).toBe('heal');

        const none = getItemDefinition('non-existent');
        expect(none).toBeUndefined();
    });

    it('adds items adhering to max stack limits', () =>
    {
        const inv = new Inventory();
        expect(inv.getItemCount('heal-potion')).toBe(0);

        expect(inv.addItem('heal-potion', 2)).toBe(true);
        expect(inv.getItemCount('heal-potion')).toBe(2);

        // Max stack is 3, so adding 1 more is fine
        expect(inv.canAddItem('heal-potion', 1)).toBe(true);
        expect(inv.addItem('heal-potion', 1)).toBe(true);
        expect(inv.getItemCount('heal-potion')).toBe(3);

        // Cannot exceed max stack of 3
        expect(inv.canAddItem('heal-potion', 1)).toBe(false);
        expect(inv.addItem('heal-potion', 1)).toBe(false);
        expect(inv.getItemCount('heal-potion')).toBe(3);
    });

    it('consumes items and removes them when count reaches 0', () =>
    {
        const inv = new Inventory({ 'heal-potion': 2 });
        expect(inv.consumeItem('heal-potion')).toBe(true);
        expect(inv.getItemCount('heal-potion')).toBe(1);

        expect(inv.consumeItem('heal-potion')).toBe(true);
        expect(inv.getItemCount('heal-potion')).toBe(0);

        // Cannot consume when empty
        expect(inv.consumeItem('heal-potion')).toBe(false);
    });

    it('serializes to and loads from plain record', () =>
    {
        const inv = new Inventory({ 'heal-potion': 2, 'star-candy': 1 });
        const record = inv.toRecord();
        expect(record).toEqual({
            'heal-potion': 2,
            'star-candy': 1,
        });

        inv.reset();
        expect(inv.getItemCount('heal-potion')).toBe(0);

        inv.loadFrom(record);
        expect(inv.getItemCount('heal-potion')).toBe(2);
        expect(inv.getItemCount('star-candy')).toBe(1);
    });
});
