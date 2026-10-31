/**
 * True on a phone or tablet (a touch screen, or a window no wider than a tablet): the on-screen buttons show and the
 * game view is made bigger and raised so the hero is not under them. One answer for both, so they cannot disagree.
 */
export function isTouchLayout (): boolean
{
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
}

/** How much bigger the hero and the world are drawn on a touch screen (1 = the desktop size). */
export const TOUCH_ZOOM = 1.3;

/** World pixels of soil shown below the ground on a touch screen: it lifts the hero above the on-screen buttons. */
export const TOUCH_GROUND_PAD = 230;
