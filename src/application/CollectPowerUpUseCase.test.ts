import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Lives } from '../domain/entities/Lives';
import { PowerUpState } from '../domain/entities/PowerUp';
import {
    collectPowerUpUseCase,
    POWERUP_COLLECTED_EVENT,
    PowerUpCollectedPayload,
} from './CollectPowerUpUseCase';

describe('collectPowerUpUseCase', () =>
{
    it('heals lives and emits event for heart power-up', () =>
    {
        const lives = new Lives(1, 3);
        const state = new PowerUpState();
        const listener = vi.fn();

        DomainEvents.on<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, listener);
        collectPowerUpUseCase('heart', lives, state);
        DomainEvents.off<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, listener);

        expect(lives.current).toBe(2);
        expect(listener).toHaveBeenCalledWith({
            type: 'heart',
            currentLives: 2,
        });
    });

    it('activates star and emits duration for star power-up', () =>
    {
        const lives = new Lives(3, 3);
        const state = new PowerUpState();
        const listener = vi.fn();

        DomainEvents.on<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, listener);
        collectPowerUpUseCase('star', lives, state);
        DomainEvents.off<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, listener);

        expect(state.isStarActive).toBe(true);
        expect(listener).toHaveBeenCalledWith({
            type: 'star',
            durationMs: 8000,
        });
    });

    it('activates spring and emits duration for spring power-up', () =>
    {
        const lives = new Lives(3, 3);
        const state = new PowerUpState();
        const listener = vi.fn();

        DomainEvents.on<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, listener);
        collectPowerUpUseCase('spring', lives, state);
        DomainEvents.off<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, listener);

        expect(state.isSpringActive).toBe(true);
        expect(listener).toHaveBeenCalledWith({
            type: 'spring',
            durationMs: 10000,
        });
    });
});
