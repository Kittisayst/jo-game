import { AttackCooldown } from '../domain/entities/Combat';
import { EquipmentState } from '../domain/entities/EquipmentState';

export interface AttackResult
{
    weaponId: string;
    damage: number;
    range: number;
    effectiveCooldown: number;
}

/**
 * Executes a player attack if cooldown allows, using the equipped sword and its upgrade level.
 */
export function performAttackUseCase (
    equipment: EquipmentState,
    cooldown: AttackCooldown
): AttackResult | null
{
    if (!cooldown.canAttack())
    {
        return null;
    }

    const { id, damage, range, cooldownMs } = equipment.equippedStats;
    cooldown.trigger(cooldownMs);

    return {
        weaponId: id,
        damage,
        range,
        effectiveCooldown: cooldownMs,
    };
}
