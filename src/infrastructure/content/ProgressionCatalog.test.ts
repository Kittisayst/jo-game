import { describe, expect, it } from 'vitest';
import progression from '../../../public/data/progression.json';
import { parseProgression, parseStatsTuning } from './ProgressionCatalog';

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

describe('progression.json Stats', () =>
{
    it('reads the four Stats and the price of starting over', () =>
    {
        const parsed = parseStatsTuning(progression);
        expect(parsed.stats.attack).toEqual({ maxPoints: 50, perPoint: 0.015 });
        expect(parsed.stats.hearts.pointsPerHeart).toBe(10);
        expect(parsed.respec.ingredients).toEqual([{ itemId: 'moon-dust', count: 3 }]);
    });

    it('needs the ceilings to add up to the points of the top level, so no point is wasted', () =>
    {
        const total = Object.values(progression.stats).reduce((sum, s) => sum + s.maxPoints, 0);
        expect(total).toBe((progression.maxLevel - 1) * progression.pointsPerLevel);

        const broken = copy() as { stats: { attack: { maxPoints: number } } };
        broken.stats.attack.maxPoints = 49;
        expect(() => parseStatsTuning(broken)).toThrow(/stats must be ceilings that add up to 149 points/);
    });

    it('refuses a free reset and a block chance that is too high', () =>
    {
        expect(() => parseStatsTuning({ ...copy(), respec: { ingredients: [] } })).toThrow(/respec\.ingredients/);
        const broken = copy() as { stats: { guard: { blockChancePerPoint: number } } };
        broken.stats.guard.blockChancePerPoint = 0.5;
        expect(() => parseStatsTuning(broken)).toThrow(/stats\.guard/);
    });
});
