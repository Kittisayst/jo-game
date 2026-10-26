import { DomainEvents } from '../domain/DomainEvents';
import { Lives } from '../domain/entities/Lives';

export const PLAYER_DAMAGED_EVENT = 'player-damaged';
export const GAME_OVER_EVENT = 'game-over';

export interface PlayerDamagedPayload
{
    currentLives: number;
    maxLives: number;
}

/**
 * Use case executed when the player contacts a hazard or enemy.
 * Deducts a life and emits PLAYER_DAMAGED_EVENT or GAME_OVER_EVENT if depleted.
 * See "Application layer" in CONTEXT.md.
 */
export function playerTakeDamageUseCase (lives: Lives): void
{
    if (lives.isDead) return;

    const isDead = lives.takeDamage();

    DomainEvents.emit<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, {
        currentLives: lives.current,
        maxLives: lives.max,
    });

    if (isDead)
    {
        DomainEvents.emit(GAME_OVER_EVENT, {});
    }
}
