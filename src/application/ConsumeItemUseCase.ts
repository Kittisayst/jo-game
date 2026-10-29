import { DomainEvents } from '../domain/DomainEvents';
import { Backpack } from '../domain/entities/Backpack';
import { Health } from '../domain/entities/Health';

export const PLAYER_HEALED_EVENT = 'player-healed';

export interface PlayerHealedPayload
{
    currentHealth: number;
    maxHealth: number;
}

/** What eating or drinking an item does; comes from the item's definition in `items.json`. */
export interface ConsumableEffect
{
    /** Hearts restored. */
    healAmount?: number;
}

export type ConsumeItemResult =
    | { success: true; healed: number }
    | { success: false; reason: 'not_in_backpack' | 'no_effect' | 'already_full' | 'dead' };

/**
 * Uses one consumable from the backpack. The item is only spent when it does something:
 * a potion at full health, or an item with no effect, stays in the backpack.
 */
export function consumeItemUseCase (
    backpack: Backpack,
    health: Health,
    itemId: string,
    effect: ConsumableEffect
): ConsumeItemResult
{
    if (backpack.getItemCount(itemId) < 1) return { success: false, reason: 'not_in_backpack' };

    const heal = effect.healAmount ?? 0;
    if (heal <= 0) return { success: false, reason: 'no_effect' };
    if (health.isDead) return { success: false, reason: 'dead' };
    if (health.current >= health.max) return { success: false, reason: 'already_full' };

    const before = health.current;
    health.heal(heal);
    backpack.removeItem(itemId, 1);

    DomainEvents.emit<PlayerHealedPayload>(PLAYER_HEALED_EVENT, {
        currentHealth: health.current,
        maxHealth: health.max,
    });

    return { success: true, healed: health.current - before };
}
