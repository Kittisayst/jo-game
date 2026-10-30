import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { ItemCatalog, ItemDefinition } from '../domain/entities/ItemCatalog';
import { PlantRegrowth } from '../domain/entities/PlantRegrowth';
import { ResourceNode } from '../domain/entities/ResourceNode';
import type { Clock, Random } from '../domain/ports';
import { harvestResourceNodeUseCase, ResourceNodeDefinition } from './HarvestResourceNodeUseCase';

const material = (id: string): ItemDefinition => ({
    id, name: id, nameEn: id, description: '', category: 'material', maxStack: 99, icon: '',
});
const catalog = new ItemCatalog([material('herb'), material('herb-seed'), material('wood'), material('oak-sapling'), material('filler')]);

const herb: ResourceNodeDefinition = {
    id: 'wild-herb-420',
    type: 'wild-herb',
    requiredTool: null,
    toolTier: 0,
    drops: [{ itemId: 'herb', count: 2 }],
    seed: { itemId: 'herb-seed', chance: 0.5 },
    regrowMinutes: 8,
};

const fixedRandom = (value: number): Random => ({ next: () => value });
const fixedClock = (now: number): Clock => ({ now: () => now });
const makeBackpack = () => new Backpack([], catalog);

describe('seeds from a plant', () =>
{
    it('drops one Seed when the roll is under the chance', () =>
    {
        const backpack = makeBackpack();

        const result = harvestResourceNodeUseCase(herb, new ResourceNode(1), backpack, { random: fixedRandom(0.49) });

        expect(result.seed).toEqual({ itemId: 'herb-seed', count: 1 });
        expect(backpack.getItemCount('herb-seed')).toBe(1);
        expect(backpack.getItemCount('herb')).toBe(2);
    });

    it('drops none when the roll is at or over the chance', () =>
    {
        const backpack = makeBackpack();

        const result = harvestResourceNodeUseCase(herb, new ResourceNode(1), backpack, { random: fixedRandom(0.5) });

        expect(result.seed).toBeUndefined();
        expect(backpack.getItemCount('herb-seed')).toBe(0);
    });

    it('always drops with chance 1 and never with chance 0', () =>
    {
        const sure = { ...herb, seed: { itemId: 'herb-seed', chance: 1 } };
        const never = { ...herb, seed: { itemId: 'herb-seed', chance: 0 } };

        expect(harvestResourceNodeUseCase(sure, new ResourceNode(1), makeBackpack(), { random: fixedRandom(0.999) }).seed).toBeDefined();
        expect(harvestResourceNodeUseCase(never, new ResourceNode(1), makeBackpack(), { random: fixedRandom(0) }).seed).toBeUndefined();
    });

    it('gives a Seed only on the last Strike', () =>
    {
        const oak: ResourceNodeDefinition = {
            id: 'oak', type: 'oak-tree', requiredTool: null, toolTier: 0,
            drops: [{ itemId: 'wood', count: 3 }], seed: { itemId: 'oak-sapling', chance: 1 },
        };
        const progress = new ResourceNode(3);
        const backpack = makeBackpack();

        expect(harvestResourceNodeUseCase(oak, progress, backpack, { random: fixedRandom(0) }).seed).toBeUndefined();
        expect(harvestResourceNodeUseCase(oak, progress, backpack, { random: fixedRandom(0) }).seed).toBeUndefined();
        expect(harvestResourceNodeUseCase(oak, progress, backpack, { random: fixedRandom(0) }).seed).toEqual({ itemId: 'oak-sapling', count: 1 });
    });

    it('does not break the harvest when the Backpack has no room for the Seed', () =>
    {
        const backpack = makeBackpack();
        for (let i = 0; i < backpack.maxSlots - 1; i++) backpack.addItem(`filler-${i}`, 1);
        // One slot left for the two herbs; the Seed has nowhere to go
        const result = harvestResourceNodeUseCase(herb, new ResourceNode(1), backpack, { random: fixedRandom(0) });

        expect(result.success).toBe(true);
        expect(result.completed).toBe(true);
        expect(result.seed).toBeUndefined();
    });

    it('does nothing about Seeds for a node that has none', () =>
    {
        const stone: ResourceNodeDefinition = { id: 's', type: 'stone-rock', requiredTool: null, toolTier: 0, drops: [{ itemId: 'wood', count: 1 }] };

        expect(harvestResourceNodeUseCase(stone, new ResourceNode(1), makeBackpack(), { random: fixedRandom(0) }).seed).toBeUndefined();
    });
});

describe('a small plant becomes a Sapling', () =>
{
    it('remembers the time of the harvest for this Stage and node', () =>
    {
        const regrowth = new PlantRegrowth();

        const result = harvestResourceNodeUseCase(herb, new ResourceNode(1), makeBackpack(), {
            random: fixedRandom(1), clock: fixedClock(5_000), regrowth, stageId: 'stage-003',
        });

        expect(result.regrowing).toBe(true);
        expect(regrowth.harvestedAt(PlantRegrowth.keyOf('stage-003', 'wild-herb-420'))).toBe(5_000);
    });

    it('does not start growing for a Strike that did not deplete it', () =>
    {
        const regrowth = new PlantRegrowth();
        const hardHerb = { ...herb };

        harvestResourceNodeUseCase(hardHerb, new ResourceNode(2), makeBackpack(), {
            random: fixedRandom(1), clock: fixedClock(1), regrowth, stageId: 'stage-003',
        });

        expect(regrowth.toSnapshot()).toEqual({});
    });

    it('leaves a node that regrows on enter (no minutes) out of the records', () =>
    {
        const regrowth = new PlantRegrowth();
        const oak: ResourceNodeDefinition = { ...herb, id: 'oak', regrowMinutes: undefined, seed: undefined };

        const result = harvestResourceNodeUseCase(oak, new ResourceNode(1), makeBackpack(), {
            random: fixedRandom(1), clock: fixedClock(1), regrowth, stageId: 'stage-003',
        });

        expect(result.regrowing).toBeUndefined();
        expect(regrowth.toSnapshot()).toEqual({});
    });

    it('stays a Sapling until its minutes have passed, then is grown', () =>
    {
        const regrowth = new PlantRegrowth();
        harvestResourceNodeUseCase(herb, new ResourceNode(1), makeBackpack(), {
            random: fixedRandom(1), clock: fixedClock(0), regrowth, stageId: 'stage-003',
        });
        const key = PlantRegrowth.keyOf('stage-003', 'wild-herb-420');

        expect(regrowth.isGrown(key, 7 * 60_000, 8)).toBe(false);
        expect(regrowth.isGrown(key, 8 * 60_000, 8)).toBe(true);
    });

    it('keeps two plants of the same kind in different Stages apart', () =>
    {
        const regrowth = new PlantRegrowth();
        harvestResourceNodeUseCase(herb, new ResourceNode(1), makeBackpack(), {
            random: fixedRandom(1), clock: fixedClock(0), regrowth, stageId: 'stage-003',
        });

        expect(regrowth.isGrown(PlantRegrowth.keyOf('stage-004', 'wild-herb-420'), 0, 8)).toBe(true);
    });
});

describe('Seeds when the hero dies', () =>
{
    it('loses half of the Seeds like any other Material', () =>
    {
        const backpack = makeBackpack();
        backpack.addItem('herb-seed', 7);

        const lost = backpack.applyRetreatPenalty().lost;

        expect(lost).toEqual([{ itemId: 'herb-seed', count: 4 }]);
        expect(backpack.getItemCount('herb-seed')).toBe(3);
    });
});
