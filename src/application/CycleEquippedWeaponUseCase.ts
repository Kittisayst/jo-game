import { Backpack } from '../domain/entities/Backpack';
import { EquipmentState, WEAPON_CONFIGS } from '../domain/entities/EquipmentState';

/**
 * Switches to the next sword the player actually carries (tier order, wrapping around).
 * Returns the id of the sword equipped afterwards.
 */
export function cycleEquippedWeaponUseCase (equipment: EquipmentState, backpack: Backpack): string
{
    const owned = Object.keys(WEAPON_CONFIGS).filter(id => backpack.getItemCount(id) > 0);
    if (owned.length <= 1) return equipment.equippedWeaponId;

    const currentIndex = owned.indexOf(equipment.equippedWeaponId);
    const nextId = owned[(currentIndex + 1) % owned.length];
    equipment.equipWeapon(nextId);
    return nextId;
}
