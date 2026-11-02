/**
 * The browser's "install this app" offer (Chrome and Edge on Android and desktop). The browser fires
 * `beforeinstallprompt` once the game can be installed; we keep the event and show our own Install button
 * instead of the browser's small bar, so the player sees it on the title screen. Safari has no such event: there
 * the way is Share → Add to Home Screen.
 */

interface BeforeInstallPromptEvent extends Event
{
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let listening = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach(listener => listener());

/** Call once, as early as possible: the browser may offer the install before the page has finished loading. */
export function startListeningForInstall (): void
{
    if (listening || typeof window === 'undefined') return;
    listening = true;
    window.addEventListener('beforeinstallprompt', event =>
    {
        event.preventDefault();
        deferred = event as BeforeInstallPromptEvent;
        notify();
    });
    window.addEventListener('appinstalled', () =>
    {
        deferred = null;
        notify();
    });
}

/** True when the browser has offered to install the game and it is not installed yet. */
export function canInstall (): boolean
{
    return deferred !== null;
}

/** Shows the browser's install dialog. Must be called from a click or tap; the offer can be used only once. */
export async function promptInstall (): Promise<'accepted' | 'dismissed' | 'unavailable'>
{
    const event = deferred;
    if (!event) return 'unavailable';
    deferred = null;
    notify();
    try
    {
        await event.prompt();
        return (await event.userChoice).outcome;
    }
    catch
    {
        return 'unavailable';
    }
}

/** Calls `listener` whenever the offer appears or goes away; returns the unsubscribe function. */
export function onInstallChange (listener: () => void): () => void
{
    listeners.add(listener);
    return () => { listeners.delete(listener); };
}
