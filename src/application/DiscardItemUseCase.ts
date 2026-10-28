import { Backpack } from '../domain/entities/Backpack';

export type DiscardItemResult =
    | { success: true; discarded: number }
    | { success: false; reason: 'empty_slot' | 'protected_item' };

/** Tools and weapons are never thrown away: losing the only pickaxe could block the loop. */
const PROTECTED_CATEGORIES = new Set(['tool', 'weapon']);

/**
 * Throws away `amount` items from one slot (or the whole stack with 'all').
 * `category` is the item's category from its definition.
 */
export function discardItemUseCase (
    backpack: Backpack,
    slotIndex: number,
    category: string,
    amount: number | 'all' = 1
): DiscardItemResult
{
    const slot = backpack.getSlot(slotIndex);
    if (!slot) return { success: false, reason: 'empty_slot' };
    if (PROTECTED_CATEGORIES.has(category)) return { success: false, reason: 'protected_item' };

    const count = amount === 'all' ? slot.count : Math.min(Math.max(1, Math.floor(amount)), slot.count);
    backpack.removeFromSlot(slotIndex, count);
    return { success: true, discarded: count };
}
