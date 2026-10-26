import { describe, expect, it } from 'vitest';
import { Lives } from './Lives';

describe('Lives entity', () =>
{
    it('initializes with default values', () =>
    {
        const lives = new Lives();
        expect(lives.current).toBe(3);
        expect(lives.max).toBe(3);
        expect(lives.isDead).toBe(false);
    });

    it('decreases life when takeDamage is called', () =>
    {
        const lives = new Lives(3);
        expect(lives.takeDamage()).toBe(false);
        expect(lives.current).toBe(2);

        expect(lives.takeDamage()).toBe(false);
        expect(lives.current).toBe(1);

        expect(lives.takeDamage()).toBe(true);
        expect(lives.current).toBe(0);
        expect(lives.isDead).toBe(true);
    });

    it('does not drop below 0 when damaged while dead', () =>
    {
        const lives = new Lives(1);
        lives.takeDamage();
        expect(lives.isDead).toBe(true);

        lives.takeDamage();
        expect(lives.current).toBe(0);
    });

    it('resets lives to maximum', () =>
    {
        const lives = new Lives(3);
        lives.takeDamage();
        lives.takeDamage();
        expect(lives.current).toBe(1);

        lives.reset();
        expect(lives.current).toBe(3);
        expect(lives.isDead).toBe(false);
    });

    it('heals up to max', () =>
    {
        const lives = new Lives(1, 3);
        lives.heal(1);
        expect(lives.current).toBe(2);

        lives.heal(5);
        expect(lives.current).toBe(3);
    });

    it('cannot heal when dead', () =>
    {
        const lives = new Lives(0, 3);
        lives.heal(1);
        expect(lives.current).toBe(0);
        expect(lives.isDead).toBe(true);
    });
});
