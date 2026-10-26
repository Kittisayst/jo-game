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

    reset (): void
    {
        this._currentHp = this._maxHp;
        this._isDefeated = false;
    }
}
