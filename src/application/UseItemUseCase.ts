import { Inventory, ItemDefinition, getItemDefinition } from '../domain/entities/Inventory';
import { DomainEvents } from '../domain/DomainEvents';

export const ITEM_USED_EVENT = 'item-used';

export interface ItemUsedPayload
{
    itemId: string;
    effectType: string;
    effectValue: number;
}

/**
 * Handles consuming an item from inventory and triggering its effect.
 */
export function useItemUseCase (
    inventory: Inventory,
    itemId: string
): { success: boolean; item?: ItemDefinition }
{
    const def = getItemDefinition(itemId);
    if (!def)
    {
        return { success: false };
    }

    const consumed = inventory.consumeItem(itemId);
    if (!consumed)
    {
        return { success: false };
    }

    DomainEvents.emit<ItemUsedPayload>(ITEM_USED_EVENT, {
        itemId: def.id,
        effectType: def.effectType,
        effectValue: def.effectValue,
    });

    return { success: true, item: def };
}
