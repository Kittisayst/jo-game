import { describe, expect, it } from 'vitest';
import { Backpack, BACKPACK_MAX_SLOTS } from '../domain/entities/Backpack';
import { Enemy, EnemyDefinition } from '../domain/entities/Enemy';
import { collectEnemyDropsUseCase } from './CollectEnemyDropsUseCase';

const guardian: EnemyDefinition = {
    id: 'cave-guardian',
    kind: 'miniboss',
    maxHp: 180,
    damage: 20,
    drops: [
        { itemId: 'crystal', chance: 1, count: 2 },
        { itemId: 'iron-ore', chance: 0.5, count: 3 },
    ],
};

describe('CollectEnemyDropsUseCase', () =>
{
    it('adds guaranteed drops and rolls chance drops with the given rng', () =>
    {
        const backpack = new Backpack();
        const enemy = Enemy.fromDefinition(guardian);

        const luckyRoll = collectEnemyDropsUseCase(enemy, backpack, () => 0.1);
        expect(luckyRoll.collected).toEqual([
            { itemId: 'crystal', count: 2 },
            { itemId: 'iron-ore', count: 3 },
        ]);
        expect(backpack.getItemCount('crystal')).toBe(2);

        const unluckyRoll = collectEnemyDropsUseCase(enemy, backpack, () => 0.9);
        expect(unluckyRoll.collected).toEqual([{ itemId: 'crystal', count: 2 }]);
        expect(backpack.getItemCount('crystal')).toBe(4);
    });

    it('reports overflow instead of losing track when the backpack is full', () =>
    {
        const backpack = new Backpack();
        for (let i = 0; i < BACKPACK_MAX_SLOTS; i++)
        {
            backpack.addItem(`filler-${i}`, 1);
        }
        const enemy = Enemy.fromDefinition(guardian);

        const result = collectEnemyDropsUseCase(enemy, backpack, () => 0);
        expect(result.collected).toEqual([]);
        expect(result.overflow).toEqual([
            { itemId: 'crystal', count: 2 },
            { itemId: 'iron-ore', count: 3 },
        ]);
    });

    it('does nothing for enemies without a definition', () =>
    {
        const backpack = new Backpack();
        const result = collectEnemyDropsUseCase(new Enemy('slime'), backpack, () => 0);
        expect(result).toEqual({ collected: [], overflow: [] });
    });
});
