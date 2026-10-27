import { describe, expect, it } from 'vitest';
import {
    DEFAULT_SPRING_DURATION_MS,
    DEFAULT_STAR_DURATION_MS,
    PowerUpState,
} from './PowerUp';

describe('PowerUpState entity', () =>
{
    it('initializes with no active power-ups', () =>
    {
        const state = new PowerUpState();
        expect(state.isStarActive).toBe(false);
        expect(state.isSpringActive).toBe(false);
        expect(state.starRemainingMs).toBe(0);
        expect(state.springRemainingMs).toBe(0);
        expect(state.starRemainingSeconds).toBe(0);
        expect(state.springRemainingSeconds).toBe(0);
    });

    it('activates and deactivates star power-up with defaults', () =>
    {
        const state = new PowerUpState();
        state.activateStar();
        expect(state.isStarActive).toBe(true);
        expect(state.starRemainingMs).toBe(DEFAULT_STAR_DURATION_MS);
        expect(state.starRemainingSeconds).toBe(8);

        state.deactivateStar();
        expect(state.isStarActive).toBe(false);
        expect(state.starRemainingMs).toBe(0);
    });

    it('activates and deactivates spring power-up with defaults and custom duration', () =>
    {
        const state = new PowerUpState();
        state.activateSpring();
        expect(state.isSpringActive).toBe(true);
        expect(state.springRemainingMs).toBe(DEFAULT_SPRING_DURATION_MS);
        expect(state.springRemainingSeconds).toBe(10);

        state.activateSpring(5000);
        expect(state.springRemainingMs).toBe(5000);
        expect(state.springRemainingSeconds).toBe(5);

        state.deactivateSpring();
        expect(state.isSpringActive).toBe(false);
        expect(state.springRemainingMs).toBe(0);
    });

    it('ticks down duration and detects expiration', () =>
    {
        const state = new PowerUpState();
        state.activateStar(1000);
        state.activateSpring(1500);

        const tick1 = state.tick(600);
        expect(tick1.starExpired).toBe(false);
        expect(tick1.springExpired).toBe(false);
        expect(state.starRemainingMs).toBe(400);
        expect(state.starRemainingSeconds).toBe(1);
        expect(state.springRemainingMs).toBe(900);
        expect(state.springRemainingSeconds).toBe(1);

        const tick2 = state.tick(400);
        expect(tick2.starExpired).toBe(true);
        expect(tick2.springExpired).toBe(false);
        expect(state.isStarActive).toBe(false);
        expect(state.isSpringActive).toBe(true);

        const tick3 = state.tick(600);
        expect(tick3.starExpired).toBe(false);
        expect(tick3.springExpired).toBe(true);
        expect(state.isSpringActive).toBe(false);
    });

    it('ignores zero or negative tick deltas', () =>
    {
        const state = new PowerUpState();
        state.activateStar(2000);

        const res1 = state.tick(0);
        expect(res1.starExpired).toBe(false);
        expect(state.starRemainingMs).toBe(2000);

        const res2 = state.tick(-100);
        expect(res2.starExpired).toBe(false);
        expect(state.starRemainingMs).toBe(2000);
    });

    it('resets all active power-ups', () =>
    {
        const state = new PowerUpState();
        state.activateStar(3000);
        state.activateSpring(4000);
        expect(state.isStarActive).toBe(true);
        expect(state.isSpringActive).toBe(true);

        state.reset();
        expect(state.isStarActive).toBe(false);
        expect(state.isSpringActive).toBe(false);
        expect(state.starRemainingMs).toBe(0);
        expect(state.springRemainingMs).toBe(0);
    });
});
