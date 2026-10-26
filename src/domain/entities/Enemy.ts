/**
 * Domain entity representing an Enemy.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class Enemy
{
    private _isDefeated = false;
    private readonly _points: number;

    constructor (points = 100)
    {
        this._points = Math.max(0, points);
    }

    get points (): number
    {
        return this._points;
    }

    get isDefeated (): boolean
    {
        return this._isDefeated;
    }

    defeat (): void
    {
        this._isDefeated = true;
    }
}
