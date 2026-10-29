import { DomainEvents } from '../domain/DomainEvents';
import { Health } from '../domain/entities/Health';

export const PLAYER_DAMAGED_EVENT = 'player-damaged';
export const PLAYER_DIED_EVENT = 'player-died';

export interface PlayerDamagedPayload
{
    currentHealth: number;
    maxHealth: number;
}

/**
 * Use case executed when the player contacts a hazard or enemy.
 * Deducts a heart and emits PLAYER_DAMAGED_EVENT or PLAYER_DIED_EVENT if depleted.
 * See "Application layer" in CONTEXT.md.
 */
export function playerTakeDamageUseCase (health: Health): void
{
    if (health.isDead) return;

    const isDead = health.takeDamage();

    DomainEvents.emit<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, {
        currentHealth: health.current,
        maxHealth: health.max,
    });

    if (isDead)
    {
        DomainEvents.emit(PLAYER_DIED_EVENT, {});
    }
}
