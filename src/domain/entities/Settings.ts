/**
 * Domain entity representing user configuration and audio preferences.
 * Pure non-spatial state and business rules — see "Domain layer" in CONTEXT.md.
 */
export class Settings
{
    private _isSoundMuted: boolean;
    private _isMusicMuted: boolean;

    constructor (initialSoundMuted = false, initialMusicMuted = false)
    {
        this._isSoundMuted = initialSoundMuted;
        this._isMusicMuted = initialMusicMuted;
    }

    get isSoundMuted (): boolean
    {
        return this._isSoundMuted;
    }

    get isMusicMuted (): boolean
    {
        return this._isMusicMuted;
    }

    toggleSound (): boolean
    {
        this._isSoundMuted = !this._isSoundMuted;
        return this._isSoundMuted;
    }

    toggleMusic (): boolean
    {
        this._isMusicMuted = !this._isMusicMuted;
        return this._isMusicMuted;
    }

    setSoundMuted (muted: boolean): void
    {
        this._isSoundMuted = muted;
    }

    setMusicMuted (muted: boolean): void
    {
        this._isMusicMuted = muted;
    }

    reset (): void
    {
        this._isSoundMuted = false;
        this._isMusicMuted = false;
    }
}
