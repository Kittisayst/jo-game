import { describe, expect, it } from 'vitest';
import { AttackCooldown } from '../domain/entities/Combat';
import { UpgradeTree } from '../domain/entities/Upgrade';
import { WeaponLoadout } from '../domain/entities/Weapon';
import { performAttackUseCase } from './PerformAttackUseCase';

describe('PerformAttackUseCase', () =>
{
    it('executes attack when cooldown is ready and applies stats', () =>
    {
        const loadout = new WeaponLoadout();
        const tree = new UpgradeTree({ weaponPower: 3, attackSpeed: 2 }); // +2 damage, 24% faster
        const cooldown = new AttackCooldown();

        const result = performAttackUseCase(loadout, tree, cooldown);
        expect(result).not.toBeNull();
        expect(result?.damage).toBe(3); // base 1 + 2 bonus
        expect(result?.weapon.id).toBe('cyber-saber');
        expect(cooldown.canAttack()).toBe(false);
    });

    it('returns null if attack cooldown is not ready', () =>
    {
        const loadout = new WeaponLoadout();
        const tree = new UpgradeTree();
        const cooldown = new AttackCooldown();

        cooldown.trigger(300);
        const result = performAttackUseCase(loadout, tree, cooldown);
        expect(result).toBeNull();
    });
});
