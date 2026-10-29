import { describe, expect, it } from 'vitest';
import { Backpack } from './Backpack';
import { findTool, heldItemFor } from './HeldItem';

describe('findTool', () =>
{
    it('finds the carried tool of the needed kind', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 3);
        backpack.addItem('axe-t1', 1);

        expect(findTool(backpack, 'axe')).toBe('axe-t1');
        expect(findTool(backpack, 'pickaxe')).toBeNull();
    });

    it('prefers the highest tier when several are carried', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('axe-t1', 1);
        backpack.addItem('axe-t2', 1);

        expect(findTool(backpack, 'axe')).toBe('axe-t2');
    });

    it('does not mistake a pickaxe for an axe', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('pickaxe-t1', 1);

        expect(findTool(backpack, 'axe')).toBeNull();
    });
});

describe('heldItemFor', () =>
{
    it('keeps the hands empty in the Village Hub', () =>
    {
        expect(heldItemFor({ inVillage: true, equippedWeaponId: 'iron-sword', toolInUse: null })).toBeNull();
    });

    it('holds the equipped weapon in a Stage', () =>
    {
        expect(heldItemFor({ inVillage: false, equippedWeaponId: 'iron-sword', toolInUse: null })).toBe('iron-sword');
    });

    it('holds the tool while it is being used, even in the village', () =>
    {
        expect(heldItemFor({ inVillage: false, equippedWeaponId: 'iron-sword', toolInUse: 'axe-t1' })).toBe('axe-t1');
        expect(heldItemFor({ inVillage: true, equippedWeaponId: 'iron-sword', toolInUse: 'hammer-t1' })).toBe('hammer-t1');
    });
});
