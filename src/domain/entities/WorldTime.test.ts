import { describe, expect, it } from 'vitest';
import { WorldTime, type WorldTimeTuning } from './WorldTime';

// A 20 minute day: dawn 0:00-1:00, day 1:00-13:00, dusk 13:00-14:00, night 14:00-20:00
const tuning: WorldTimeTuning = {
    dayLengthMinutes: 20,
    nightStartsAt: 0.7,
    duskMinutes: 1,
    dawnMinutes: 1,
    startAt: 0.1,
    maxDarkness: 0.5,
};
const MIN = 60_000;

function clockAt (minutes: number): WorldTime
{
    const time = new WorldTime();
    time.configure(tuning);
    time.loadFrom({ dayFraction: minutes / 20 });
    return time;
}

describe('WorldTime', () =>
{
    it('starts a new game in the morning of the first day', () =>
    {
        const time = new WorldTime();
        time.configure(tuning);
        expect(time.phase).toBe('day');
        expect(time.darkness).toBe(0);
        expect(time.dayFraction).toBeCloseTo(0.1);
    });

    it('goes through dawn, day, dusk and night in order', () =>
    {
        expect(clockAt(0.5).phase).toBe('dawn');
        expect(clockAt(1).phase).toBe('day');
        expect(clockAt(12.9).phase).toBe('day');
        expect(clockAt(13).phase).toBe('dusk');
        expect(clockAt(14).phase).toBe('night');
        expect(clockAt(19.9).phase).toBe('night');
        expect(clockAt(0).phase).toBe('dawn');
    });

    it('is only night in the night phase', () =>
    {
        expect(clockAt(13.5).isNight).toBe(false);
        expect(clockAt(14).isNight).toBe(true);
        expect(clockAt(0.5).isNight).toBe(false);
    });

    it('darkens smoothly at dusk, stays dark at night and lightens at dawn, never past the maximum', () =>
    {
        expect(clockAt(5).darkness).toBe(0);
        expect(clockAt(13).darkness).toBeCloseTo(0);
        expect(clockAt(13.5).darkness).toBeCloseTo(0.25);
        expect(clockAt(14).darkness).toBeCloseTo(0.5);
        expect(clockAt(19.99).darkness).toBeCloseTo(0.5);
        expect(clockAt(0).darkness).toBeCloseTo(0.5);
        expect(clockAt(0.5).darkness).toBeCloseTo(0.25);
        expect(clockAt(1).darkness).toBeCloseTo(0);
    });

    it('counts down to the next phase', () =>
    {
        expect(clockAt(5).msUntilNextPhase).toBe(8 * MIN);
        expect(clockAt(13.5).msUntilNextPhase).toBe(0.5 * MIN);
        expect(clockAt(15).msUntilNextPhase).toBe(6 * MIN);
        expect(clockAt(0.25).msUntilNextPhase).toBe(0.75 * MIN);
    });

    it('moves on with Game time and goes round the day', () =>
    {
        const time = clockAt(19);
        time.tick(1.5 * MIN);
        expect(time.dayFraction).toBeCloseTo(0.025);
        expect(time.phase).toBe('dawn');
        time.tick(0);
        time.tick(-5);
        expect(time.dayFraction).toBeCloseTo(0.025);
    });

    it('sleeps through to the morning, which is the end of dawn', () =>
    {
        const time = clockAt(15);
        expect(time.msUntilMorning).toBe(6 * MIN);
        expect(time.skipToMorning()).toBe(6 * MIN);
        expect(time.phase).toBe('day');
        expect(time.dayFraction).toBeCloseTo(0.05);

        const early = clockAt(0.5);
        expect(early.skipToMorning()).toBe(0.5 * MIN);
    });

    it('saves and loads where in the day it is; nonsense starts the day over', () =>
    {
        const time = clockAt(15);
        expect(time.toSnapshot()).toEqual({ dayFraction: 0.75, dayCount: 0 });

        const other = new WorldTime();
        other.configure(tuning);
        other.loadFrom({ dayFraction: 0.75 });
        expect(other.phase).toBe('night');
        other.loadFrom({ dayFraction: 1.5 });
        expect(other.dayFraction).toBeCloseTo(0.1);
        other.loadFrom(undefined);
        expect(other.dayFraction).toBeCloseTo(0.1);
    });

    it('needs its numbers before it is used', () =>
    {
        expect(() => new WorldTime().phase).toThrow(/configure/);
    });
});

describe('WorldTime day count', () =>
{
    it('counts the days that pass, also several at once, and keeps the count in a save', () =>
    {
        const time = clockAt(19);
        expect(time.dayCount).toBe(0);
        time.tick(2 * MIN);
        expect(time.dayCount).toBe(1);
        time.tick(45 * MIN);
        expect(time.dayCount).toBe(3);

        const other = new WorldTime();
        other.configure(tuning);
        other.loadFrom(time.toSnapshot());
        expect(other.dayCount).toBe(3);
        other.loadFrom({ dayFraction: 0.5, dayCount: -2 });
        expect(other.dayCount).toBe(0);
        other.reset();
        expect(other.dayCount).toBe(0);
    });

    it('sleeping to the morning starts a new day', () =>
    {
        const time = clockAt(15);
        const before = time.dayCount;
        time.skipToMorning();
        expect(time.dayCount).toBe(before + 1);
    });
});
