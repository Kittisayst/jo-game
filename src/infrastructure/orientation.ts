/**
 * The game is landscape. A touch screen held upright gets a full-screen "turn your phone" message and the game
 * pauses; "keep playing upright" hides the message for the rest of the visit (a phone with the rotation locked
 * could not leave it otherwise). Desktop windows (no touch) are never blocked.
 */

export const PORTRAIT_QUERY = '(orientation: portrait) and (pointer: coarse)';
const ALLOW_KEY = 'jo_allow_portrait';
export const ORIENTATION_EVENT = 'jo-orientation-change';

function allowed (): boolean
{
    try
    {
        return window.sessionStorage.getItem(ALLOW_KEY) === '1';
    }
    catch
    {
        return false;
    }
}

let allowedInMemory = false;

/** True while the screen is upright on a touch device and the player has not chosen to play that way. */
export function isPortraitBlocked (): boolean
{
    return window.matchMedia(PORTRAIT_QUERY).matches && !allowedInMemory && !allowed();
}

/** "Keep playing upright": the message is hidden for the rest of the visit. */
export function allowPortrait (): void
{
    allowedInMemory = true;
    try
    {
        window.sessionStorage.setItem(ALLOW_KEY, '1');
    }
    catch
    {
        // storage blocked: the choice still holds until the page is closed
    }
    window.dispatchEvent(new Event(ORIENTATION_EVENT));
}

/** Calls `listener` when the screen turns or the choice changes; returns the unsubscribe function. */
export function onOrientationChange (listener: () => void): () => void
{
    const mq = window.matchMedia(PORTRAIT_QUERY);
    mq.addEventListener('change', listener);
    window.addEventListener(ORIENTATION_EVENT, listener);
    return () =>
    {
        mq.removeEventListener('change', listener);
        window.removeEventListener(ORIENTATION_EVENT, listener);
    };
}
