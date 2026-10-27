export type PowerUpType = 'heart' | 'star' | 'spring';

export const DEFAULT_STAR_DURATION_MS = 8000;
export const DEFAULT_SPRING_DURATION_MS = 10000;

/**
 * Domain entity representing temporary active player power-up status.
 * Owns duration countdown and business rules — pure non-spatial logic (no Phaser, no DOM).
 * See "Domain layer" in CONTEXT.md.
 */
export class PowerUpState
{
    private _starRemainingMs = 0;
    private _springRemainingMs = 0;

    get isStarActive (): boolean
    {
        return this._starRemainingMs > 0;
    }

    get isSpringActive (): boolean
    {
        return this._springRemainingMs > 0;
    }

    get starRemainingMs (): number
    {
        return this._starRemainingMs;
    }

    get springRemainingMs (): number
    {
        return this._springRemainingMs;
    }

    get starRemainingSeconds (): number
    {
        return Math.ceil(this._starRemainingMs / 1000);
    }

    get springRemainingSeconds (): number
    {
        return Math.ceil(this._springRemainingMs / 1000);
    }

    activateStar (durationMs = DEFAULT_STAR_DURATION_MS): void
    {
        this._starRemainingMs = Math.max(0, durationMs);
    }

    deactivateStar (): void
    {
        this._starRemainingMs = 0;
    }

    activateSpring (durationMs = DEFAULT_SPRING_DURATION_MS): void
    {
        this._springRemainingMs = Math.max(0, durationMs);
    }

    deactivateSpring (): void
    {
        this._springRemainingMs = 0;
    }

    tick (deltaMs: number): { starExpired: boolean; springExpired: boolean }
    {
        let starExpired = false;
        let springExpired = false;

        if (deltaMs <= 0)
        {
            return { starExpired: false, springExpired: false };
        }

        if (this._starRemainingMs > 0)
        {
            this._starRemainingMs = Math.max(0, this._starRemainingMs - deltaMs);
            if (this._starRemainingMs === 0)
            {
                starExpired = true;
            }
        }

        if (this._springRemainingMs > 0)
        {
            this._springRemainingMs = Math.max(0, this._springRemainingMs - deltaMs);
            if (this._springRemainingMs === 0)
            {
                springExpired = true;
            }
        }

        return { starExpired, springExpired };
    }

    reset (): void
    {
        this._starRemainingMs = 0;
        this._springRemainingMs = 0;
    }
}
