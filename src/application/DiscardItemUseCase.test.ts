import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { discardItemUseCase } from './DiscardItemUseCase';

describe('discardItemUseCase', () =>
{
    it('throws away one item from a stack', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 5);

        expect(discardItemUseCase(backpack, 0, 'material', 1)).toEqual({ success: true, discarded: 1 });
        expect(backpack.getItemCount('wood')).toBe(4);
    });

    it('empties the slot when discarding the whole stack', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 5);

        expect(discardItemUseCase(backpack, 0, 'material', 'all')).toEqual({ success: true, discarded: 5 });
        expect(backpack.getSlot(0)).toBeNull();
    });

    it('never discards more than the stack holds', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('stone', 2);

        expect(discardItemUseCase(backpack, 0, 'material', 10)).toEqual({ success: true, discarded: 2 });
        expect(backpack.getItemCount('stone')).toBe(0);
    });

    it('protects tools and weapons', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('axe-t1', 1);
        backpack.addItem('iron-sword', 1);

        expect(discardItemUseCase(backpack, 0, 'tool', 'all')).toEqual({ success: false, reason: 'protected_item' });
        expect(discardItemUseCase(backpack, 1, 'weapon', 1)).toEqual({ success: false, reason: 'protected_item' });
        expect(backpack.getItemCount('axe-t1')).toBe(1);
        expect(backpack.getItemCount('iron-sword')).toBe(1);
    });

    it('fails on an empty slot', () =>
    {
        expect(discardItemUseCase(new Backpack(), 3, 'material', 1)).toEqual({ success: false, reason: 'empty_slot' });
    });
});
