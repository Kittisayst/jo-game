import { DomainEvents } from '../domain/DomainEvents';
import { DayPhase, WorldTime } from '../domain/entities/WorldTime';

export const WORLD_PHASE_CHANGED_EVENT = 'world-phase-changed';

export interface WorldPhaseChangedPayload
{
    from: DayPhase;
    phase: DayPhase;
}

/** Moves the world clock on by `deltaMs` of Game time and says when the day turns to dusk, night, dawn or day. */
export function tickWorldTimeUseCase (worldTime: WorldTime, deltaMs: number): void
{
    const from = worldTime.phase;
    worldTime.tick(deltaMs);
    const phase = worldTime.phase;
    if (phase !== from) DomainEvents.emit<WorldPhaseChangedPayload>(WORLD_PHASE_CHANGED_EVENT, { from, phase });
}
