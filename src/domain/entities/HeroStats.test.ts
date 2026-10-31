import { describe, expect, it } from 'vitest';
import { HeroStats, type StatsTuning } from './HeroStats';

const tuning: StatsTuning = {
    stats: {
        attack: { maxPoints: 5, perPoint: 0.1 },
        hearts: { maxPoints: 4, pointsPerHeart: 2 },
        guard: { maxPoints: 3, blockChancePerPoint: 0.1 },
        agility: { maxPoints: 2, speedPerPoint: 0.05 },
    },
    respec: { ingredients: [{ itemId: 'crystal', count: 1 }] },
};

describe('HeroStats', () =>
{
    it('starts with nothing spent and no bonus', () =>
    {
        const stats = new HeroStats();
        expect(stats.totalSpent).toBe(0);
        expect(stats.attackMultiplier(tuning)).toBe(1);
        expect(stats.bonusHearts(tuning)).toBe(0);
        expect(stats.blockChance(tuning)).toBe(0);
        expect(stats.speedMultiplier(tuning)).toBe(1);
    });

    it('turns points into bonuses', () =>
    {
        const stats = new HeroStats();
        for (let i = 0; i < 3; i++) stats.add('attack', tuning);
        for (let i = 0; i < 3; i++) stats.add('hearts', tuning);
        for (let i = 0; i < 2; i++) stats.add('guard', tuning);
        stats.add('agility', tuning);
        expect(stats.attackMultiplier(tuning)).toBeCloseTo(1.3);
        expect(stats.bonusHearts(tuning)).toBe(1);
        expect(stats.blockChance(tuning)).toBeCloseTo(0.2);
        expect(stats.speedMultiplier(tuning)).toBeCloseTo(1.05);
        expect(stats.totalSpent).toBe(9);
    });

    it('refuses a point in a full Stat', () =>
    {
        const stats = new HeroStats();
        expect(stats.add('agility', tuning)).toBe(true);
        expect(stats.add('agility', tuning)).toBe(true);
        expect(stats.canAdd('agility', tuning)).toBe(false);
        expect(stats.add('agility', tuning)).toBe(false);
        expect(stats.pointsIn('agility')).toBe(2);
    });

    it('takes every point back and says how many there were', () =>
    {
        const stats = new HeroStats();
        stats.add('attack', tuning);
        stats.add('guard', tuning);
        expect(stats.clear()).toBe(2);
        expect(stats.totalSpent).toBe(0);
    });

    it('loads a save and counts at most the ceiling of a Stat', () =>
    {
        const stats = new HeroStats();
        stats.loadFrom({ attack: 50, hearts: -1, guard: 1.5, agility: 'x' });
        expect(stats.toSnapshot()).toEqual({ attack: 50, hearts: 0, guard: 0, agility: 0 });
        expect(stats.attackMultiplier(tuning)).toBeCloseTo(1.5);
        stats.loadFrom(undefined);
        expect(stats.totalSpent).toBe(0);
    });
});

describe('the real Stat sizes (progression.json)', () =>
{
    it('make a few points already change the damage of the first sword (12), and the last ones fill each ceiling', async () =>
    {
        const progression = (await import('../../../public/data/progression.json')).default;
        const real = { stats: progression.stats, respec: progression.respec } as StatsTuning;
        const stats = new HeroStats();
        for (let i = 0; i < 3; i++) stats.add('attack', real);
        expect(Math.round(12 * stats.attackMultiplier(real))).toBeGreaterThan(12);

        const full = new HeroStats();
        full.loadFrom({ attack: 50, hearts: 30, guard: 30, agility: 39 });
        expect(full.attackMultiplier(real)).toBeCloseTo(1.75);
        expect(full.bonusHearts(real)).toBe(3);
        expect(full.blockChance(real)).toBeCloseTo(0.36);
        expect(full.speedMultiplier(real)).toBeCloseTo(1.156);
        // The top of the Attack Stat is about one sword tier (12 -> 22 is +83 %), so gear stays the main strength
        expect(full.attackMultiplier(real)).toBeLessThan(22 / 12);
    });
});
