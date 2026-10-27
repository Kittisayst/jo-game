import { DomainEvents } from '../domain/DomainEvents';
import { GameSession } from '../domain/entities/GameSession';

export const SESSION_TICK_EVENT = 'session-tick';
export const POWERUP_EXPIRED_EVENT = 'powerup-expired';

export interface SessionTickPayload
{
    elapsedSeconds: number;
    starTimer: number;
    springTimer: number;
}

export interface PowerUpExpiredPayload
{
    type: 'star' | 'spring';
}

export interface TickSessionResult
{
    elapsedSeconds: number;
    starExpired: boolean;
    springExpired: boolean;
}

export interface TickEmitterCache
{
    elapsedTenths: number;
    starSec: number;
    springSec: number;
}

export function createTickEmitterCache (): TickEmitterCache
{
    return {
        elapsedTenths: -1,
        starSec: -1,
        springSec: -1,
    };
}

/**
 * Use case called on every active frame (e.g. from Phaser's update loop).
 * Advances the session clock and power-up timers, emitting events when states expire
 * or when the displayed tenth-of-a-second / countdown seconds change.
 * See "Application layer" in CONTEXT.md.
 */
export function tickSessionUseCase (
    session: GameSession,
    deltaMs: number,
    cache?: TickEmitterCache
): TickSessionResult
{
    const result = session.tick(deltaMs);

    if (result.starExpired)
    {
        DomainEvents.emit<PowerUpExpiredPayload>(POWERUP_EXPIRED_EVENT, { type: 'star' });
    }
    if (result.springExpired)
    {
        DomainEvents.emit<PowerUpExpiredPayload>(POWERUP_EXPIRED_EVENT, { type: 'spring' });
    }

    if (cache)
    {
        const currentTenths = Math.floor(session.elapsedMs / 100);
        const currentStarSec = session.powerUps.starRemainingSeconds;
        const currentSpringSec = session.powerUps.springRemainingSeconds;

        if (
            currentTenths !== cache.elapsedTenths ||
            currentStarSec !== cache.starSec ||
            currentSpringSec !== cache.springSec
        )
        {
            cache.elapsedTenths = currentTenths;
            cache.starSec = currentStarSec;
            cache.springSec = currentSpringSec;

            DomainEvents.emit<SessionTickPayload>(SESSION_TICK_EVENT, {
                elapsedSeconds: session.elapsedSeconds,
                starTimer: currentStarSec,
                springTimer: currentSpringSec,
            });
        }
    }

    return result;
}
