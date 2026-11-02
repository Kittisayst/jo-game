/**
 * Full screen for a game opened in a browser tab. An installed app (manifest `display: fullscreen`) is already
 * full screen, and iPhone Safari has no Fullscreen API: there the way is "Add to Home Screen".
 */

function isInstalledApp (): boolean
{
    try
    {
        // The Fullscreen API also makes (display-mode: fullscreen) true, so it only means an installed app while the
        // page has not asked for full screen itself
        return (document.fullscreenElement === null && window.matchMedia('(display-mode: fullscreen)').matches)
            || window.matchMedia('(display-mode: standalone)').matches;
    }
    catch
    {
        return false;
    }
}

/** True when a Full screen button makes sense: the browser has the API and the game is not already an app. */
export function canToggleFullscreen (): boolean
{
    return typeof document.documentElement.requestFullscreen === 'function' && !isInstalledApp();
}

export function isFullscreen (): boolean
{
    return document.fullscreenElement !== null;
}

/** Enters or leaves full screen. Must be called from a click or tap; a refusal is not an error for the game. */
export async function toggleFullscreen (): Promise<void>
{
    try
    {
        if (isFullscreen()) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    }
    catch
    {
        // The browser said no (no user gesture, or blocked by a policy): the game works the same
    }
}
