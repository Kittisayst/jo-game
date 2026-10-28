import { WeaponLoadout, getWeaponDefinition } from '../domain/entities/Weapon';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';

export const WEAPON_PURCHASED_EVENT = 'weapon-purchased';

export interface WeaponPurchasedPayload
{
    weaponId: string;
    cost: number;
    remainingBalance: number;
}

/**
 * Handles purchasing new weapons from the shop and automatically equipping them.
 */
export function purchaseWeaponUseCase (
    wallet: Wallet,
    weaponLoadout: WeaponLoadout,
    weaponId: string
): boolean
{
    if (weaponLoadout.hasWeapon(weaponId))
    {
        return false;
    }

    const def = getWeaponDefinition(weaponId);
    if (!wallet.canAfford(def.price))
    {
        return false;
    }

    const spent = wallet.spend(def.price);
    if (!spent) return false;

    const unlocked = weaponLoadout.unlockWeapon(weaponId);
    if (!unlocked)
    {
        wallet.earn(def.price);
        return false;
    }

    weaponLoadout.equipWeapon(weaponId);

    DomainEvents.emit<WeaponPurchasedPayload>(WEAPON_PURCHASED_EVENT, {
        weaponId,
        cost: def.price,
        remainingBalance: wallet.balance,
    });

    return true;
}
