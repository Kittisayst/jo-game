import { describe, expect, it } from 'vitest';
import { PowerUpState } from './PowerUp';

describe('PowerUpState entity', () =>
{
    it('initializes with no active power-ups', () =>
    {
        const state = new PowerUpState();
        expect(state.isStarActive).toBe(false);
        expect(state.isSpringActive).toBe(false);
    });

    it('activates and deactivates star power-up', () =>
    {
        const state = new PowerUpState();
        state.activateStar();
        expect(state.isStarActive).toBe(true);

        state.deactivateStar();
        expect(state.isStarActive).toBe(false);
    });

    it('activates and deactivates spring power-up', () =>
    {
        const state = new PowerUpState();
        state.activateSpring();
        expect(state.isSpringActive).toBe(true);

        state.deactivateSpring();
        expect(state.isSpringActive).toBe(false);
    });

    it('resets all active power-ups', () =>
    {
        const state = new PowerUpState();
        state.activateStar();
        state.activateSpring();
        expect(state.isStarActive).toBe(true);
        expect(state.isSpringActive).toBe(true);

        state.reset();
        expect(state.isStarActive).toBe(false);
        expect(state.isSpringActive).toBe(false);
    });
});
