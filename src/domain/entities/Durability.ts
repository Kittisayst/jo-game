/**
 * Durability: how worn a weapon or tool is. It goes down by one per attack or Strike; at zero the item is
 * Broken, which means it stays in the Backpack but works worse. Pure rules, see "Durability" in CONTEXT.md.
 */

export type DurabilityState = 'ok' | 'low' | 'broken';

/** An item is "low" (a warning is shown) at or below this share of its maximum. */
export const LOW_DURABILITY_FRACTION = 0.2;
/** A Broken weapon does this share of its damage. */
export const BROKEN_DAMAGE_MULTIPLIER = 0.5;
/** A Broken tool counts each Strike for this much, so the node takes twice the Strikes. */
export const BROKEN_STRIKE_WEIGHT = 0.5;
/** Share of its maximum an item loses when the hero dies. */
export const DEATH_WEAR_FRACTION = 0.1;

export function durabilityStateOf (current: number, max: number): DurabilityState
{
    if (current <= 0) return 'broken';
    return current <= max * LOW_DURABILITY_FRACTION ? 'low' : 'ok';
}

/** The damage a weapon does in this state (never less than 1). */
export function damageAfterWear (damage: number, state: DurabilityState): number
{
    return state === 'broken' ? Math.max(1, Math.round(damage * BROKEN_DAMAGE_MULTIPLIER)) : damage;
}

/** How much one Strike with a tool in this state counts towards depleting a Resource node. */
export function strikeWeightFor (state: DurabilityState): number
{
    return state === 'broken' ? BROKEN_STRIKE_WEIGHT : 1;
}

/** How much Durability an item with `max` loses when the hero dies: a tenth of it, at least 1. */
export function deathWearAmount (max: number): number
{
    return Math.max(1, Math.ceil(max * DEATH_WEAR_FRACTION));
}
