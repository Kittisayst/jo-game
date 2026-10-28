import { describe, expect, it } from 'vitest';
import { Health } from './Health';

describe('Health entity', () =>
{
    it('initializes with default values', () =>
    {
        const health = new Health();
        expect(health.current).toBe(3);
        expect(health.max).toBe(3);
        expect(health.isDead).toBe(false);
    });

    it('decreases heart when takeDamage is called', () =>
    {
        const health = new Health(3);
        expect(health.takeDamage()).toBe(false);
        expect(health.current).toBe(2);

        expect(health.takeDamage()).toBe(false);
        expect(health.current).toBe(1);

        expect(health.takeDamage()).toBe(true);
        expect(health.current).toBe(0);
        expect(health.isDead).toBe(true);
    });

    it('does not drop below 0 when damaged while dead', () =>
    {
        const health = new Health(1);
        health.takeDamage();
        expect(health.isDead).toBe(true);

        health.takeDamage();
        expect(health.current).toBe(0);
    });

    it('resets health to maximum', () =>
    {
        const health = new Health(3);
        health.takeDamage();
        health.takeDamage();
        expect(health.current).toBe(1);

        health.reset();
        expect(health.current).toBe(3);
        expect(health.isDead).toBe(false);
    });

    it('heals up to max', () =>
    {
        const health = new Health(1, 3);
        health.heal(1);
        expect(health.current).toBe(2);

        health.heal(5);
        expect(health.current).toBe(3);
    });

    it('cannot heal when dead', () =>
    {
        const health = new Health(0, 3);
        health.heal(1);
        expect(health.current).toBe(0);
        expect(health.isDead).toBe(true);
    });
});
