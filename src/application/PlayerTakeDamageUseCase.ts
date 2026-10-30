import { DomainEvents } from '../domain/DomainEvents';
import { Health } from '../domain/entities/Health';
import type { Random } from '../domain/ports';
import { WornArmorContext, wearWornArmorUseCase } from './ArmorUseCases';

export const PLAYER_DAMAGED_EVENT = 'player-damaged';
export const PLAYER_DIED_EVENT = 'player-died';
export const PLAYER_BLOCKED_EVENT = 'player-blocked';

/** The Guard Stat: the chance (0 to 1) that a hit does nothing, with the dice to roll it. */
export interface GuardContext
{
    blockChance: number;
    random: Random;
}

export interface PlayerDamagedPayload
{
    currentHealth: number;
    maxHealth: number;
    /** Armor hearts left after the hit. */
    armor: number;
    maxArmor: number;
}

/**
 * Use case executed when the player contacts a hazard or enemy.
 * Deducts a heart and emits PLAYER_DAMAGED_EVENT or PLAYER_DIED_EVENT if depleted. With a `guard` the hit may
 * be stopped (PLAYER_BLOCKED_EVENT): nothing is lost and the Armor does not wear. Returns 'blocked' or 'hit'.
 * See "Application layer" in CONTEXT.md.
 */
export function playerTakeDamageUseCase (health: Health, armor?: WornArmorContext, guard?: GuardContext): 'blocked' | 'hit'
{
    if (health.isDead) return 'hit';

    if (guard && guard.blockChance > 0 && guard.random.next() < guard.blockChance)
    {
        DomainEvents.emit(PLAYER_BLOCKED_EVENT, {});
        return 'blocked';
    }

    // An Armor heart takes the hit before Health does, and the hit wears every worn piece
    const isDead = health.takeDamage();
    if (armor) wearWornArmorUseCase(armor);

    DomainEvents.emit<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, {
        currentHealth: health.current,
        maxHealth: health.max,
        armor: health.armor,
        maxArmor: health.maxArmor,
    });

    if (isDead)
    {
        DomainEvents.emit(PLAYER_DIED_EVENT, {});
    }
    return 'hit';
}
