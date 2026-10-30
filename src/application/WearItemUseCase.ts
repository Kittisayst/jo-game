import { Backpack, DurabilityChange } from '../domain/entities/Backpack';
import { DurabilityState, durabilityStateOf } from '../domain/entities/Durability';
import { DomainEvents } from '../domain/DomainEvents';

export const ITEM_WORN_EVENT = 'item-worn';
export const ITEM_BROKEN_EVENT = 'item-broken';
export const ITEM_REPAIRED_EVENT = 'item-repaired';

export interface ItemWornPayload
{
    itemId: string;
    current: number;
    max: number;
    state: DurabilityState;
    previousState: DurabilityState;
}

export interface ItemBrokenPayload
{
    itemId: string;
}

function announce (change: DurabilityChange): void
{
    const previousState = durabilityStateOf(change.previous, change.max);
    const state = durabilityStateOf(change.current, change.max);

    DomainEvents.emit<ItemWornPayload>(ITEM_WORN_EVENT, {
        itemId: change.itemId,
        current: change.current,
        max: change.max,
        state,
        previousState,
    });

    if (state === 'broken' && previousState !== 'broken')
    {
        DomainEvents.emit<ItemBrokenPayload>(ITEM_BROKEN_EVENT, { itemId: change.itemId });
    }
}

/**
 * One use of a weapon or tool takes one Durability off it. Announces the new state, and a break when it
 * reaches zero. Does nothing for an item that is missing or never wears. Returns what changed, or null.
 */
export function wearItemUseCase (backpack: Backpack, itemId: string, amount = 1): DurabilityChange | null
{
    const change = backpack.wearItem(itemId, amount);
    // An item that is already Broken has nothing left to lose: say nothing
    if (change && change.current !== change.previous) announce(change);
    return change;
}

/** The hero died: every item that wears loses a tenth of its Durability. Returns what changed. */
export function deathWearUseCase (backpack: Backpack): DurabilityChange[]
{
    const changes = backpack.wearAllDurable();
    for (const change of changes) announce(change);
    return changes;
}
