import { describe, expect, it } from 'vitest';
import type { EnemyDefinition } from './Enemy';
import { NO_SCALING, scaleEnemyDefinition, StageScaling } from './StageScaling';

const scaling: StageScaling = { enemyHpPerStage: 0.1, enemyDamagePerRealm: 2, dropBonusPerRealm: 0.1 };

const slime: EnemyDefinition = {
    id: 'forest-slime',
    kind: 'normal',
    maxHp: 20,
    damage: 8,
    drops: [{ itemId: 'fiber', chance: 0.8, count: 1 }, { itemId: 'herb', chance: 0.4, count: 1 }],
};

describe('scaleEnemyDefinition', () =>
{
    it('leaves Stage 1 as authored', () =>
    {
        expect(scaleEnemyDefinition(slime, 1, scaling)).toEqual(slime);
    });

    it('adds HP for every Stage after the first', () =>
    {
        expect(scaleEnemyDefinition(slime, 2, scaling).maxHp).toBe(22);
        expect(scaleEnemyDefinition(slime, 9, scaling).maxHp).toBe(36);
    });

    it('makes a later Stage tougher than an earlier one', () =>
    {
        expect(scaleEnemyDefinition(slime, 9, scaling).maxHp).toBeGreaterThan(scaleEnemyDefinition(slime, 2, scaling).maxHp);
    });

    it('adds damage and drop chance only when the Realm changes, and caps a chance at 1', () =>
    {
        const stage10 = scaleEnemyDefinition(slime, 10, scaling);
        expect(stage10.damage).toBe(8);
        const stage11 = scaleEnemyDefinition(slime, 11, scaling);
        expect(stage11.damage).toBe(10);
        expect(stage11.drops.map(d => d.chance)).toEqual([0.9, 0.5]);
        expect(scaleEnemyDefinition(slime, 31, scaling).drops[0].chance).toBe(1);
    });

    it('does not touch a Mini-boss or a Boss', () =>
    {
        const guardian: EnemyDefinition = { ...slime, id: 'cave-guardian', kind: 'miniboss' };
        expect(scaleEnemyDefinition(guardian, 55, scaling)).toBe(guardian);
    });

    it('does nothing with no scaling and does not change its input', () =>
    {
        expect(scaleEnemyDefinition(slime, 77, NO_SCALING)).toEqual(slime);
        scaleEnemyDefinition(slime, 77, scaling);
        expect(slime.maxHp).toBe(20);
        expect(slime.drops[0].chance).toBe(0.8);
    });
});
