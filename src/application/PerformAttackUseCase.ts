import { AttackCooldown, calculateDamage, calculateEffectiveCooldown } from '../domain/entities/Combat';
import { UpgradeTree } from '../domain/entities/Upgrade';
import { WeaponDefinition, WeaponLoadout } from '../domain/entities/Weapon';

export interface AttackResult
{
    damage: number;
    range: number;
    effectiveCooldown: number;
    weapon: WeaponDefinition;
}

/**
 * Executes a player attack if cooldown allows, computing damage and attack range.
 */
export function performAttackUseCase (
    weaponLoadout: WeaponLoadout,
    upgradeTree: UpgradeTree,
    cooldown: AttackCooldown
): AttackResult | null
{
    if (!cooldown.canAttack())
    {
        return null;
    }

    const weapon = weaponLoadout.equippedDefinition;
    const stats = upgradeTree.computeStats();

    const damage = calculateDamage(weapon.baseDamage, stats.bonusDamage);
    const effectiveCooldown = calculateEffectiveCooldown(
        weapon.cooldownMs,
        stats.cooldownReductionFactor
    );

    cooldown.trigger(effectiveCooldown);

    return {
        damage,
        range: weapon.range,
        effectiveCooldown,
        weapon,
    };
}
