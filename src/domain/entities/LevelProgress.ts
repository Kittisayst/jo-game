/**
 * Tracks whether the current level has been completed. Holds no coordinates —
 * infrastructure alone knows the finish line's position and decides when to
 * call CompleteLevelUseCase. See "LevelProgress" in CONTEXT.md.
 */
export class LevelProgress
{
    private _isComplete = false;
    private _levelId: string;
    private _nextLevel: string | null;

    constructor (levelId = 'level-1', nextLevel: string | null = null)
    {
        this._levelId = levelId;
        this._nextLevel = nextLevel;
    }

    get levelId (): string
    {
        return this._levelId;
    }

    get nextLevel (): string | null
    {
        return this._nextLevel;
    }

    get isComplete (): boolean
    {
        return this._isComplete;
    }

    complete (): void
    {
        this._isComplete = true;
    }
}
