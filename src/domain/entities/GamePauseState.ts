/**
 * Domain entity representing the game's pause state.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class GamePauseState
{
    private _isPaused: boolean;

    constructor (initialPaused = false)
    {
        this._isPaused = initialPaused;
    }

    get isPaused (): boolean
    {
        return this._isPaused;
    }

    pause (): void
    {
        this._isPaused = true;
    }

    resume (): void
    {
        this._isPaused = false;
    }

    toggle (): boolean
    {
        this._isPaused = !this._isPaused;
        return this._isPaused;
    }
}
