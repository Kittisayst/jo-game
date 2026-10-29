import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { cycleEquippedWeaponUseCase } from './CycleEquippedWeaponUseCase';

describe('CycleEquippedWeaponUseCase', () =>
{
    it('keeps the current sword when it is the only one owned', () =>
    {
        const equipment = new EquipmentState();
        const backpack = new Backpack();
        backpack.addItem('wooden-sword', 1);

        expect(cycleEquippedWeaponUseCase(equipment, backpack)).toBe('wooden-sword');
    });

    it('cycles through swords owned in the backpack in tier order and wraps around', () =>
    {
        const equipment = new EquipmentState();
        const backpack = new Backpack();
        backpack.addItem('wooden-sword', 1);
        backpack.addItem('crystal-sword', 1);
        backpack.addItem('iron-sword', 1);

        expect(cycleEquippedWeaponUseCase(equipment, backpack)).toBe('iron-sword');
        expect(equipment.equippedWeaponId).toBe('iron-sword');
        expect(cycleEquippedWeaponUseCase(equipment, backpack)).toBe('crystal-sword');
        expect(cycleEquippedWeaponUseCase(equipment, backpack)).toBe('wooden-sword');
    });

    it('ignores swords that are not in the backpack', () =>
    {
        const equipment = new EquipmentState('iron-sword');
        const backpack = new Backpack();
        backpack.addItem('iron-sword', 1);

        expect(cycleEquippedWeaponUseCase(equipment, backpack)).toBe('iron-sword');
    });
});
