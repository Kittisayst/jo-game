import { describe, expect, it } from 'vitest';
import { HeroLevel, xpShareForStage, xpToNext, type ProgressionTuning } from './HeroLevel';

const tuning: ProgressionTuning = {
    maxLevel: 5,
    xpCurve: { base: 10, exponent: 1 },
    pointsPerLevel: 1,
    overlevel: { levelsPerStage: 1.5, offset: 10, xpShare: 0.2 },
};

describe('HeroLevel', () =>
{
    it('starts at level 1 with no XP and no points', () =>
    {
        const hero = new HeroLevel();
        expect(hero.toSnapshot()).toEqual({ level: 1, xp: 0, unspentPoints: 0 });
    });

    it('needs more XP for each level', () =>
    {
        expect(xpToNext(1, tuning)).toBe(10);
        expect(xpToNext(3, tuning)).toBe(30);
        const curved: ProgressionTuning = { ...tuning, xpCurve: { base: 10, exponent: 1.5 } };
        expect(xpToNext(40, curved)).toBeGreaterThan(xpToNext(39, curved));
    });

    it('goes up a level and gives a point when the XP is enough, keeping the rest', () =>
    {
        const hero = new HeroLevel();
        expect(hero.gainXp(7, tuning)).toBe(0);
        expect(hero.gainXp(8, tuning)).toBe(1);
        expect(hero.toSnapshot()).toEqual({ level: 2, xp: 5, unspentPoints: 1 });
    });

    it('can go up several levels at once', () =>
    {
        const hero = new HeroLevel();
        expect(hero.gainXp(10 + 20 + 30 + 3, tuning)).toBe(3);
        expect(hero.toSnapshot()).toEqual({ level: 4, xp: 3, unspentPoints: 3 });
    });

    it('stops at the top level and ignores more XP', () =>
    {
        const hero = new HeroLevel();
        hero.gainXp(10_000, tuning);
        expect(hero.level).toBe(5);
        expect(hero.xp).toBe(0);
        expect(hero.isMaxLevel(tuning)).toBe(true);
        expect(hero.gainXp(500, tuning)).toBe(0);
        expect(hero.toSnapshot()).toEqual({ level: 5, xp: 0, unspentPoints: 4 });
    });

    it('ignores zero and negative XP', () =>
    {
        const hero = new HeroLevel();
        expect(hero.gainXp(0, tuning)).toBe(0);
        expect(hero.gainXp(-5, tuning)).toBe(0);
        expect(hero.xp).toBe(0);
    });

    it('loads a save and drops anything out of range', () =>
    {
        const hero = new HeroLevel();
        hero.loadFrom({ level: 40, xp: 12, unspentPoints: 3 });
        expect(hero.toSnapshot()).toEqual({ level: 40, xp: 12, unspentPoints: 3 });
        hero.loadFrom({ level: 999, xp: -4, unspentPoints: 1.5 });
        expect(hero.toSnapshot()).toEqual({ level: 1, xp: 0, unspentPoints: 0 });
        hero.loadFrom(undefined);
        expect(hero.level).toBe(1);
    });
});

describe('xpShareForStage', () =>
{
    it('pays in full in a Stage near the hero level and a fifth in one far below it', () =>
    {
        expect(xpShareForStage(1, 1, tuning)).toBe(1);
        expect(xpShareForStage(11, 1, tuning)).toBe(1);
        expect(xpShareForStage(12, 1, tuning)).toBe(0.2);
        expect(xpShareForStage(50, 30, tuning)).toBe(1);
        expect(xpShareForStage(55, 30, tuning)).toBe(1);
        expect(xpShareForStage(60, 30, tuning)).toBe(0.2);
    });
});
