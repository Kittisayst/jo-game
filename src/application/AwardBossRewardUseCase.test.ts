import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { Boss } from '../domain/entities/Boss';
import { awardBossRewardUseCase, reviveBossAfterFailedFinisherUseCase } from './AwardBossRewardUseCase';

const DROPS = [
    { itemId: 'boss-core', chance: 1, count: 1 },
    { itemId: 'crystal', chance: 1, count: 3 },
];

describe('awardBossRewardUseCase', () =>
{
    it('gives what the drop table says, Portal shards included', () =>
    {
        const backpack = new Backpack();

        const result = awardBossRewardUseCase(backpack, [...DROPS, { itemId: 'portal-shard-green', chance: 1, count: 3 }]);

        expect(result.collected).toContainEqual({ itemId: 'portal-shard-green', count: 3 });
        expect(backpack.getItemCount('portal-shard-green')).toBe(3);
    });

    it('rolls the chance of a drop', () =>
    {
        const backpack = new Backpack();
        const drops = [{ itemId: 'crystal', chance: 0.5, count: 2 }];

        expect(awardBossRewardUseCase(backpack, drops, () => 0.9).collected).toEqual([]);
        expect(awardBossRewardUseCase(backpack, drops, () => 0.1).collected).toEqual([{ itemId: 'crystal', count: 2 }]);
    });

    it('gives 1 boss core and 3 crystal', () =>
    {
        const backpack = new Backpack();

        const result = awardBossRewardUseCase(backpack, DROPS);

        expect(result.collected).toEqual([
            { itemId: 'boss-core', count: 1 },
            { itemId: 'crystal', count: 3 },
        ]);
        expect(result.overflow).toEqual([]);
        expect(backpack.getItemCount('boss-core')).toBe(1);
        expect(backpack.getItemCount('crystal')).toBe(3);
    });

    it('reports what does not fit when the backpack is full', () =>
    {
        const backpack = new Backpack();
        for (let i = 0; i < backpack.maxSlots; i++) backpack.addItem(`filler-${i}`, 1);

        const result = awardBossRewardUseCase(backpack, DROPS);

        expect(result.collected).toEqual([]);
        expect(result.overflow).toEqual([
            { itemId: 'boss-core', count: 1 },
            { itemId: 'crystal', count: 3 },
        ]);
    });
});

describe('reviveBossAfterFailedFinisherUseCase', () =>
{
    it('restores 15% of max HP (rounded up) and brings the Boss back', () =>
    {
        const boss = new Boss(300);
        boss.takeDamage(300);
        expect(boss.isDefeated).toBe(true);

        const healed = reviveBossAfterFailedFinisherUseCase(boss);

        expect(healed).toBe(45);
        expect(boss.currentHp).toBe(45);
        expect(boss.isDefeated).toBe(false);
    });
});
