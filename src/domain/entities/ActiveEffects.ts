/**
 * Timed Potion effects that are running on the hero (strength and speed). They count down with the game's
 * frame time, like the attack cooldown, and are not saved: a minute-long effect is not worth keeping across a
 * reload. Pure rules, see "Potion" in CONTEXT.md.
 */

export type TimedEffect = 'strength' | 'speed';

/** A strength Potion adds this share to the damage of every attack. */
export const STRENGTH_DAMAGE_MULTIPLIER = 1.5;
/** A speed Potion multiplies the walking speed by this. */
export const SPEED_POTION_MULTIPLIER = 1.3;

export interface ActiveEffect
{
    effect: TimedEffect;
    remainingSeconds: number;
}

export class ActiveEffects
{
    private _remainingMs = new Map<TimedEffect, number>();

    /** Starts the effect, or restarts it at the full time when it is already running (drinking again does not stack). */
    apply (effect: TimedEffect, durationSeconds: number): void
    {
        if (durationSeconds <= 0) return;
        this._remainingMs.set(effect, Math.round(durationSeconds * 1000));
    }

    /** Lets `deltaMs` of game time pass; effects that run out are removed. */
    tick (deltaMs: number): void
    {
        if (deltaMs <= 0) return;
        for (const [effect, remaining] of this._remainingMs)
        {
            const left = remaining - deltaMs;
            if (left <= 0) this._remainingMs.delete(effect);
            else this._remainingMs.set(effect, left);
        }
    }

    has (effect: TimedEffect): boolean
    {
        return this._remainingMs.has(effect);
    }

    get hasAny (): boolean
    {
        return this._remainingMs.size > 0;
    }

    /** What is running, with the whole seconds left (rounded up so it never shows 0 while still running). */
    get active (): ActiveEffect[]
    {
        return Array.from(this._remainingMs, ([effect, ms]) => ({ effect, remainingSeconds: Math.ceil(ms / 1000) }));
    }

    get damageMultiplier (): number
    {
        return this.has('strength') ? STRENGTH_DAMAGE_MULTIPLIER : 1;
    }

    get speedMultiplier (): number
    {
        return this.has('speed') ? SPEED_POTION_MULTIPLIER : 1;
    }

    clear (): void
    {
        this._remainingMs.clear();
    }
}
