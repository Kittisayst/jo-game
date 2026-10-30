import { afterEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { CraftingQueue } from '../domain/entities/CraftingQueue';
import { Health } from '../domain/entities/Health';
import { WorldTime, type WorldTimeTuning } from '../domain/entities/WorldTime';
import { canSleep, sleepUseCase, SLEPT_EVENT, type SleptPayload } from './SleepUseCase';

// A 20 minute day: dawn 0:00-1:00, day 1:00-13:00, dusk 13:00-14:00, night 14:00-20:00
const tuning: WorldTimeTuning = { dayLengthMinutes: 20, nightStartsAt: 0.7, duskMinutes: 1, dawnMinutes: 1, startAt: 0.1, maxDarkness: 0.5 };
const MIN = 60_000;

function clockAt (minutes: number): WorldTime
{
    const time = new WorldTime();
    time.configure(tuning);
    time.loadFrom({ dayFraction: minutes / 20 });
    return time;
}

describe('sleepUseCase', () =>
{
    const events: SleptPayload[] = [];
    const onSlept = (p: SleptPayload) => events.push(p);
    afterEach(() => DomainEvents.off(SLEPT_EVENT, onSlept));

    it('can be done from dusk to the morning, not by day or at dawn', () =>
    {
        expect(canSleep(clockAt(5))).toBe(false);
        expect(canSleep(clockAt(0.5))).toBe(false);
        expect(canSleep(clockAt(13.5))).toBe(true);
        expect(canSleep(clockAt(16))).toBe(true);
    });

    it('refuses by day and changes nothing', () =>
    {
        const time = clockAt(5);
        const crafting = new CraftingQueue();
        crafting.start('r', 'iron-sword', 1, 120_000);
        const health = new Health();
        health.takeDamage();

        expect(sleepUseCase(time, crafting, health)).toEqual({ success: false, reason: 'daytime' });
        expect(time.dayFraction).toBeCloseTo(0.25);
        expect(crafting.job?.remainingMs).toBe(120_000);
        expect(health.current).toBe(2);
    });

    it('jumps to the morning and fills the hearts', () =>
    {
        events.length = 0;
        DomainEvents.on(SLEPT_EVENT, onSlept);
        const time = clockAt(16);
        const health = new Health();
        health.takeDamage();
        health.takeDamage();

        const result = sleepUseCase(time, new CraftingQueue(), health);
        expect(result).toEqual({ success: true, skippedMs: 5 * MIN, craftingFinished: false });
        expect(time.phase).toBe('day');
        expect(time.dayFraction).toBeCloseTo(0.05);
        expect(health.current).toBe(3);
        expect(events).toEqual([{ skippedMs: 5 * MIN, craftingFinished: false }]);
    });

    it('moves a build job on by the time that went by, and finishes it when the night was long enough', () =>
    {
        const crafting = new CraftingQueue();
        crafting.start('r', 'iron-sword', 1, 4 * MIN);
        const result = sleepUseCase(clockAt(14), crafting, new Health());
        expect(result).toEqual({ success: true, skippedMs: 7 * MIN, craftingFinished: true });
        expect(crafting.isReady).toBe(true);
    });

    it('leaves a long job running with less time left', () =>
    {
        const crafting = new CraftingQueue();
        crafting.start('r', 'iron-sword', 1, 10 * MIN);
        const result = sleepUseCase(clockAt(14), crafting, new Health());
        expect(result).toMatchObject({ success: true, craftingFinished: false });
        expect(crafting.job?.remainingMs).toBe(3 * MIN);
    });

    it('does not report a finished job when there was none or it was already finished', () =>
    {
        const ready = new CraftingQueue();
        ready.start('r', 'iron-sword', 1, 1000);
        ready.tick(2000);
        expect(sleepUseCase(clockAt(15), ready, new Health())).toMatchObject({ craftingFinished: false });
        expect(sleepUseCase(clockAt(15), new CraftingQueue(), new Health())).toMatchObject({ craftingFinished: false });
    });
});
