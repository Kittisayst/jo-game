import { describe, expect, it, vi } from 'vitest';
import { createTrailingThrottle, ThrottleClock } from './trailingThrottle';

/** A clock the test advances by hand. */
function fakeClock ()
{
    let time = 1_000;
    let nextId = 1;
    const timers = new Map<number, { at: number; callback: () => void }>();

    const clock: ThrottleClock = {
        now: () => time,
        setTimeout: (callback, delayMs) =>
        {
            const id = nextId++;
            timers.set(id, { at: time + delayMs, callback });
            return id;
        },
        clearTimeout: handle => { timers.delete(handle as number); },
    };

    return {
        clock,
        pendingTimers: () => timers.size,
        advance (ms: number)
        {
            time += ms;
            for (const [id, timer] of [...timers])
            {
                if (timer.at <= time)
                {
                    timers.delete(id);
                    timer.callback();
                }
            }
        },
    };
}

describe('createTrailingThrottle', () =>
{
    it('runs the first request immediately', () =>
    {
        const { clock } = fakeClock();
        const action = vi.fn();

        createTrailingThrottle(action, 3000, clock).trigger();

        expect(action).toHaveBeenCalledTimes(1);
    });

    it('postpones a request that comes too soon instead of dropping it', () =>
    {
        const { clock, advance } = fakeClock();
        const action = vi.fn();
        const throttle = createTrailingThrottle(action, 3000, clock);

        throttle.trigger();
        advance(1000);
        throttle.trigger();

        expect(action).toHaveBeenCalledTimes(1);

        advance(1999);
        expect(action).toHaveBeenCalledTimes(1);
        advance(1);
        expect(action).toHaveBeenCalledTimes(2);
    });

    it('collapses several early requests into one run at the end of the interval', () =>
    {
        const { clock, advance, pendingTimers } = fakeClock();
        const action = vi.fn();
        const throttle = createTrailingThrottle(action, 3000, clock);

        throttle.trigger();
        advance(100);
        throttle.trigger();
        advance(100);
        throttle.trigger();
        throttle.trigger();

        expect(pendingTimers()).toBe(1);
        advance(3000);
        expect(action).toHaveBeenCalledTimes(2);
        expect(pendingTimers()).toBe(0);
    });

    it('runs again straight away once the interval has fully passed', () =>
    {
        const { clock, advance } = fakeClock();
        const action = vi.fn();
        const throttle = createTrailingThrottle(action, 3000, clock);

        throttle.trigger();
        advance(3000);
        throttle.trigger();

        expect(action).toHaveBeenCalledTimes(2);
    });

    it('flush runs a postponed request at once and leaves nothing waiting', () =>
    {
        const { clock, advance, pendingTimers } = fakeClock();
        const action = vi.fn();
        const throttle = createTrailingThrottle(action, 3000, clock);

        throttle.trigger();
        advance(500);
        throttle.trigger();
        throttle.flush();

        expect(action).toHaveBeenCalledTimes(2);
        expect(pendingTimers()).toBe(0);

        advance(5000);
        expect(action).toHaveBeenCalledTimes(2);
    });

    it('flush does nothing when no request is waiting', () =>
    {
        const { clock } = fakeClock();
        const action = vi.fn();
        const throttle = createTrailingThrottle(action, 3000, clock);

        throttle.flush();
        throttle.trigger();
        throttle.flush();

        expect(action).toHaveBeenCalledTimes(1);
    });

    it('cancel drops a postponed request', () =>
    {
        const { clock, advance } = fakeClock();
        const action = vi.fn();
        const throttle = createTrailingThrottle(action, 3000, clock);

        throttle.trigger();
        advance(100);
        throttle.trigger();
        throttle.cancel();
        advance(5000);

        expect(action).toHaveBeenCalledTimes(1);
    });
});
