/**
 * Tracks whether the current level has been completed. Holds no coordinates —
 * infrastructure alone knows the finish line's position and decides when to
 * call CompleteLevelUseCase. See "LevelProgress" in CONTEXT.md.
 */
export class LevelProgress
{
    private _isComplete = false;

    get isComplete ()
    {
        return this._isComplete;
    }

    complete ()
    {
        this._isComplete = true;
    }
}
