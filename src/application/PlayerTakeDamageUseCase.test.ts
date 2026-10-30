import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Health } from '../domain/entities/Health';
import {
    playerTakeDamageUseCase,
    PLAYER_DAMAGED_EVENT,
    PLAYER_BLOCKED_EVENT,
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
        expect(damageListener).toHaveBeenCalledWith({ currentHealth: 2, maxHealth: 3, armor: 0, maxArmor: 0 });
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
        expect(damageListener).toHaveBeenCalledWith({ currentHealth: 0, maxHealth: 3, armor: 0, maxArmor: 0 });
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

describe('playerTakeDamageUseCase with Guard', () =>
{
    it('stops the hit when the dice roll under the block chance, losing nothing', () =>
    {
        const health = new Health();
        const blocked = vi.fn();
        DomainEvents.on(PLAYER_BLOCKED_EVENT, blocked);

        expect(playerTakeDamageUseCase(health, undefined, { blockChance: 0.3, random: { next: () => 0.29 } })).toBe('blocked');
        DomainEvents.off(PLAYER_BLOCKED_EVENT, blocked);

        expect(health.current).toBe(3);
        expect(blocked).toHaveBeenCalledTimes(1);
    });

    it('lets the hit through when the dice roll above it, and with no Guard at all', () =>
    {
        const health = new Health();
        expect(playerTakeDamageUseCase(health, undefined, { blockChance: 0.3, random: { next: () => 0.3 } })).toBe('hit');
        expect(health.current).toBe(2);
        expect(playerTakeDamageUseCase(health, undefined, { blockChance: 0, random: { next: () => 0 } })).toBe('hit');
        expect(health.current).toBe(1);
        expect(playerTakeDamageUseCase(health)).toBe('hit');
        expect(health.isDead).toBe(true);
    });
});
