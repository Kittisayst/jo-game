/**
 * The time of day in the world: one day is a few minutes of Game time (it only moves while the game runs, like
 * the build queue), split into day, dusk, night and dawn. Night is when special monsters walk the Stages and the
 * hero can sleep at the Bed. Pure rules, no x/y; the numbers come from `world-time.json`
 * (see "World time" in CONTEXT.md).
 */

export type DayPhase = 'day' | 'dusk' | 'night' | 'dawn';

export interface WorldTimeTuning
{
    /** Minutes of Game time in one day. */
    dayLengthMinutes: number;
    /** Where in the day (0 to 1) night begins; it lasts until the day ends. */
    nightStartsAt: number;
    /** Minutes of dusk before night begins and of dawn after the day starts again. */
    duskMinutes: number;
    dawnMinutes: number;
    /** Where in the day a new game starts (0 = the first moment of dawn). */
    startAt: number;
    /** How dark the world gets at night (0 to 1, the strength of the dark layer). */
    maxDarkness: number;
}

export interface WorldTimeSnapshot
{
    /** Where in the day it is, 0 up to (not including) 1. */
    dayFraction: number;
    /** Days that have passed since the game began (a night belongs to the day it starts in). */
    dayCount?: number;
}

export class WorldTime
{
    private _fraction: number | null = null;
    private _days = 0;
    private _tuning: WorldTimeTuning | null = null;

    /**
     * Gives the clock its numbers once the content has loaded. A clock that has no time yet (a new game, or a
     * save that has none) starts the day at `startAt`.
     */
    configure (tuning: WorldTimeTuning): void
    {
        this._tuning = tuning;
        if (this._fraction === null) this._fraction = tuning.startAt;
    }

    /** A new game: back to the start of the first day. */
    reset (): void
    {
        this._fraction = this._tuning ? this._tuning.startAt : null;
        this._days = 0;
    }

    /** Days that have passed since the game began. A night is told from the next by this number. */
    get dayCount (): number
    {
        return this._days;
    }

    private get tuning (): WorldTimeTuning
    {
        if (!this._tuning) throw new Error('WorldTime used before configure(tuning)');
        return this._tuning;
    }

    private get dayMs (): number
    {
        return this.tuning.dayLengthMinutes * 60_000;
    }

    /** Where in the day it is, 0 to 1. */
    get dayFraction (): number
    {
        return this._fraction ?? this.tuning.startAt;
    }

    get phase (): DayPhase
    {
        const t = this.tuning;
        const dusk = t.duskMinutes / t.dayLengthMinutes;
        const dawn = t.dawnMinutes / t.dayLengthMinutes;
        const f = this.dayFraction;
        if (f >= t.nightStartsAt) return 'night';
        if (f >= t.nightStartsAt - dusk) return 'dusk';
        if (f < dawn) return 'dawn';
        return 'day';
    }

    /** True from the moment night falls until the day starts again (dusk and dawn are not night). */
    get isNight (): boolean
    {
        return this.phase === 'night';
    }

    /** How dark it is, 0 (day) to `maxDarkness` (night); dusk and dawn move smoothly between the two. */
    get darkness (): number
    {
        const t = this.tuning;
        const dusk = t.duskMinutes / t.dayLengthMinutes;
        const dawn = t.dawnMinutes / t.dayLengthMinutes;
        const f = this.dayFraction;
        let amount: number;
        if (f >= t.nightStartsAt) amount = 1;
        else if (f >= t.nightStartsAt - dusk) amount = (f - (t.nightStartsAt - dusk)) / dusk;
        else if (f < dawn) amount = 1 - f / dawn;
        else amount = 0;
        return amount * t.maxDarkness;
    }

    /** Game time left until the current phase ends. */
    get msUntilNextPhase (): number
    {
        const t = this.tuning;
        const dusk = t.duskMinutes / t.dayLengthMinutes;
        const dawn = t.dawnMinutes / t.dayLengthMinutes;
        const f = this.dayFraction;
        const nextAt = f >= t.nightStartsAt ? 1 + dawn
            : f >= t.nightStartsAt - dusk ? t.nightStartsAt
            : f < dawn ? dawn
            : t.nightStartsAt - dusk;
        return Math.max(0, Math.round((nextAt - f) * this.dayMs));
    }

    /** Game time until the morning (the end of dawn), for the Bed. */
    get msUntilMorning (): number
    {
        const dawn = this.tuning.dawnMinutes / this.tuning.dayLengthMinutes;
        const f = this.dayFraction;
        const morning = f < dawn ? dawn : 1 + dawn;
        return Math.max(0, Math.round((morning - f) * this.dayMs));
    }

    /** Moves the clock on by `deltaMs` of Game time, round the day. */
    tick (deltaMs: number): void
    {
        if (!(deltaMs > 0)) return;
        const raw = this.dayFraction + deltaMs / this.dayMs;
        this._days += Math.floor(raw);
        this._fraction = raw % 1;
    }

    /** Sleeps through to the morning. Returns the Game time that went by. */
    skipToMorning (): number
    {
        const skipped = this.msUntilMorning;
        this.tick(skipped);
        return skipped;
    }

    toSnapshot (): WorldTimeSnapshot
    {
        return { dayFraction: this._fraction ?? 0, dayCount: this._days };
    }

    /** Loads a save; a value out of 0 up to 1 leaves the clock to start the day at `startAt`. */
    loadFrom (snapshot: Partial<WorldTimeSnapshot> | undefined): void
    {
        const value = snapshot?.dayFraction;
        const valid = typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1;
        this._fraction = valid ? value : (this._tuning ? this._tuning.startAt : null);
        const days = snapshot?.dayCount;
        this._days = valid && typeof days === 'number' && Number.isInteger(days) && days >= 0 && days < 1_000_000 ? days : 0;
    }
}
