import { describe, it, expect } from 'vitest';
import { GamePauseState } from './GamePauseState';

describe('GamePauseState Entity', () =>
{
    it('defaults to not paused when no argument is given', () =>
    {
        const pauseState = new GamePauseState();
        expect(pauseState.isPaused).toBe(false);
    });

    it('can be initialized as paused', () =>
    {
        const pauseState = new GamePauseState(true);
        expect(pauseState.isPaused).toBe(true);
    });

    it('pauses when pause() is called', () =>
    {
        const pauseState = new GamePauseState(false);
        pauseState.pause();
        expect(pauseState.isPaused).toBe(true);
    });

    it('resumes when resume() is called', () =>
    {
        const pauseState = new GamePauseState(true);
        pauseState.resume();
        expect(pauseState.isPaused).toBe(false);
    });

    it('toggles pause state correctly', () =>
    {
        const pauseState = new GamePauseState(false);
        expect(pauseState.toggle()).toBe(true);
        expect(pauseState.isPaused).toBe(true);

        expect(pauseState.toggle()).toBe(false);
        expect(pauseState.isPaused).toBe(false);
    });
});
