import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { ItemCatalog, ItemDefinition } from '../domain/entities/ItemCatalog';
import { PendingRewards } from '../domain/entities/PendingRewards';
import { awardBossRewardUseCase } from './AwardBossRewardUseCase';
import { claimPendingRewardsUseCase, stashStoryOverflowUseCase } from './PendingRewardsUseCases';

const material = (id: string, extra: Partial<ItemDefinition> = {}): ItemDefinition => ({
    id, name: id, nameEn: id, description: '', category: 'material', maxStack: 99, icon: '', ...extra,
});

const catalog = new ItemCatalog([
    material('portal-shard-green', { story: true }),
    material('boss-core', { story: true, maxStack: 5 }),
    material('wood'),
    material('filler', { maxStack: 1 }),
]);

const fullBackpack = () =>
{
    const backpack = new Backpack([], catalog);
    for (let i = 0; i < backpack.maxSlots; i++) backpack.addItem('filler', 1);
    return backpack;
};

describe('PendingRewards', () =>
{
    it('adds up what waits, per item, and totals it', () =>
    {
        const pending = new PendingRewards();
        pending.add('portal-shard-green', 2);
        pending.add('portal-shard-green', 1);
        pending.add('boss-core', 1);

        expect(pending.entries).toEqual([{ itemId: 'portal-shard-green', count: 3 }, { itemId: 'boss-core', count: 1 }]);
        expect(pending.total).toBe(4);
        expect(pending.isEmpty).toBe(false);
    });

    it('ignores nothing-quantities and removes an entry when it reaches zero', () =>
    {
        const pending = new PendingRewards();
        pending.add('boss-core', 0);
        pending.add('', 3);
        expect(pending.isEmpty).toBe(true);

        pending.add('boss-core', 2);
        pending.remove('boss-core', 1);
        expect(pending.entries).toEqual([{ itemId: 'boss-core', count: 1 }]);
        pending.remove('boss-core', 5);
        expect(pending.isEmpty).toBe(true);
    });

    it('saves and loads, dropping nonsense', () =>
    {
        const pending = new PendingRewards();
        pending.add('portal-shard-green', 3);

        const loaded = new PendingRewards();
        loaded.loadFrom([...pending.toSnapshot(), { itemId: 'x', count: 0 }, { itemId: '', count: 4 }]);

        expect(loaded.entries).toEqual([{ itemId: 'portal-shard-green', count: 3 }]);
    });
});

describe('a Boss that drops into a full Backpack', () =>
{
    const drops = [
        { itemId: 'boss-core', chance: 1, count: 1 },
        { itemId: 'portal-shard-green', chance: 1, count: 3 },
        { itemId: 'wood', chance: 1, count: 2 },
    ];

    it('keeps the story Materials aside and loses only the ordinary one', () =>
    {
        const backpack = fullBackpack();
        const pending = new PendingRewards();

        const reward = awardBossRewardUseCase(backpack, drops);
        const stash = stashStoryOverflowUseCase(reward.overflow, pending, catalog);

        expect(reward.collected).toEqual([]);
        expect(stash.stashed).toEqual([{ itemId: 'boss-core', count: 1 }, { itemId: 'portal-shard-green', count: 3 }]);
        expect(stash.lost).toEqual([{ itemId: 'wood', count: 2 }]);
        expect(pending.total).toBe(4);
    });

    it('puts nothing aside when everything fit', () =>
    {
        const pending = new PendingRewards();
        const stash = stashStoryOverflowUseCase([], pending, catalog);

        expect(stash).toEqual({ stashed: [], lost: [] });
        expect(pending.isEmpty).toBe(true);
    });
});

describe('claimPendingRewardsUseCase', () =>
{
    it('gives nothing while the Backpack is still full', () =>
    {
        const backpack = fullBackpack();
        const pending = new PendingRewards();
        pending.add('portal-shard-green', 3);

        expect(claimPendingRewardsUseCase(pending, backpack)).toEqual([]);
        expect(pending.total).toBe(3);
    });

    it('moves everything in once there is room', () =>
    {
        const backpack = fullBackpack();
        const pending = new PendingRewards();
        pending.add('portal-shard-green', 3);
        backpack.removeItem('filler', 1);

        expect(claimPendingRewardsUseCase(pending, backpack)).toEqual([{ itemId: 'portal-shard-green', count: 3 }]);
        expect(backpack.getItemCount('portal-shard-green')).toBe(3);
        expect(pending.isEmpty).toBe(true);
    });

    it('moves what fits and keeps the rest waiting', () =>
    {
        const backpack = fullBackpack();
        const pending = new PendingRewards();
        pending.add('boss-core', 7);
        backpack.removeItem('filler', 1);

        // boss-core stacks to 5: one free slot holds 5, 2 stay
        expect(claimPendingRewardsUseCase(pending, backpack)).toEqual([{ itemId: 'boss-core', count: 5 }]);
        expect(pending.entries).toEqual([{ itemId: 'boss-core', count: 2 }]);
    });

    it('is kept when the hero dies, because it never sits in the Backpack to be halved', () =>
    {
        const backpack = new Backpack([], catalog);
        const pending = new PendingRewards();
        pending.add('portal-shard-green', 3);

        backpack.applyRetreatPenalty();

        expect(pending.total).toBe(3);
    });
});
