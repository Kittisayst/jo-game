export type BossPhase = 1 | 2 | 3;

/**
 * Domain entity representing the King Slime Boss.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class Boss
{
    private _currentHp: number;
    private readonly _maxHp: number;
    private _isDefeated = false;
    private readonly _points: number;

    constructor (maxHp = 5, points = 1000)
    {
        this._maxHp = Math.max(1, maxHp);
        this._currentHp = this._maxHp;
        this._points = Math.max(0, points);
    }

    get currentHp (): number
    {
        return this._currentHp;
    }

    get maxHp (): number
    {
        return this._maxHp;
    }

    get isDefeated (): boolean
    {
        return this._isDefeated;
    }

    get points (): number
    {
        return this._points;
    }

    /**
     * Determines current combat phase based on the remaining HP ratio, so any max HP works:
     * - Phase 1: above 60% - Regal & methodical attacks
     * - Phase 2: above 20% up to 60% - Enraged dash charges
     * - Phase 3: 20% or less - Berserk frenzy & frantic double slams
     */
    get phase (): BossPhase
    {
        const ratio = this._currentHp / this._maxHp;
        if (ratio > 0.6)
        {
            return 1;
        }
        if (ratio > 0.2)
        {
            return 2;
        }
        return 3;
    }

    get isEnraged (): boolean
    {
        return this._currentHp / this._maxHp <= 0.6;
    }

    get isBerserk (): boolean
    {
        return this._currentHp > 0 && this._currentHp / this._maxHp <= 0.2;
    }

    takeDamage (amount = 1): { defeated: boolean; currentHp: number }
    {
        if (this._isDefeated)
        {
            return { defeated: true, currentHp: 0 };
        }

        const validAmount = Math.max(0, amount);
        this._currentHp = Math.max(0, this._currentHp - validAmount);

        if (this._currentHp === 0)
        {
            this._isDefeated = true;
        }

        return {
            defeated: this._isDefeated,
            currentHp: this._currentHp,
        };
    }

    heal (amount: number): number
    {
        const valid = Math.max(0, Math.floor(amount));
        this._currentHp = Math.min(this._maxHp, this._currentHp + valid);
        if (this._currentHp > 0)
        {
            this._isDefeated = false;
        }
        return this._currentHp;
    }

    reset (): void
    {
        this._currentHp = this._maxHp;
        this._isDefeated = false;
    }
}
