import { Backpack } from '../domain/entities/Backpack';
import { AttackCooldown } from '../domain/entities/Combat';
import { damageAfterWear, DurabilityState } from '../domain/entities/Durability';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { wearItemUseCase } from './WearItemUseCase';

export interface AttackResult
{
    weaponId: string;
    damage: number;
    range: number;
    effectiveCooldown: number;
    /** How worn the weapon was when it swung; a Broken weapon does half damage. Missing for one that never wears. */
    durabilityState?: DurabilityState;
}

/**
 * Executes a player attack if cooldown allows, using the equipped sword and its upgrade level.
 * With the `backpack`, the swing takes one Durability off the sword, and a Broken sword hits for half.
 */
export function performAttackUseCase (
    equipment: EquipmentState,
    cooldown: AttackCooldown,
    backpack?: Backpack
): AttackResult | null
{
    if (!cooldown.canAttack())
    {
        return null;
    }

    const { id, damage: baseDamage, range, cooldownMs } = equipment.equippedStats;
    cooldown.trigger(cooldownMs);

    const reading = backpack?.getDurability(id) ?? null;
    if (backpack && reading) wearItemUseCase(backpack, id);

    return {
        weaponId: id,
        damage: reading ? damageAfterWear(baseDamage, reading.state) : baseDamage,
        range,
        effectiveCooldown: cooldownMs,
        ...(reading ? { durabilityState: reading.state } : {}),
    };
}
