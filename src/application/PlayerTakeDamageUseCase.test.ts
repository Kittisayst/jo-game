import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Lives } from '../domain/entities/Lives';
import {
    playerTakeDamageUseCase,
    PLAYER_DAMAGED_EVENT,
    GAME_OVER_EVENT,
    PlayerDamagedPayload,
} from './PlayerTakeDamageUseCase';

describe('playerTakeDamageUseCase', () =>
{
    it('deducts a life and emits PLAYER_DAMAGED_EVENT when not fatal', () =>
    {
        const lives = new Lives(3, 3);
        const damageListener = vi.fn();
        const gameOverListener = vi.fn();

        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.on(GAME_OVER_EVENT, gameOverListener);

        playerTakeDamageUseCase(lives);

        DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.off(GAME_OVER_EVENT, gameOverListener);

        expect(lives.current).toBe(2);
        expect(damageListener).toHaveBeenCalledWith({ currentLives: 2, maxLives: 3 });
        expect(gameOverListener).not.toHaveBeenCalled();
    });

    it('emits GAME_OVER_EVENT when life reaches 0', () =>
    {
        const lives = new Lives(1, 3);
        const damageListener = vi.fn();
        const gameOverListener = vi.fn();

        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.on(GAME_OVER_EVENT, gameOverListener);

        playerTakeDamageUseCase(lives);

        DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.off(GAME_OVER_EVENT, gameOverListener);

        expect(lives.current).toBe(0);
        expect(lives.isDead).toBe(true);
        expect(damageListener).toHaveBeenCalledWith({ currentLives: 0, maxLives: 3 });
        expect(gameOverListener).toHaveBeenCalledOnce();
    });

    it('does not emit events if player was already dead', () =>
    {
        const lives = new Lives(0, 3);
        const damageListener = vi.fn();
        const gameOverListener = vi.fn();

        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.on(GAME_OVER_EVENT, gameOverListener);

        playerTakeDamageUseCase(lives);

        DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.off(GAME_OVER_EVENT, gameOverListener);

        expect(damageListener).not.toHaveBeenCalled();
        expect(gameOverListener).not.toHaveBeenCalled();
    });
});
