import { describe, expect, it } from 'vitest';
import progression from '../../../public/data/progression.json';
import { parseProgression } from './ProgressionCatalog';

const copy = () => JSON.parse(JSON.stringify(progression)) as Record<string, unknown>;

describe('progression.json', () =>
{
    it('reads the Hero Level curve', () =>
    {
        const parsed = parseProgression(progression);
        expect(parsed.maxLevel).toBe(150);
        expect(parsed.xpCurve).toEqual({ base: 10, exponent: 1.5 });
        expect(parsed.overlevel.xpShare).toBe(0.2);
    });

    it('names the file and path of a mistake', () =>
    {
        expect(() => parseProgression({ ...copy(), maxLevel: 151 })).toThrow(/progression\.json: maxLevel must be a whole number from 2 to 150/);
        expect(() => parseProgression({ ...copy(), maxLevel: 1 })).toThrow(/maxLevel/);
        expect(() => parseProgression({ ...copy(), xpCurve: { base: 0, exponent: 1.5 } })).toThrow(/xpCurve\.base/);
        expect(() => parseProgression({ ...copy(), xpCurve: { base: 10, exponent: 0.5 } })).toThrow(/xpCurve\.exponent/);
        expect(() => parseProgression({ ...copy(), overlevel: { levelsPerStage: 1.5, offset: 10, xpShare: 2 } })).toThrow(/overlevel\.xpShare/);
        expect(() => parseProgression({ ...copy(), pointsPerLevel: 'x' })).toThrow(/pointsPerLevel/);
    });
});
