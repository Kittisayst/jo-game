import { Inventory, getItemDefinition } from '../domain/entities/Inventory';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';

export const ITEM_PURCHASED_EVENT = 'item-purchased';

export interface ItemPurchasedPayload
{
    itemId: string;
    quantity: number;
    totalCost: number;
    remainingBalance: number;
}

/**
 * Handles purchasing a consumable item from the shop.
 */
export function purchaseItemUseCase (
    wallet: Wallet,
    inventory: Inventory,
    itemId: string,
    quantity = 1
): boolean
{
    const def = getItemDefinition(itemId);
    if (!def) return false;
    if (quantity <= 0) return false;

    if (!inventory.canAddItem(itemId, quantity))
    {
        return false;
    }

    const totalCost = def.price * quantity;
    if (!wallet.canAfford(totalCost))
    {
        return false;
    }

    const spent = wallet.spend(totalCost);
    if (!spent) return false;

    const added = inventory.addItem(itemId, quantity);
    if (!added)
    {
        // Refund if adding failed
        wallet.earn(totalCost);
        return false;
    }

    DomainEvents.emit<ItemPurchasedPayload>(ITEM_PURCHASED_EVENT, {
        itemId,
        quantity,
        totalCost,
        remainingBalance: wallet.balance,
    });

    return true;
}
