import type { Clock, Random } from '../domain/ports';

/**
 * The real time, with an offset a development build can move forward (`window.__advanceClock(ms)`) so a test can
 * wait for a plant to grow without waiting. The offset is never saved: after a reload it is the real time again.
 */
export class SystemClock implements Clock
{
    private offsetMs = 0;

    now (): number
    {
        return Date.now() + this.offsetMs;
    }

    advance (ms: number): void
    {
        this.offsetMs += ms;
    }
}

export class MathRandom implements Random
{
    next (): number
    {
        return Math.random();
    }
}
