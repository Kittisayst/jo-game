/**
 * Domain entity representing the player's score.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class Score
{
    private _value: number;

    constructor (initialValue = 0)
    {
        this._value = Math.max(0, initialValue);
    }

    get value (): number
    {
        return this._value;
    }

    add (points: number): void
    {
        if (points <= 0) return;
        this._value += points;
    }

    reset (): void
    {
        this._value = 0;
    }
}
