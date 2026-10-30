import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { Health } from '../domain/entities/Health';
import { HeroLevel } from '../domain/entities/HeroLevel';
import { HeroStats, type StatsTuning } from '../domain/entities/HeroStats';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
import { allocateStatPointUseCase, resetStatsUseCase, syncHeartsUseCase } from './HeroStatsUseCases';

const tuning: StatsTuning = {
    stats: {
        attack: { maxPoints: 5, perPoint: 0.1 },
        hearts: { maxPoints: 4, pointsPerHeart: 2 },
        guard: { maxPoints: 3, blockChancePerPoint: 0.1 },
        agility: { maxPoints: 2, speedPerPoint: 0.05 },
    },
    respec: { ingredients: [{ itemId: 'crystal', count: 2 }] },
};

function setup (points: number)
{
    const hero = new HeroLevel();
    hero.loadFrom({ level: 1 + points, xp: 0, unspentPoints: points });
    const catalog = new ItemCatalog();
    catalog.load([{ id: 'crystal', name: 'Crystal', icon: 'x', maxStack: 99 }] as never);
    return { hero, stats: new HeroStats(), health: new Health(), backpack: new Backpack([], catalog) };
}

describe('allocateStatPointUseCase', () =>
{
    it('spends a point on a Stat', () =>
    {
        const { hero, stats, health } = setup(2);
        expect(allocateStatPointUseCase(hero, stats, health, tuning, 'attack')).toEqual({ success: true });
        expect(hero.unspentPoints).toBe(1);
        expect(stats.pointsIn('attack')).toBe(1);
    });

    it('refuses without points, and in a full Stat, taking nothing', () =>
    {
        const none = setup(0);
        expect(allocateStatPointUseCase(none.hero, none.stats, none.health, tuning, 'attack')).toEqual({ success: false, reason: 'no_points' });

        const { hero, stats, health } = setup(5);
        stats.add('agility', tuning);
        stats.add('agility', tuning);
        expect(allocateStatPointUseCase(hero, stats, health, tuning, 'agility')).toEqual({ success: false, reason: 'stat_full' });
        expect(hero.unspentPoints).toBe(5);
    });

    it('gives a full new heart when the Hearts Stat reaches the next heart', () =>
    {
        const { hero, stats, health } = setup(2);
        allocateStatPointUseCase(hero, stats, health, tuning, 'hearts');
        expect(health.max).toBe(3);
        allocateStatPointUseCase(hero, stats, health, tuning, 'hearts');
        expect(health.max).toBe(4);
        expect(health.current).toBe(4);
    });
});

describe('resetStatsUseCase', () =>
{
    it('takes the Materials, gives every point back and takes the extra hearts away', () =>
    {
        const { hero, stats, health, backpack } = setup(3);
        backpack.addItem('crystal', 3);
        allocateStatPointUseCase(hero, stats, health, tuning, 'hearts');
        allocateStatPointUseCase(hero, stats, health, tuning, 'hearts');
        allocateStatPointUseCase(hero, stats, health, tuning, 'attack');
        expect(health.max).toBe(4);

        expect(resetStatsUseCase(hero, stats, health, backpack, tuning)).toEqual({ success: true, refunded: 3 });
        expect(hero.unspentPoints).toBe(3);
        expect(stats.totalSpent).toBe(0);
        expect(health.max).toBe(3);
        expect(health.current).toBe(3);
        expect(backpack.getItemCount('crystal')).toBe(1);
    });

    it('does nothing and takes nothing when the Materials are missing or nothing was spent', () =>
    {
        const { hero, stats, health, backpack } = setup(2);
        expect(resetStatsUseCase(hero, stats, health, backpack, tuning)).toMatchObject({ success: false, reason: 'nothing_spent' });

        allocateStatPointUseCase(hero, stats, health, tuning, 'attack');
        backpack.addItem('crystal', 1);
        expect(resetStatsUseCase(hero, stats, health, backpack, tuning)).toEqual({
            success: false, reason: 'missing_materials', missing: [{ itemId: 'crystal', count: 1 }],
        });
        expect(stats.pointsIn('attack')).toBe(1);
        expect(backpack.getItemCount('crystal')).toBe(1);
    });
});

describe('syncHeartsUseCase', () =>
{
    it('makes the hearts match the Stat, e.g. after loading a save', () =>
    {
        const { stats, health } = setup(0);
        stats.loadFrom({ hearts: 4 });
        syncHeartsUseCase(health, stats, tuning);
        expect(health.max).toBe(5);
    });
});
