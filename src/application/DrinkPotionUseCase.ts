import { DomainEvents } from '../domain/DomainEvents';
import { ActiveEffects } from '../domain/entities/ActiveEffects';
import { Backpack } from '../domain/entities/Backpack';
import { Health } from '../domain/entities/Health';
import { ItemDefinition } from '../domain/entities/ItemCatalog';
import { consumeItemUseCase } from './ConsumeItemUseCase';

export const POTION_DRUNK_EVENT = 'potion-drunk';

export interface PotionDrunkPayload
{
    itemId: string;
    effect: 'heal' | 'strength' | 'armor' | 'speed';
}

export type DrinkPotionResult =
    | { success: true; effect: PotionDrunkPayload['effect'] }
    | { success: false; reason: 'not_in_backpack' | 'not_a_potion' | 'already_full' | 'dead' };

/** The kind of Potion an item is, or null when drinking it does nothing (a Repair Kit, a Material). */
export function potionEffectOf (definition: ItemDefinition | undefined): PotionDrunkPayload['effect'] | null
{
    if (!definition) return null;
    if (definition.effect) return definition.effect;
    return definition.healAmount && definition.healAmount > 0 ? 'heal' : null;
}

/**
 * Drinks one Potion from the Backpack. It is only spent when it does something: a health potion at full
 * health stays. Strength and speed run for `durationSec` (drinking again restarts the time, it does not stack);
 * an armor potion adds Armor hearts that last until the hero is home.
 */
export function drinkPotionUseCase (
    definition: ItemDefinition | undefined,
    backpack: Backpack,
    health: Health,
    effects: ActiveEffects
): DrinkPotionResult
{
    const effect = potionEffectOf(definition);
    if (!definition || !effect) return { success: false, reason: 'not_a_potion' };
    if (backpack.getItemCount(definition.id) < 1) return { success: false, reason: 'not_in_backpack' };
    if (health.isDead) return { success: false, reason: 'dead' };

    if (effect === 'heal')
    {
        const result = consumeItemUseCase(backpack, health, definition.id, { healAmount: definition.healAmount });
        if (!result.success) return { success: false, reason: result.reason === 'already_full' ? 'already_full' : 'not_a_potion' };
    }
    else
    {
        if (effect === 'armor') health.addBonusArmor(definition.amount ?? 1);
        else effects.apply(effect, definition.durationSec ?? 60);
        backpack.removeItem(definition.id, 1);
    }

    DomainEvents.emit<PotionDrunkPayload>(POTION_DRUNK_EVENT, { itemId: definition.id, effect });
    return { success: true, effect };
}
