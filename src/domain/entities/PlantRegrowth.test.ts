import { describe, expect, it } from 'vitest';
import { PlantRegrowth } from './PlantRegrowth';

const MINUTE = 60_000;

describe('PlantRegrowth', () =>
{
    it('tells plants apart by Stage and node', () =>
    {
        expect(PlantRegrowth.keyOf('stage-001', 'wild-herb-420')).toBe('stage-001:wild-herb-420');
        expect(PlantRegrowth.keyOf('stage-002', 'wild-herb-420')).not.toBe(PlantRegrowth.keyOf('stage-001', 'wild-herb-420'));
    });

    it('treats a plant that was never harvested as grown', () =>
    {
        const regrowth = new PlantRegrowth();

        expect(regrowth.isGrown('a', 0, 8)).toBe(true);
        expect(regrowth.remainingMs('a', 0, 8)).toBe(0);
    });

    it('counts down the minutes after a harvest', () =>
    {
        const regrowth = new PlantRegrowth();
        regrowth.markHarvested('a', 1_000);

        expect(regrowth.remainingMs('a', 1_000, 8)).toBe(8 * MINUTE);
        expect(regrowth.remainingMs('a', 1_000 + 3 * MINUTE, 8)).toBe(5 * MINUTE);
        expect(regrowth.isGrown('a', 1_000 + 8 * MINUTE - 1, 8)).toBe(false);
        expect(regrowth.isGrown('a', 1_000 + 8 * MINUTE, 8)).toBe(true);
    });

    it('is not fooled by a clock that moved back, and never goes below zero', () =>
    {
        const regrowth = new PlantRegrowth();
        regrowth.markHarvested('a', 10 * MINUTE);

        expect(regrowth.remainingMs('a', 5 * MINUTE, 8)).toBe(13 * MINUTE);
        expect(regrowth.remainingMs('a', 100 * MINUTE, 8)).toBe(0);
    });

    it('forgets a plant that is cleared, and a harvest starts the wait over', () =>
    {
        const regrowth = new PlantRegrowth();
        regrowth.markHarvested('a', 0);
        regrowth.clear('a');
        expect(regrowth.harvestedAt('a')).toBeUndefined();

        regrowth.markHarvested('a', 0);
        regrowth.markHarvested('a', 20 * MINUTE);
        expect(regrowth.remainingMs('a', 20 * MINUTE, 8)).toBe(8 * MINUTE);
    });

    it('saves and loads the times, dropping nonsense, and resets', () =>
    {
        const regrowth = new PlantRegrowth();
        regrowth.markHarvested('a', 5);

        const loaded = new PlantRegrowth();
        loaded.loadFrom({ ...regrowth.toSnapshot(), b: Number.NaN, c: 'x' as unknown as number });
        expect(loaded.toSnapshot()).toEqual({ a: 5 });

        loaded.reset();
        expect(loaded.toSnapshot()).toEqual({});
    });
});
