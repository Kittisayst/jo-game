/**
 * Domain entity representing persistent game stats (High Score & Speedrun Best Time).
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class GameStats
{
    private _highScore: number;
    private _bestTimeSeconds: number | null;

    constructor (initialHighScore = 0, initialBestTimeSeconds: number | null = null)
    {
        this._highScore = Math.max(0, initialHighScore);
        this._bestTimeSeconds =
            initialBestTimeSeconds !== null ? Math.max(0, initialBestTimeSeconds) : null;
    }

    get highScore (): number
    {
        return this._highScore;
    }

    get bestTimeSeconds (): number | null
    {
        return this._bestTimeSeconds;
    }

    recordScore (score: number): { isNewHighScore: boolean; highScore: number }
    {
        const validScore = Math.max(0, score);
        if (validScore > this._highScore)
        {
            this._highScore = validScore;
            return { isNewHighScore: true, highScore: this._highScore };
        }
        return { isNewHighScore: false, highScore: this._highScore };
    }

    recordTime (timeSeconds: number): { isNewBestTime: boolean; bestTime: number }
    {
        const validTime = Math.max(0, timeSeconds);
        if (this._bestTimeSeconds === null || validTime < this._bestTimeSeconds)
        {
            this._bestTimeSeconds = validTime;
            return { isNewBestTime: true, bestTime: validTime };
        }
        return { isNewBestTime: false, bestTime: this._bestTimeSeconds };
    }

    reset (): void
    {
        this._highScore = 0;
        this._bestTimeSeconds = null;
    }
}
