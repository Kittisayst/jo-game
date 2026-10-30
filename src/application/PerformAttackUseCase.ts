import { Backpack } from '../domain/entities/Backpack';
import { ActiveEffects } from '../domain/entities/ActiveEffects';
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
 * With the running `effects`, a strength Potion adds half to the damage (on top of any wear).
 */
export function performAttackUseCase (
    equipment: EquipmentState,
    cooldown: AttackCooldown,
    backpack?: Backpack,
    effects?: ActiveEffects,
    /** The Attack Stat: a factor on the damage (1 = none). */
    statMultiplier = 1
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
        damage: Math.round((reading ? damageAfterWear(baseDamage, reading.state) : baseDamage) * (effects?.damageMultiplier ?? 1) * statMultiplier),
        range,
        effectiveCooldown: cooldownMs,
        ...(reading ? { durabilityState: reading.state } : {}),
    };
}
