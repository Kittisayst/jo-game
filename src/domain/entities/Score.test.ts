import { describe, expect, it } from 'vitest';
import { Score } from './Score';

describe('Score entity', () =>
{
    it('initializes with 0 by default', () =>
    {
        const score = new Score();
        expect(score.value).toBe(0);
    });

    it('initializes with a positive number if provided', () =>
    {
        const score = new Score(50);
        expect(score.value).toBe(50);
    });

    it('clamps negative initial values to 0', () =>
    {
        const score = new Score(-20);
        expect(score.value).toBe(0);
    });

    it('adds positive points to score', () =>
    {
        const score = new Score();
        score.add(10);
        expect(score.value).toBe(10);

        score.add(25);
        expect(score.value).toBe(35);
    });

    it('ignores zero or negative points', () =>
    {
        const score = new Score(15);
        score.add(0);
        expect(score.value).toBe(15);

        score.add(-10);
        expect(score.value).toBe(15);
    });

    it('resets score to 0', () =>
    {
        const score = new Score(100);
        score.reset();
        expect(score.value).toBe(0);
    });
});
