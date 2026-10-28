import { describe, expect, it } from 'vitest';
import {
    DEFAULT_WEAPON_ID,
    getWeaponDefinition,
    WEAPON_CATALOG,
    WeaponLoadout,
} from './Weapon';

describe('Weapon domain entity & catalog', () =>
{
    it('defines valid weapons in catalog with required properties', () =>
    {
        expect(WEAPON_CATALOG.length).toBeGreaterThanOrEqual(4);
        for (const weapon of WEAPON_CATALOG)
        {
            expect(weapon.id).toBeTruthy();
            expect(weapon.baseDamage).toBeGreaterThan(0);
            expect(weapon.cooldownMs).toBeGreaterThan(0);
            expect(weapon.range).toBeGreaterThan(0);
            expect(weapon.icon).toBeTruthy();
        }
    });

    it('retrieves weapon definition with fallback to default', () =>
    {
        const def = getWeaponDefinition('plasma-blaster');
        expect(def.id).toBe('plasma-blaster');
        expect(def.type).toBe('ranged');

        const fallback = getWeaponDefinition('unknown-weapon');
        expect(fallback.id).toBe(DEFAULT_WEAPON_ID);
    });

    it('initializes WeaponLoadout with default cyber-saber', () =>
    {
        const loadout = new WeaponLoadout();
        expect(loadout.ownedWeapons).toContain(DEFAULT_WEAPON_ID);
        expect(loadout.equippedId).toBe(DEFAULT_WEAPON_ID);
        expect(loadout.equippedDefinition.id).toBe(DEFAULT_WEAPON_ID);
    });

    it('unlocks weapons and prevents duplicate unlocks', () =>
    {
        const loadout = new WeaponLoadout();
        expect(loadout.unlockWeapon('plasma-blaster')).toBe(true);
        expect(loadout.hasWeapon('plasma-blaster')).toBe(true);
        expect(loadout.unlockWeapon('plasma-blaster')).toBe(false);

        expect(loadout.unlockWeapon('non-existent')).toBe(false);
    });

    it('equips owned weapons and rejects unowned weapons', () =>
    {
        const loadout = new WeaponLoadout();
        expect(loadout.equipWeapon('plasma-blaster')).toBe(false);

        loadout.unlockWeapon('plasma-blaster');
        expect(loadout.equipWeapon('plasma-blaster')).toBe(true);
        expect(loadout.equippedId).toBe('plasma-blaster');
    });

    it('cycles through owned weapons', () =>
    {
        const loadout = new WeaponLoadout();
        loadout.unlockWeapon('plasma-blaster');
        loadout.unlockWeapon('thunder-hammer');

        expect(loadout.equippedId).toBe(DEFAULT_WEAPON_ID);
        const next1 = loadout.cycleNext();
        expect(next1).toBe('plasma-blaster');
        const next2 = loadout.cycleNext();
        expect(next2).toBe('thunder-hammer');
        const next3 = loadout.cycleNext();
        expect(next3).toBe(DEFAULT_WEAPON_ID);
    });

    it('resets loadout to default', () =>
    {
        const loadout = new WeaponLoadout();
        loadout.unlockWeapon('plasma-blaster');
        loadout.equipWeapon('plasma-blaster');
        loadout.reset();

        expect(loadout.ownedWeapons).toEqual([DEFAULT_WEAPON_ID]);
        expect(loadout.equippedId).toBe(DEFAULT_WEAPON_ID);
    });
});
