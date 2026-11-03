import { useEffect, useRef } from 'react';
import { isPortraitBlocked, onOrientationChange } from '../../orientation';

interface OrientationPauseState
{
    /** The game is on screen (not the title menu). */
    playing: boolean;
    paused: boolean;
}

/**
 * Pauses the game while the phone is held upright and resumes it when it is turned back, but only if this hook
 * paused it: a game the player paused by hand stays paused.
 */
export function useOrientationPause (state: OrientationPauseState, pause: () => void, resume: () => void): void
{
    const latest = useRef({ state, pause, resume });
    latest.current = { state, pause, resume };
    const pausedByTurn = useRef(false);

    const apply = () =>
    {
        const { state: s, pause: doPause, resume: doResume } = latest.current;
        const blocked = isPortraitBlocked();
        if (blocked && s.playing && !s.paused && !pausedByTurn.current)
        {
            pausedByTurn.current = true;
            doPause();
        }
        else if (!blocked && pausedByTurn.current)
        {
            pausedByTurn.current = false;
            doResume();
        }
    };

    useEffect(() => onOrientationChange(apply), []);
    // Also when the game starts or stops being on screen (a game started upright)
    useEffect(apply, [state.playing]);
}
