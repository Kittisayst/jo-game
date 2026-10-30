export const DEFAULT_MAX_HEALTH = 3;
/** Armor hearts a Potion can add on top of what the worn Armor gives. */
const EXTRA_ARMOR_LIMIT = 3;

/**
 * Domain entity representing the player's hit points (hearts).
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class Health
{
    private _current: number;
    private _max: number;
    /** Armor hearts left: they are lost before Health and come back when the hero is home. */
    private _armor = 0;
    private _maxArmor = 0;

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

    get armor (): number
    {
        return this._armor;
    }

    get maxArmor (): number
    {
        return this._maxArmor;
    }

    /** One hit: an Armor heart takes it when there is one, otherwise a heart of Health. Returns true when dead. */
    takeDamage (): boolean
    {
        if (this.isDead) return true;

        if (this._armor > 0)
        {
            this._armor -= 1;
            return false;
        }

        this._current -= 1;
        return this.isDead;
    }

    /**
     * The worn Armor now gives `max` hearts. Putting a piece on gives its hearts at once; taking one off or
     * breaking one takes the same hearts away.
     */
    syncMaxArmor (max: number): void
    {
        const next = Math.max(0, Math.floor(max));
        // The hearts a piece gives are gained or lost together with it
        this._armor = Math.max(0, this._armor + (next - this._maxArmor));
        this._maxArmor = next;
        this._armor = Math.min(this._armor, next + EXTRA_ARMOR_LIMIT);
    }

    /** An armor Potion: extra Armor hearts that last until the hero is home (they may go above the worn Armor). */
    addBonusArmor (amount = 1): void
    {
        if (this.isDead || amount <= 0) return;
        this._armor = Math.min(this._maxArmor + EXTRA_ARMOR_LIMIT, this._armor + amount);
    }

    /**
     * The hero now has `max` hearts (the three it starts with plus the Hearts Stat). Hearts gained are full;
     * when the maximum falls (the points were taken back) the hearts above it go.
     */
    syncMaxHealth (max: number): void
    {
        const next = Math.max(1, Math.floor(max));
        if (this.isDead)
        {
            this._max = next;
            return;
        }
        this._current = Math.max(1, Math.min(next, this._current + (next - this._max)));
        this._max = next;
    }

    heal (amount = 1): void
    {
        if (this.isDead || amount <= 0) return;
        this._current = Math.min(this._max, this._current + amount);
    }

    reset (): void
    {
        this._current = this._max;
        this._armor = this._maxArmor;
    }
}
