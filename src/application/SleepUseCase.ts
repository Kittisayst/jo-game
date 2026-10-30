import { DomainEvents } from '../domain/DomainEvents';
import { CraftingQueue } from '../domain/entities/CraftingQueue';
import { Health } from '../domain/entities/Health';
import { WorldTime } from '../domain/entities/WorldTime';
import { PLAYER_HEALED_EVENT, PlayerHealedPayload } from './ConsumeItemUseCase';

export const SLEPT_EVENT = 'slept';

export interface SleptPayload
{
    /** Game time that went by while the hero slept. */
    skippedMs: number;
    /** A job in the Workshop or Forge was running and finished during the sleep. */
    craftingFinished: boolean;
}

export type SleepResult =
    | { success: true; skippedMs: number; craftingFinished: boolean }
    | { success: false; reason: 'daytime' };

/** The hero can sleep from dusk until the morning, not by day. */
export function canSleep (worldTime: WorldTime): boolean
{
    const phase = worldTime.phase;
    return phase === 'dusk' || phase === 'night';
}

/**
 * Sleeping at the Bed: the world clock jumps to the morning, a job in the build queue moves on by the time that
 * went by (it counts Game time, so it finishes if the night was long enough), and the hero's hearts and Armor
 * hearts are full. The Garden does not change: its plants grow in real time.
 */
export function sleepUseCase (worldTime: WorldTime, crafting: CraftingQueue, health: Health): SleepResult
{
    if (!canSleep(worldTime)) return { success: false, reason: 'daytime' };

    const wasRunning = crafting.isBusy && !crafting.isReady;
    const skippedMs = worldTime.skipToMorning();
    crafting.tick(skippedMs);
    health.reset();

    DomainEvents.emit<PlayerHealedPayload>(PLAYER_HEALED_EVENT, { currentHealth: health.current, maxHealth: health.max });
    const craftingFinished = wasRunning && crafting.isReady;
    DomainEvents.emit<SleptPayload>(SLEPT_EVENT, { skippedMs, craftingFinished });
    return { success: true, skippedMs, craftingFinished };
}
