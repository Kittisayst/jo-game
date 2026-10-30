import { afterEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { HeroLevel, type ProgressionTuning } from '../domain/entities/HeroLevel';
import { grantXpUseCase, HERO_LEVEL_UP_EVENT, XP_GAINED_EVENT, type HeroLevelUpPayload, type XpGainedPayload } from './GrantXpUseCase';

const tuning: ProgressionTuning = {
    maxLevel: 3,
    xpCurve: { base: 10, exponent: 1 },
    pointsPerLevel: 2,
    overlevel: { levelsPerStage: 1.5, offset: 10, xpShare: 0.2 },
};

describe('grantXpUseCase', () =>
{
    const gained: XpGainedPayload[] = [];
    const ups: HeroLevelUpPayload[] = [];
    const onGained = (p: XpGainedPayload) => gained.push(p);
    const onUp = (p: HeroLevelUpPayload) => ups.push(p);

    const listen = () =>
    {
        gained.length = 0;
        ups.length = 0;
        DomainEvents.on(XP_GAINED_EVENT, onGained);
        DomainEvents.on(HERO_LEVEL_UP_EVENT, onUp);
    };

    afterEach(() =>
    {
        DomainEvents.off(XP_GAINED_EVENT, onGained);
        DomainEvents.off(HERO_LEVEL_UP_EVENT, onUp);
    });

    it('adds the enemy XP and says so', () =>
    {
        listen();
        const hero = new HeroLevel();
        expect(grantXpUseCase(hero, tuning, 6, 1)).toEqual({ xp: 6, levelsGained: 0 });
        expect(hero.xp).toBe(6);
        expect(gained).toEqual([{ amount: 6 }]);
        expect(ups).toEqual([]);
    });

    it('announces a new level with the points waiting', () =>
    {
        listen();
        const hero = new HeroLevel();
        const result = grantXpUseCase(hero, tuning, 12, 1);
        expect(result).toEqual({ xp: 12, levelsGained: 1 });
        expect(ups).toEqual([{ level: 2, levelsGained: 1, unspentPoints: 2 }]);
    });

    it('gives a fifth of the XP for a monster in a Stage far below the hero, but at least 1', () =>
    {
        const hero = new HeroLevel();
        hero.loadFrom({ level: 2, xp: 0, unspentPoints: 0 });
        const veryLow = { ...tuning, overlevel: { levelsPerStage: 0.1, offset: 0, xpShare: 0.2 } };
        expect(grantXpUseCase(hero, veryLow, 10, 1).xp).toBe(2);
        expect(grantXpUseCase(hero, veryLow, 1, 1).xp).toBe(1);
    });

    it('gives nothing at the top level or for a monster worth no XP', () =>
    {
        listen();
        const hero = new HeroLevel();
        expect(grantXpUseCase(hero, tuning, 0, 1)).toEqual({ xp: 0, levelsGained: 0 });
        hero.loadFrom({ level: 3, xp: 0, unspentPoints: 0 });
        expect(grantXpUseCase(hero, tuning, 50, 1)).toEqual({ xp: 0, levelsGained: 0 });
        expect(gained).toEqual([]);
    });
});
