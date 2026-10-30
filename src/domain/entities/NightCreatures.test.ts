import { describe, expect, it } from 'vitest';
import type { EnemyDefinition } from './Enemy';
import { nightCreatureCount, nightCreatureIdsFor, scaleNightCreature, stageHasNightCreatures, type NightTuning } from './NightCreatures';
import type { StageScaling } from './StageScaling';

const tuning: NightTuning = {
    creaturesPerScreen: 1,
    hpMultiplier: 1.5,
    xpMultiplier: 2,
    minDistanceFromHero: 500,
    byRealm: { 1: ['night-wisp'], 2: ['night-shade', 'night-wisp'] },
};
const scaling: StageScaling = { enemyHpPerStage: 0.1, enemyDamagePerRealm: 2, dropBonusPerRealm: 0, enemyXpPerStage: 1 };

const wisp: EnemyDefinition = { id: 'night-wisp', kind: 'normal', night: true, maxHp: 40, damage: 10, xp: 10, drops: [] };

describe('night creatures', () =>
{
    it('finds the creatures of a Realm, and none for a Realm without any', () =>
    {
        expect(nightCreatureIdsFor(1, tuning)).toEqual(['night-wisp']);
        expect(nightCreatureIdsFor(2, tuning)).toEqual(['night-shade', 'night-wisp']);
        expect(nightCreatureIdsFor(7, tuning)).toEqual([]);
    });

    it('puts a number of them on every screen of the Stage', () =>
    {
        expect(nightCreatureCount(1280, tuning)).toBe(1);
        expect(nightCreatureCount(2560, tuning)).toBe(2);
        expect(nightCreatureCount(3000, tuning)).toBe(3);
        expect(nightCreatureCount(2560, { ...tuning, creaturesPerScreen: 2 })).toBe(4);
        expect(nightCreatureCount(100, tuning)).toBe(1);
    });

    it('makes them tougher and richer than the Stage scaling alone', () =>
    {
        const day = scaleNightCreature(wisp, 1, scaling, { ...tuning, hpMultiplier: 1, xpMultiplier: 1 });
        expect(day.maxHp).toBe(40);
        const night = scaleNightCreature(wisp, 1, scaling, tuning);
        expect(night.maxHp).toBe(60);
        expect(night.xp).toBe(20);

        // Stage 3: the scaling adds 20 % HP and 200 % XP first, then the night multiplies
        const later = scaleNightCreature(wisp, 3, scaling, tuning);
        expect(later.maxHp).toBe(Math.round(Math.round(40 * 1.2) * 1.5));
        expect(later.xp).toBe(Math.round(10 * 3) * 2);
    });

    it('does not walk the first Stage, a Mini-boss or Boss Stage, or a Stage that turned it off', () =>
    {
        expect(stageHasNightCreatures({ number: 2, night: true }, false, false)).toBe(true);
        expect(stageHasNightCreatures({ number: 1, night: true }, false, false)).toBe(false);
        expect(stageHasNightCreatures({ number: 5, night: true }, false, true)).toBe(false);
        expect(stageHasNightCreatures({ number: 10, night: true }, true, false)).toBe(false);
        expect(stageHasNightCreatures({ number: 4, night: false }, false, false)).toBe(false);
    });
});
