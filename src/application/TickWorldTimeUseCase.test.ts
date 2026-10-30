import { afterEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { WorldTime, type WorldTimeTuning } from '../domain/entities/WorldTime';
import { tickWorldTimeUseCase, WORLD_PHASE_CHANGED_EVENT, type WorldPhaseChangedPayload } from './TickWorldTimeUseCase';

const tuning: WorldTimeTuning = { dayLengthMinutes: 20, nightStartsAt: 0.7, duskMinutes: 1, dawnMinutes: 1, startAt: 0.1, maxDarkness: 0.5 };

describe('tickWorldTimeUseCase', () =>
{
    const changes: WorldPhaseChangedPayload[] = [];
    const onChange = (p: WorldPhaseChangedPayload) => changes.push(p);

    afterEach(() => DomainEvents.off(WORLD_PHASE_CHANGED_EVENT, onChange));

    it('says when the phase changes, and only then', () =>
    {
        changes.length = 0;
        DomainEvents.on(WORLD_PHASE_CHANGED_EVENT, onChange);
        const time = new WorldTime();
        time.configure(tuning);
        time.loadFrom({ dayFraction: 12.5 / 20 });

        tickWorldTimeUseCase(time, 10_000);
        expect(changes).toEqual([]);
        tickWorldTimeUseCase(time, 30_000);
        expect(changes).toEqual([{ from: 'day', phase: 'dusk' }]);
        tickWorldTimeUseCase(time, 60_000);
        expect(changes[1]).toEqual({ from: 'dusk', phase: 'night' });
    });
});
