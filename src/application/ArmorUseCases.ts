import { DomainEvents } from '../domain/DomainEvents';
import { ARMOR_SLOTS, ArmorSlot, armorHeartsOf } from '../domain/entities/Armor';
import { Backpack, DurabilityChange } from '../domain/entities/Backpack';
import { deathWearAmount } from '../domain/entities/Durability';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { Health } from '../domain/entities/Health';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
import { announceDurabilityChange } from './WearItemUseCase';

export const ARMOR_CHANGED_EVENT = 'armor-changed';

export interface ArmorChangedPayload
{
    armor: number;
    maxArmor: number;
}

/** What the worn Armor gives and what it is wearing out of: bundled so a use case needs one argument. */
export interface WornArmorContext
{
    equipment: EquipmentState;
    health: Health;
    catalog: ItemCatalog;
}

/** Makes the Armor hearts match the worn pieces (a Broken piece gives none). */
export function syncArmorUseCase ({ equipment, health, catalog }: WornArmorContext): void
{
    health.syncMaxArmor(armorHeartsOf(equipment.wornArmor.map(w => w.piece), catalog));
    DomainEvents.emit<ArmorChangedPayload>(ARMOR_CHANGED_EVENT, { armor: health.armor, maxArmor: health.maxArmor });
}

export type EquipArmorResult =
    | { success: true; replacedItemId: string | null }
    | { success: false; reason: 'not_armor' | 'not_in_backpack' };

/**
 * Puts a piece of Armor on from the Backpack. A worn piece does not take a Backpack slot; a piece that was
 * already in that place goes back into the Backpack with the Durability it had.
 */
export function equipArmorUseCase (itemId: string, backpack: Backpack, context: WornArmorContext): EquipArmorResult
{
    const definition = context.catalog.get(itemId);
    if (!definition || definition.category !== 'armor' || !definition.slot) return { success: false, reason: 'not_armor' };

    const taken = backpack.takeOne(itemId);
    if (!taken) return { success: false, reason: 'not_in_backpack' };

    const previous = context.equipment.equipArmor(definition.slot, taken);
    // Taking the new piece out freed a slot, so the old one always fits back
    if (previous) backpack.addWithDurability(previous.itemId, previous.durability);

    syncArmorUseCase(context);
    return { success: true, replacedItemId: previous?.itemId ?? null };
}

export type UnequipArmorResult =
    | { success: true; itemId: string }
    | { success: false; reason: 'nothing_worn' | 'backpack_full' };

/** Takes the piece off `slot` and puts it into the Backpack. Refused when the Backpack is full. */
export function unequipArmorUseCase (slot: ArmorSlot, backpack: Backpack, context: WornArmorContext): UnequipArmorResult
{
    const worn = context.equipment.getArmor(slot);
    if (!worn) return { success: false, reason: 'nothing_worn' };
    if (backpack.isFull) return { success: false, reason: 'backpack_full' };

    context.equipment.unequipArmor(slot);
    backpack.addWithDurability(worn.itemId, worn.durability);

    syncArmorUseCase(context);
    return { success: true, itemId: worn.itemId };
}

/** Takes `amount` Durability off the piece worn in `slot` and announces it. Returns what changed, or null. */
export function wearArmorPieceUseCase (slot: ArmorSlot, amount: number, { equipment, catalog }: WornArmorContext): DurabilityChange | null
{
    const piece = equipment.getArmor(slot);
    const max = piece ? catalog.maxDurabilityOf(piece.itemId) : undefined;
    if (!piece || max === undefined) return null;

    const previous = Math.max(0, Math.min(max, piece.durability ?? max));
    const current = Math.max(0, previous - Math.max(0, amount));
    equipment.setArmorDurability(slot, current);

    const change = { itemId: piece.itemId, previous, current, max };
    if (current !== previous) announceDurabilityChange(change);
    return change;
}

/** A hit taken wears every worn piece by one, then the Armor hearts follow what is left. */
export function wearWornArmorUseCase (context: WornArmorContext): void
{
    let any = false;
    for (const slot of ARMOR_SLOTS)
    {
        if (wearArmorPieceUseCase(slot, 1, context)) any = true;
    }
    if (any) syncArmorUseCase(context);
}

/** The hero died: every worn piece loses a tenth of its maximum. */
export function deathWearWornArmorUseCase (context: WornArmorContext): void
{
    let any = false;
    for (const slot of ARMOR_SLOTS)
    {
        const piece = context.equipment.getArmor(slot);
        const max = piece ? context.catalog.maxDurabilityOf(piece.itemId) : undefined;
        if (piece && max !== undefined && wearArmorPieceUseCase(slot, deathWearAmount(max), context)) any = true;
    }
    if (any) syncArmorUseCase(context);
}
