import { describe, expect, it } from 'vitest';
import { WeaponLoadout } from '../domain/entities/Weapon';
import { cycleNextWeaponUseCase, equipWeaponUseCase } from './EquipWeaponUseCase';

describe('EquipWeaponUseCase', () =>
{
    it('equips owned weapon', () =>
    {
        const loadout = new WeaponLoadout();
        loadout.unlockWeapon('plasma-blaster');

        expect(equipWeaponUseCase(loadout, 'plasma-blaster')).toBe(true);
        expect(loadout.equippedId).toBe('plasma-blaster');
    });

    it('rejects unowned weapon', () =>
    {
        const loadout = new WeaponLoadout();
        expect(equipWeaponUseCase(loadout, 'thunder-hammer')).toBe(false);
        expect(loadout.equippedId).toBe('cyber-saber');
    });

    it('cycles through owned weapons', () =>
    {
        const loadout = new WeaponLoadout();
        loadout.unlockWeapon('plasma-blaster');

        const next = cycleNextWeaponUseCase(loadout);
        expect(next).toBe('plasma-blaster');
    });
});
