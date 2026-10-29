import { describe, expect, it } from 'vitest';
import { Backpack } from './Backpack';
import { DEFAULT_MAX_STACK, ItemCatalog, ItemDefinition } from './ItemCatalog';
import { createTestItemCatalog } from '../testing/itemCatalog';

const item = (overrides: Partial<ItemDefinition>): ItemDefinition => ({
    id: 'thing',
    name: 'Thing',
    nameEn: 'Thing',
    description: '',
    category: 'material',
    maxStack: 10,
    icon: '?',
    ...overrides,
});

describe('ItemCatalog', () =>
{
    it('answers per-item questions from its definitions', () =>
    {
        const catalog = new ItemCatalog([
            item({ id: 'ore', maxStack: 50 }),
            item({ id: 'gem', story: true, maxStack: 5 }),
            item({ id: 'axe', category: 'tool', maxStack: 1 }),
        ]);

        expect(catalog.maxStackOf('ore')).toBe(50);
        expect(catalog.isMaterial('ore')).toBe(true);
        expect(catalog.isLostOnRetreat('ore')).toBe(true);
        expect(catalog.isLostOnRetreat('gem')).toBe(false);
        expect(catalog.isStory('gem')).toBe(true);
        expect(catalog.isLostOnRetreat('axe')).toBe(false);
    });

    it('falls back to the default stack size for unknown items', () =>
    {
        const catalog = new ItemCatalog();

        expect(catalog.maxStackOf('mystery')).toBe(DEFAULT_MAX_STACK);
        expect(catalog.isLostOnRetreat('mystery')).toBe(false);
        expect(catalog.get('mystery')).toBeUndefined();
    });

    it('can be filled after it was handed to a Backpack', () =>
    {
        const catalog = new ItemCatalog();
        const backpack = new Backpack([], catalog);

        catalog.load([item({ id: 'potion', category: 'consumable', maxStack: 3 })]);

        expect(backpack.addItem('potion', 7)).toEqual({ added: 7, overflow: 0 });
        expect(backpack.getAllSlots().filter(Boolean).map(s => s!.count)).toEqual([3, 3, 1]);
    });
});

describe('Backpack with the shipped items.json', () =>
{
    it('stacks potions by 20 and tools by 1', () =>
    {
        const backpack = new Backpack([], createTestItemCatalog());

        backpack.addItem('herb-potion', 25);
        backpack.addItem('axe-t1', 2);

        expect(backpack.getItemCount('herb-potion')).toBe(25);
        expect(backpack.usedSlotsCount).toBe(4);
    });
});
