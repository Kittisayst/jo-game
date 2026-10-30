import { describe, expect, it } from 'vitest';
import { damageAfterWear, deathWearAmount, durabilityStateOf, strikeWeightFor } from './Durability';

describe('durabilityStateOf', () =>
{
    it('is ok above a fifth, low at or below it and broken at zero', () =>
    {
        expect(durabilityStateOf(100, 100)).toBe('ok');
        expect(durabilityStateOf(21, 100)).toBe('ok');
        expect(durabilityStateOf(20, 100)).toBe('low');
        expect(durabilityStateOf(1, 100)).toBe('low');
        expect(durabilityStateOf(0, 100)).toBe('broken');
        expect(durabilityStateOf(-3, 100)).toBe('broken');
    });
});

describe('what a worn item is worth', () =>
{
    it('does full damage until broken, then half, and never less than 1', () =>
    {
        expect(damageAfterWear(22, 'ok')).toBe(22);
        expect(damageAfterWear(22, 'low')).toBe(22);
        expect(damageAfterWear(22, 'broken')).toBe(11);
        expect(damageAfterWear(1, 'broken')).toBe(1);
    });

    it('counts a Strike as half when the tool is broken, so the node takes twice the Strikes', () =>
    {
        expect(strikeWeightFor('ok')).toBe(1);
        expect(strikeWeightFor('low')).toBe(1);
        expect(strikeWeightFor('broken')).toBe(0.5);
    });

    it('takes a tenth of the maximum when the hero dies, at least 1', () =>
    {
        expect(deathWearAmount(100)).toBe(10);
        expect(deathWearAmount(80)).toBe(8);
        expect(deathWearAmount(25)).toBe(3);
        expect(deathWearAmount(5)).toBe(1);
    });
});
