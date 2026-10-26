export type PowerUpType = 'heart' | 'star' | 'spring';

/**
 * Domain entity representing temporary active player power-up status.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class PowerUpState
{
    private _starActive = false;
    private _springActive = false;

    get isStarActive (): boolean
    {
        return this._starActive;
    }

    get isSpringActive (): boolean
    {
        return this._springActive;
    }

    activateStar (): void
    {
        this._starActive = true;
    }

    deactivateStar (): void
    {
        this._starActive = false;
    }

    activateSpring (): void
    {
        this._springActive = true;
    }

    deactivateSpring (): void
    {
        this._springActive = false;
    }

    reset (): void
    {
        this._starActive = false;
        this._springActive = false;
    }
}
