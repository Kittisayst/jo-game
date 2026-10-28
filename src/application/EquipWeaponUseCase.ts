import { Backpack } from '../domain/entities/Backpack';
import { EquipmentState } from '../domain/entities/EquipmentState';

export type EquipWeaponResult =
    | { success: true }
    | { success: false; reason: 'not_in_backpack' | 'unknown_weapon' };

/** Equips a sword, but only one the player actually carries. */
export function equipWeaponUseCase (
    equipment: EquipmentState,
    backpack: Backpack,
    weaponId: string
): EquipWeaponResult
{
    if (backpack.getItemCount(weaponId) < 1) return { success: false, reason: 'not_in_backpack' };
    if (!equipment.equipWeapon(weaponId)) return { success: false, reason: 'unknown_weapon' };
    return { success: true };
}
