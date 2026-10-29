import { describe, expect, it } from 'vitest';
import { AttackCooldown } from '../domain/entities/Combat';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { performAttackUseCase } from './PerformAttackUseCase';

describe('PerformAttackUseCase', () =>
{
    it('deals the equipped sword damage and starts its cooldown', () =>
    {
        const equipment = new EquipmentState();
        const cooldown = new AttackCooldown();

        const result = performAttackUseCase(equipment, cooldown);
        expect(result).toEqual({ weaponId: 'wooden-sword', damage: 12, range: 48, effectiveCooldown: 380 });
        expect(cooldown.canAttack()).toBe(false);
    });

    it('gets stronger with sword tier and upgrade level', () =>
    {
        const equipment = new EquipmentState('iron-sword');
        const wooden = performAttackUseCase(new EquipmentState(), new AttackCooldown());
        const iron = performAttackUseCase(equipment, new AttackCooldown());
        equipment.upgradeWeapon('iron-sword');
        const ironPlusOne = performAttackUseCase(equipment, new AttackCooldown());

        expect(iron!.damage).toBeGreaterThan(wooden!.damage);
        expect(ironPlusOne!.damage).toBe(27);
    });

    it('returns null if attack cooldown is not ready', () =>
    {
        const cooldown = new AttackCooldown();
        cooldown.trigger(300);

        expect(performAttackUseCase(new EquipmentState(), cooldown)).toBeNull();
    });
});
