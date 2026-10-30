import { useEffect, useRef } from 'react';

export interface ShortcutHandlers
{
    /** M */
    toggleSound: () => void;
    /** B */
    toggleMusic: () => void;
    /** Esc or P */
    escape: () => void;
    /** I */
    toggleBackpack: () => void;
    /** C: the Character window (Hero Level and Stat points) */
    toggleCharacter: () => void;
    /** R: drink the Potion in the Quick slot (Q swaps the sword, which the Phaser scene owns) */
    drinkQuickSlot: () => void;
}

/**
 * Keyboard shortcuts that work anywhere in the app. The listener is added once; it always
 * calls the newest handlers, so they can use current state without being re-registered.
 * Q (swap sword) is not here: the Phaser scene owns it so it only fires while playing.
 */
export function useGlobalShortcuts (handlers: ShortcutHandlers): void
{
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    useEffect(() =>
    {
        const onKeyDown = (e: KeyboardEvent) =>
        {
            const current = handlersRef.current;
            switch (e.key)
            {
                case 'm':
                case 'M':
                    current.toggleSound();
                    break;
                case 'b':
                case 'B':
                    current.toggleMusic();
                    break;
                case 'Escape':
                case 'p':
                case 'P':
                    current.escape();
                    break;
                case 'i':
                case 'I':
                    current.toggleBackpack();
                    break;
                case 'c':
                case 'C':
                    current.toggleCharacter();
                    break;
                case 'r':
                case 'R':
                    current.drinkQuickSlot();
                    break;
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () =>
        {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, []);
}
