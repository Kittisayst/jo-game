import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { equipWeaponUseCase } from './EquipWeaponUseCase';

describe('equipWeaponUseCase', () =>
{
    it('equips a carried sword', () =>
    {
        const equipment = new EquipmentState();
        const backpack = new Backpack();
        backpack.addItem('iron-sword', 1);

        expect(equipWeaponUseCase(equipment, backpack, 'iron-sword')).toEqual({ success: true });
        expect(equipment.equippedWeaponId).toBe('iron-sword');
    });

    it('refuses a sword that is not in the backpack and keeps the current one', () =>
    {
        const equipment = new EquipmentState();

        expect(equipWeaponUseCase(equipment, new Backpack(), 'crystal-sword'))
            .toEqual({ success: false, reason: 'not_in_backpack' });
        expect(equipment.equippedWeaponId).toBe('wooden-sword');
    });

    it('refuses an id that is not a weapon', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('wood', 1);

        expect(equipWeaponUseCase(new EquipmentState(), backpack, 'wood'))
            .toEqual({ success: false, reason: 'unknown_weapon' });
    });
});
