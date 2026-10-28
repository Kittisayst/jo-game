import { WeaponLoadout } from '../domain/entities/Weapon';
import { DomainEvents } from '../domain/DomainEvents';

export const WEAPON_EQUIPPED_EVENT = 'weapon-equipped';

export interface WeaponEquippedPayload
{
    weaponId: string;
}

/**
 * Handles equipping a weapon from the player's owned loadout.
 */
export function equipWeaponUseCase (
    weaponLoadout: WeaponLoadout,
    weaponId: string
): boolean
{
    const success = weaponLoadout.equipWeapon(weaponId);
    if (success)
    {
        DomainEvents.emit<WeaponEquippedPayload>(WEAPON_EQUIPPED_EVENT, { weaponId });
    }
    return success;
}

/**
 * Cycles to the next owned weapon.
 */
export function cycleNextWeaponUseCase (weaponLoadout: WeaponLoadout): string
{
    const nextId = weaponLoadout.cycleNext();
    DomainEvents.emit<WeaponEquippedPayload>(WEAPON_EQUIPPED_EVENT, { weaponId: nextId });
    return nextId;
}
