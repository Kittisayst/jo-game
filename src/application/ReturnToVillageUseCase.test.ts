import { describe, expect, it } from 'vitest';
import { returnToVillageUseCase } from './ReturnToVillageUseCase';
import { Backpack } from '../domain/entities/Backpack';
import { createTestItemCatalog } from '../domain/testing/itemCatalog';

describe('ReturnToVillageUseCase', () =>
{
    it('preserves 100% materials and calls full heal when returning via safe waypoint', () =>
    {
        const backpack = new Backpack([], createTestItemCatalog());
        backpack.addItem('wood', 10);
        backpack.addItem('iron-ore', 6);
        let healed = false;

        const result = returnToVillageUseCase('safe_waypoint', backpack, () => { healed = true; });

        expect(result.keptAllMaterials).toBe(true);
        expect(result.lostMaterials).toEqual([]);
        expect(backpack.getItemCount('wood')).toBe(10);
        expect(backpack.getItemCount('iron-ore')).toBe(6);
        expect(healed).toBe(true);
    });

    it('inflicts 50% material loss upon death/retreat, but preserves tools and heals HP', () =>
    {
        const backpack = new Backpack([], createTestItemCatalog());
        backpack.addItem('wood', 10);
        backpack.addItem('axe-t1', 1);
        backpack.addItem('herb-potion', 2);
        let healed = false;

        const result = returnToVillageUseCase('death', backpack, () => { healed = true; });

        expect(result.keptAllMaterials).toBe(false);
        expect(result.lostMaterials).toEqual([{ itemId: 'wood', count: 5 }]);
        expect(backpack.getItemCount('wood')).toBe(5);
        expect(backpack.getItemCount('axe-t1')).toBe(1); // Tool preserved!
        expect(backpack.getItemCount('herb-potion')).toBe(2); // Consumable preserved!
        expect(healed).toBe(true);
    });
});

