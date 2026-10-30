import { DomainEvents } from '../domain/DomainEvents';
import { Health } from '../domain/entities/Health';
import { WornArmorContext, wearWornArmorUseCase } from './ArmorUseCases';

export const PLAYER_DAMAGED_EVENT = 'player-damaged';
export const PLAYER_DIED_EVENT = 'player-died';

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
 * Deducts a heart and emits PLAYER_DAMAGED_EVENT or PLAYER_DIED_EVENT if depleted.
 * See "Application layer" in CONTEXT.md.
 */
export function playerTakeDamageUseCase (health: Health, armor?: WornArmorContext): void
{
    if (health.isDead) return;

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
}
