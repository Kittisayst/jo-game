/** The clock and timer the throttle uses; injectable so it can be tested without waiting. */
export interface ThrottleClock
{
    now(): number;
    setTimeout(callback: () => void, delayMs: number): unknown;
    clearTimeout(handle: unknown): void;
}

const systemClock: ThrottleClock = {
    now: () => Date.now(),
    setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
    clearTimeout: handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface TrailingThrottle
{
    /** Asks for the action to run: now if the interval has passed, otherwise once it has. */
    trigger(): void;
    /** Runs a postponed action immediately (e.g. because the page is closing). No-op if none is waiting. */
    flush(): void;
    /** Drops a postponed action. */
    cancel(): void;
}

/**
 * Runs `action` at most once per `intervalMs`, but never loses a request: a call that arrives
 * too soon is postponed to the end of the interval instead of being dropped. The action reads
 * the latest state when it finally runs, so the last change is always the one that is kept.
 */
export function createTrailingThrottle (
    action: () => void,
    intervalMs: number,
    clock: ThrottleClock = systemClock
): TrailingThrottle
{
    let lastRunAt = Number.NEGATIVE_INFINITY;
    let pending: unknown = null;
    let hasPending = false;

    const run = () =>
    {
        hasPending = false;
        pending = null;
        lastRunAt = clock.now();
        action();
    };

    return {
        trigger ()
        {
            if (hasPending) return;

            const wait = lastRunAt + intervalMs - clock.now();
            if (wait <= 0)
            {
                run();
                return;
            }

            hasPending = true;
            pending = clock.setTimeout(run, wait);
        },

        flush ()
        {
            if (!hasPending) return;
            clock.clearTimeout(pending);
            run();
        },

        cancel ()
        {
            if (!hasPending) return;
            clock.clearTimeout(pending);
            hasPending = false;
            pending = null;
        },
    };
}
