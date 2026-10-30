import { Backpack } from '../domain/entities/Backpack';

export type TransferResult =
    | { success: true; moved: number }
    | { success: false; reason: 'empty_slot' | 'destination_full' };

/**
 * Moves what is in one slot of `from` into `to` (Backpack <-> Storage chest). An item that wears moves one at a
 * time with the Durability it has. A stack moves as far as `to` has room; the rest stays where it was, so nothing
 * is lost. Nothing happens when `to` has no room at all.
 */
export function transferItemUseCase (from: Backpack, to: Backpack, slotIndex: number): TransferResult
{
    const slot = from.getSlot(slotIndex);
    if (!slot) return { success: false, reason: 'empty_slot' };

    // An item that wears is one to a slot and keeps its own Durability
    if (from.getSlotDurability(slotIndex) !== null)
    {
        if (to.isFull) return { success: false, reason: 'destination_full' };

        from.removeFromSlot(slotIndex, 1);
        to.addWithDurability(slot.itemId, slot.durability);
        return { success: true, moved: 1 };
    }

    const { added } = to.addItem(slot.itemId, slot.count);
    if (added === 0) return { success: false, reason: 'destination_full' };

    from.removeFromSlot(slotIndex, added);
    return { success: true, moved: added };
}
