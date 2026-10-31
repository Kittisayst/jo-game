import { describe, expect, it } from 'vitest';
import { NightHunts } from './NightHunts';

describe('NightHunts', () =>
{
    it('says a Stage had its night creatures only for the night it was marked in', () =>
    {
        const hunts = new NightHunts();
        expect(hunts.hasHunted('stage-002', 0)).toBe(false);
        hunts.markHunted('stage-002', 0);
        expect(hunts.hasHunted('stage-002', 0)).toBe(true);
        expect(hunts.hasHunted('stage-003', 0)).toBe(false);
        expect(hunts.hasHunted('stage-002', 1)).toBe(false);
    });

    it('starts a new list when a new night begins', () =>
    {
        const hunts = new NightHunts();
        hunts.markHunted('stage-002', 0);
        hunts.markHunted('stage-003', 1);
        expect(hunts.hasHunted('stage-002', 0)).toBe(false);
        expect(hunts.hasHunted('stage-003', 1)).toBe(true);
    });

    it('saves and loads, and ignores nonsense', () =>
    {
        const hunts = new NightHunts();
        hunts.markHunted('stage-002', 4);
        const copy = new NightHunts();
        copy.loadFrom(hunts.toSnapshot());
        expect(copy.hasHunted('stage-002', 4)).toBe(true);
        copy.loadFrom({ nightId: 'x' as unknown as number, stages: [7 as unknown as string] });
        expect(copy.toSnapshot()).toEqual({ nightId: -1, stages: [] });
        copy.loadFrom(undefined);
        expect(copy.toSnapshot()).toEqual({ nightId: -1, stages: [] });
    });
});
