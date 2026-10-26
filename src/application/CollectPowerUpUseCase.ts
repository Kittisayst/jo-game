import { DomainEvents } from '../domain/DomainEvents';
import { Lives } from '../domain/entities/Lives';
import { PowerUpState, PowerUpType } from '../domain/entities/PowerUp';

export const POWERUP_COLLECTED_EVENT = 'powerup-collected';

export interface PowerUpCollectedPayload
{
    type: PowerUpType;
    durationMs?: number;
    currentLives?: number;
}

/**
 * Use case executed when the player collects a power-up item.
 * Applies the domain effect (healing lives or activating power state)
 * and emits POWERUP_COLLECTED_EVENT.
 * See "Application layer" in CONTEXT.md.
 */
export function collectPowerUpUseCase (
    type: PowerUpType,
    lives: Lives,
    powerUpState: PowerUpState
): void
{
    if (type === 'heart')
    {
        lives.heal(1);
        DomainEvents.emit<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, {
            type,
            currentLives: lives.current,
        });
    }
    else if (type === 'star')
    {
        powerUpState.activateStar();
        DomainEvents.emit<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, {
            type,
            durationMs: 8000,
        });
    }
    else if (type === 'spring')
    {
        powerUpState.activateSpring();
        DomainEvents.emit<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, {
            type,
            durationMs: 10000,
        });
    }
}
