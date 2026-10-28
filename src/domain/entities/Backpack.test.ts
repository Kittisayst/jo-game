import { describe, expect, it } from 'vitest';
import { Backpack } from './Backpack';

describe('Backpack Entity', () =>
{
    it('manages 20 slots and adds items with stack boundaries', () =>
    {
        const backpack = new Backpack();
        expect(backpack.maxSlots).toBe(20);
        expect(backpack.usedSlotsCount).toBe(0);

        // Add 150 wood (should take 2 slots: 99 and 51)
        const result = backpack.addItem('wood', 150);
        expect(result.added).toBe(150);
        expect(result.overflow).toBe(0);
        expect(backpack.usedSlotsCount).toBe(2);
        expect(backpack.getItemCount('wood')).toBe(150);
    });

    it('rejects adding items when inventory is completely full', () =>
    {
        const backpack = new Backpack();
        // Fill all 20 slots with 1 axe each
        for (let i = 0; i < 20; i++)
        {
            backpack.addItem('axe-t1', 1);
        }
        expect(backpack.isFull).toBe(true);
        expect(backpack.canAddItem('stone', 1)).toBe(false);

        const addRes = backpack.addItem('stone', 5);
        expect(addRes.added).toBe(0);
        expect(addRes.overflow).toBe(5);
    });

    it('removes items cleanly across multiple slots', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 120); // slot 0: 99, slot 1: 21
        expect(backpack.getItemCount('wood')).toBe(120);

        const ok = backpack.removeItem('wood', 30);
        expect(ok).toBe(true);
        expect(backpack.getItemCount('wood')).toBe(90);
        expect(backpack.usedSlotsCount).toBe(1); // slot 1 cleared, slot 0 reduced to 90
    });

    it('accurately verifies canCraftAfterRemoving when backpack is full', () =>
    {
        const backpack = new Backpack();
        // Fill 19 slots with random junk
        for (let i = 0; i < 19; i++)
        {
            backpack.addItem(`junk-${i}`, 1, 1);
        }
        // Slot 20 holds 10 iron-ore
        backpack.addItem('iron-ore', 10);
        expect(backpack.isFull).toBe(true);

        // Cannot craft axe-t1 because it needs wood (missing)
        expect(backpack.canCraftAfterRemoving([{ itemId: 'wood', count: 5 }], 'axe-t1', 1)).toBe(false);

        // Now test when player has ingredients that free up their slot:
        // Recipe needs 10 iron-ore to craft 1 iron-sword.
        // Consuming 10 iron-ore completely frees up slot 20, making room for iron-sword!
        expect(backpack.canCraftAfterRemoving([{ itemId: 'iron-ore', count: 10 }], 'iron-sword', 1)).toBe(true);

        // But if recipe only consumes 5 iron-ore, leaving 5 in slot 20, no slot is freed up -> cannot fit iron-sword!
        expect(backpack.canCraftAfterRemoving([{ itemId: 'iron-ore', count: 5 }], 'iron-sword', 1)).toBe(false);
    });

    it('applies 50% material penalty on emergency retreat / death', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 10); // material: loses ceil(10*0.5) = 5
        backpack.addItem('stone', 7); // material: loses ceil(7*0.5) = 4, leaves 3
        backpack.addItem('axe-t1', 1); // tool: kept 100%
        backpack.addItem('herb-potion', 2); // consumable: kept 100%

        const penalty = backpack.applyRetreatPenalty();
        expect(penalty.lost).toEqual([
            { itemId: 'wood', count: 5 },
            { itemId: 'stone', count: 4 },
        ]);

        expect(backpack.getItemCount('wood')).toBe(5);
        expect(backpack.getItemCount('stone')).toBe(3);
        expect(backpack.getItemCount('axe-t1')).toBe(1);
        expect(backpack.getItemCount('herb-potion')).toBe(2);
    });

    it('keeps story items (crystal, boss-core) when applying the retreat penalty', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 5);
        backpack.addItem('crystal', 3);
        backpack.addItem('boss-core', 1);

        const penalty = backpack.applyRetreatPenalty();

        expect(penalty.lost).toEqual([{ itemId: 'wood', count: 3 }]);
        expect(backpack.getItemCount('wood')).toBe(2);
        expect(backpack.getItemCount('crystal')).toBe(3);
        expect(backpack.getItemCount('boss-core')).toBe(1);
    });

    it('serializes and deserializes snapshot cleanly', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 50);
        backpack.addItem('iron-ore', 12);

        const snapshot = backpack.toSnapshot();
        const restored = Backpack.fromSnapshot(snapshot);

        expect(restored.getItemCount('wood')).toBe(50);
        expect(restored.getItemCount('iron-ore')).toBe(12);
        expect(restored.usedSlotsCount).toBe(2);
    });

    it('removes slot directly and sorts slots cleanly', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 10);
        backpack.addItem('stone', 20);
        backpack.addItem('iron-ore', 5);

        expect(backpack.usedSlotsCount).toBe(3);

        // Remove stone at slot 1
        const removed = backpack.removeSlot(1);
        expect(removed).toBe(true);
        expect(backpack.getItemCount('stone')).toBe(0);
        expect(backpack.usedSlotsCount).toBe(2);

        // Sort items
        backpack.addItem('crystal', 2);
        backpack.sortSlots();
        const slots = backpack.getAllSlots().filter((s): s is NonNullable<typeof s> => s !== null);
        expect(slots[0].itemId).toBe('crystal');
        expect(slots[1].itemId).toBe('iron-ore');
        expect(slots[2].itemId).toBe('wood');
    });
});

describe('Backpack.removeFromSlot', () =>
{
    it('removes part of a stack and empties the slot at zero', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 5);

        expect(backpack.removeFromSlot(0, 2)).toBe(true);
        expect(backpack.getItemCount('wood')).toBe(3);
        expect(backpack.removeFromSlot(0, 3)).toBe(true);
        expect(backpack.getSlot(0)).toBeNull();
    });

    it('rejects an empty slot, a bad index or more than the slot holds', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 2);

        expect(backpack.removeFromSlot(5, 1)).toBe(false);
        expect(backpack.removeFromSlot(-1, 1)).toBe(false);
        expect(backpack.removeFromSlot(0, 3)).toBe(false);
        expect(backpack.removeFromSlot(0, 0)).toBe(false);
        expect(backpack.getItemCount('wood')).toBe(2);
    });
});
