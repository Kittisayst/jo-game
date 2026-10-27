import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { GameSession } from '../domain/entities/GameSession';
import {
    createTickEmitterCache,
    POWERUP_EXPIRED_EVENT,
    PowerUpExpiredPayload,
    SESSION_TICK_EVENT,
    SessionTickPayload,
    tickSessionUseCase,
} from './TickSessionUseCase';

describe('TickSessionUseCase', () =>
{
    beforeEach(() =>
    {
        DomainEvents.clear();
    });

    it('ticks session and returns elapsed time', () =>
    {
        const session = new GameSession();
        const res = tickSessionUseCase(session, 16.6);

        expect(res.elapsedSeconds).toBe(0);
        expect(res.starExpired).toBe(false);
        expect(res.springExpired).toBe(false);
    });

    it('emits POWERUP_EXPIRED_EVENT when power-up duration runs out', () =>
    {
        const session = new GameSession();
        session.powerUps.activateStar(100);

        const onExpired = vi.fn();
        DomainEvents.on<PowerUpExpiredPayload>(POWERUP_EXPIRED_EVENT, onExpired);

        tickSessionUseCase(session, 50);
        expect(onExpired).not.toHaveBeenCalled();

        tickSessionUseCase(session, 50);
        expect(onExpired).toHaveBeenCalledWith({ type: 'star' });
    });

    it('emits SESSION_TICK_EVENT only when tenths or countdown seconds change', () =>
    {
        const session = new GameSession();
        session.powerUps.activateStar(2000);
        const cache = createTickEmitterCache();

        const onTick = vi.fn();
        DomainEvents.on<SessionTickPayload>(SESSION_TICK_EVENT, onTick);

        // First tick sets initial values in cache
        tickSessionUseCase(session, 50, cache);
        expect(onTick).toHaveBeenCalledTimes(1);
        expect(onTick).toHaveBeenCalledWith({
            elapsedSeconds: 0.1,
            starTimer: 2,
            springTimer: 0,
        });

        // Small tick within same tenth (elapsed goes to 70ms -> Math.floor(70/100) = 0)
        tickSessionUseCase(session, 20, cache);
        expect(onTick).toHaveBeenCalledTimes(1);

        // Tick crossing 100ms tenth boundary (elapsed goes to 120ms -> Math.floor(120/100) = 1)
        tickSessionUseCase(session, 50, cache);
        expect(onTick).toHaveBeenCalledTimes(2);
        expect(onTick).toHaveBeenLastCalledWith({
            elapsedSeconds: 0.1,
            starTimer: 2,
            springTimer: 0,
        });
    });
});
