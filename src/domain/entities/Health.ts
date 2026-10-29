export const DEFAULT_MAX_HEALTH = 3;

/**
 * Domain entity representing the player's hit points (hearts).
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class Health
{
    private _current: number;
    private readonly _max: number;

    constructor (initial = DEFAULT_MAX_HEALTH, max = DEFAULT_MAX_HEALTH)
    {
        this._max = Math.max(1, max);
        this._current = Math.min(this._max, Math.max(0, initial));
    }

    get current (): number
    {
        return this._current;
    }

    get max (): number
    {
        return this._max;
    }

    get isDead (): boolean
    {
        return this._current <= 0;
    }

    takeDamage (): boolean
    {
        if (this.isDead) return true;

        this._current -= 1;
        return this.isDead;
    }

    heal (amount = 1): void
    {
        if (this.isDead || amount <= 0) return;
        this._current = Math.min(this._max, this._current + amount);
    }

    reset (): void
    {
        this._current = this._max;
    }
}
