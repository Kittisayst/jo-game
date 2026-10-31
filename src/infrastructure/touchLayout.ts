/**
 * True on a phone or tablet (a touch screen, or a window no wider than a tablet): the on-screen buttons show and the
 * game view is made bigger and raised so the hero is not under them (a desktop only gets the raise). One answer for both, so they cannot disagree.
 */
export function isTouchLayout (): boolean
{
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 1024;
}

/** How much bigger the hero and the world are drawn on a touch screen (1 = the desktop size). */
export const TOUCH_ZOOM = 1.3;

/** World pixels of soil shown below the ground on a touch screen: it lifts the hero above the on-screen buttons. */
export const TOUCH_GROUND_PAD = 130;

/** The same on a desktop: no zoom, and a lower pad (there are no buttons), so the ground is not the last strip of the window. */
export const DESKTOP_GROUND_PAD = 60;

/** The camera zoom for this device. */
export function viewZoom (): number
{
    return isTouchLayout() ? TOUCH_ZOOM : 1;
}

/** World pixels of soil shown below the ground for this device (the camera can then lift the hero off the bottom edge). */
export function groundPad (): number
{
    return isTouchLayout() ? TOUCH_GROUND_PAD : DESKTOP_GROUND_PAD;
}
