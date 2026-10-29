import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Health } from '../domain/entities/Health';
import {
    playerTakeDamageUseCase,
    PLAYER_DAMAGED_EVENT,
    PLAYER_DIED_EVENT,
    PlayerDamagedPayload,
} from './PlayerTakeDamageUseCase';

describe('playerTakeDamageUseCase', () =>
{
    it('deducts a heart and emits PLAYER_DAMAGED_EVENT when not fatal', () =>
    {
        const health = new Health(3, 3);
        const damageListener = vi.fn();
        const gameOverListener = vi.fn();

        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.on(PLAYER_DIED_EVENT, gameOverListener);

        playerTakeDamageUseCase(health);

        DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.off(PLAYER_DIED_EVENT, gameOverListener);

        expect(health.current).toBe(2);
        expect(damageListener).toHaveBeenCalledWith({ currentHealth: 2, maxHealth: 3 });
        expect(gameOverListener).not.toHaveBeenCalled();
    });

    it('emits PLAYER_DIED_EVENT when life reaches 0', () =>
    {
        const health = new Health(1, 3);
        const damageListener = vi.fn();
        const gameOverListener = vi.fn();

        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.on(PLAYER_DIED_EVENT, gameOverListener);

        playerTakeDamageUseCase(health);

        DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.off(PLAYER_DIED_EVENT, gameOverListener);

        expect(health.current).toBe(0);
        expect(health.isDead).toBe(true);
        expect(damageListener).toHaveBeenCalledWith({ currentHealth: 0, maxHealth: 3 });
        expect(gameOverListener).toHaveBeenCalledOnce();
    });

    it('does not emit events if player was already dead', () =>
    {
        const health = new Health(0, 3);
        const damageListener = vi.fn();
        const gameOverListener = vi.fn();

        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.on(PLAYER_DIED_EVENT, gameOverListener);

        playerTakeDamageUseCase(health);

        DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, damageListener);
        DomainEvents.off(PLAYER_DIED_EVENT, gameOverListener);

        expect(damageListener).not.toHaveBeenCalled();
        expect(gameOverListener).not.toHaveBeenCalled();
    });
});
