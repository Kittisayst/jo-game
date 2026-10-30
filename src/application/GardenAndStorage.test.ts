import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { Garden, MAX_PLOTS, STARTING_PLOTS } from '../domain/entities/Garden';
import { ItemCatalog, ItemDefinition } from '../domain/entities/ItemCatalog';
import type { Clock } from '../domain/ports';
import {
    expandGardenUseCase, ExpansionCosts, growMinutesOf, harvestPlotUseCase, nextPlotCost, plantSeedUseCase,
} from './GardenUseCases';
import { transferItemUseCase } from './TransferItemUseCase';

const MINUTE = 60_000;

const material = (id: string, extra: Partial<ItemDefinition> = {}): ItemDefinition => ({
    id, name: id, nameEn: id, description: '', category: 'material', maxStack: 99, icon: '', ...extra,
});

const catalog = new ItemCatalog([
    material('herb-seed', { plant: { minutes: 10, harvest: [{ itemId: 'herb', count: 4 }] } }),
    material('oak-sapling', { plant: { minutes: 20, harvest: [{ itemId: 'wood', count: 6 }, { itemId: 'fiber', count: 1 }] } }),
    material('herb'),
    material('wood'),
    material('fiber'),
    material('stone'),
    { id: 'iron-sword', name: '', nameEn: '', description: '', category: 'weapon', maxStack: 1, icon: '', durability: 10 },
]);

const clockAt = (ms: number): Clock => ({ now: () => ms });
const costs: ExpansionCosts = Array.from({ length: MAX_PLOTS - STARTING_PLOTS }, (_, i) => [{ itemId: 'wood', count: 10 + i }]);
const setup = () => ({ garden: new Garden(), backpack: new Backpack([], catalog) });

describe('Garden', () =>
{
    it('starts with six empty Plots', () =>
    {
        const { garden } = setup();

        expect(garden.plotCount).toBe(6);
        expect(garden.hasPlants).toBe(false);
        expect(garden.statusOf(0, 0, growMinutesOf(catalog))).toEqual({ state: 'empty' });
    });

    it('grows a planted Seed for its minutes and then it is ready', () =>
    {
        const { garden } = setup();
        garden.plant(2, 'herb-seed', 1_000);
        const minutes = growMinutesOf(catalog);

        expect(garden.statusOf(2, 1_000, minutes)).toEqual({ state: 'growing', seedItemId: 'herb-seed', remainingMs: 10 * MINUTE });
        expect(garden.statusOf(2, 1_000 + 4 * MINUTE, minutes)).toMatchObject({ state: 'growing', remainingMs: 6 * MINUTE });
        expect(garden.statusOf(2, 1_000 + 10 * MINUTE, minutes)).toEqual({ state: 'ready', seedItemId: 'herb-seed' });
        expect(garden.readyCount(1_000 + 10 * MINUTE, minutes)).toBe(1);
    });

    it('treats a Seed it does not know as ready, so a changed data file never leaves a Plot stuck', () =>
    {
        const { garden } = setup();
        garden.plant(0, 'gone-seed', 0);

        expect(garden.statusOf(0, 0, growMinutesOf(catalog))).toEqual({ state: 'ready', seedItemId: 'gone-seed' });
    });

    it('refuses a taken Plot and a Plot that does not exist', () =>
    {
        const { garden } = setup();

        expect(garden.plant(0, 'herb-seed', 0)).toBe(true);
        expect(garden.plant(0, 'herb-seed', 0)).toBe(false);
        expect(garden.plant(6, 'herb-seed', 0)).toBe(false);
        expect(garden.plant(-1, 'herb-seed', 0)).toBe(false);
    });

    it('grows by one Plot at a time up to twelve', () =>
    {
        const { garden } = setup();
        for (let i = STARTING_PLOTS; i < MAX_PLOTS; i++) expect(garden.expand()).toBe(true);

        expect(garden.plotCount).toBe(12);
        expect(garden.expand()).toBe(false);
        expect(garden.plant(11, 'herb-seed', 0)).toBe(true);
    });

    it('saves and loads the Plots, repairing broken ones, and resets', () =>
    {
        const { garden } = setup();
        garden.expand();
        garden.plant(6, 'herb-seed', 5);

        const loaded = new Garden();
        loaded.loadFrom(garden.toSnapshot());
        expect(loaded.plotCount).toBe(7);
        expect(loaded.plotAt(6)).toEqual({ seedItemId: 'herb-seed', plantedAtMs: 5 });

        loaded.loadFrom({ plotCount: 99, plots: [{ seedItemId: '', plantedAtMs: 1 }, null, { seedItemId: 'x', plantedAtMs: Number.NaN }] });
        expect(loaded.plotCount).toBe(12);
        expect(loaded.hasPlants).toBe(false);

        loaded.reset();
        expect(loaded.plotCount).toBe(6);
    });
});

describe('plantSeedUseCase', () =>
{
    it('takes one Seed and fills the Plot', () =>
    {
        const { garden, backpack } = setup();
        backpack.addItem('herb-seed', 2);

        expect(plantSeedUseCase(0, 'herb-seed', garden, backpack, catalog, clockAt(7))).toEqual({ success: true });

        expect(backpack.getItemCount('herb-seed')).toBe(1);
        expect(garden.plotAt(0)).toEqual({ seedItemId: 'herb-seed', plantedAtMs: 7 });
    });

    it('refuses what is not a Seed, a Seed that is not carried and a taken Plot, and takes nothing', () =>
    {
        const { garden, backpack } = setup();
        backpack.addItem('herb', 3);
        backpack.addItem('herb-seed', 1);

        expect(plantSeedUseCase(0, 'herb', garden, backpack, catalog, clockAt(0))).toEqual({ success: false, reason: 'not_a_seed' });
        expect(plantSeedUseCase(0, 'oak-sapling', garden, backpack, catalog, clockAt(0))).toEqual({ success: false, reason: 'not_in_backpack' });
        plantSeedUseCase(0, 'herb-seed', garden, backpack, catalog, clockAt(0));
        backpack.addItem('herb-seed', 1);
        expect(plantSeedUseCase(0, 'herb-seed', garden, backpack, catalog, clockAt(0))).toEqual({ success: false, reason: 'plot_taken' });
        expect(backpack.getItemCount('herb-seed')).toBe(1);
    });
});

describe('harvestPlotUseCase', () =>
{
    const planted = (seed = 'herb-seed') =>
    {
        const s = setup();
        s.backpack.addItem(seed, 1);
        plantSeedUseCase(0, seed, s.garden, s.backpack, catalog, clockAt(0));
        return s;
    };

    it('gives the Materials of a ready Plot and empties it', () =>
    {
        const { garden, backpack } = planted();

        expect(harvestPlotUseCase(0, garden, backpack, catalog, clockAt(10 * MINUTE))).toEqual({ success: true, harvest: [{ itemId: 'herb', count: 4 }] });

        expect(backpack.getItemCount('herb')).toBe(4);
        expect(garden.plotAt(0)).toBeNull();
    });

    it('gives every Material a plant yields', () =>
    {
        const { garden, backpack } = planted('oak-sapling');

        harvestPlotUseCase(0, garden, backpack, catalog, clockAt(20 * MINUTE));

        expect(backpack.getItemCount('wood')).toBe(6);
        expect(backpack.getItemCount('fiber')).toBe(1);
    });

    it('is refused while the plant grows, saying how long is left', () =>
    {
        const { garden, backpack } = planted();

        expect(harvestPlotUseCase(0, garden, backpack, catalog, clockAt(3 * MINUTE)))
            .toEqual({ success: false, reason: 'not_ready', remainingMs: 7 * MINUTE });
        expect(garden.plotAt(0)).not.toBeNull();
    });

    it('is refused for an empty Plot', () =>
    {
        const { garden, backpack } = setup();

        expect(harvestPlotUseCase(0, garden, backpack, catalog, clockAt(0))).toEqual({ success: false, reason: 'empty' });
    });

    it('leaves the plant in its Plot when the Backpack has no room, so nothing is lost', () =>
    {
        const { garden, backpack } = planted();
        for (let i = 0; i < backpack.maxSlots; i++) backpack.addItem('iron-sword', 1);

        expect(harvestPlotUseCase(0, garden, backpack, catalog, clockAt(10 * MINUTE))).toEqual({ success: false, reason: 'backpack_full' });
        expect(garden.plotAt(0)).not.toBeNull();
    });
});

describe('expandGardenUseCase', () =>
{
    it('takes the Materials of the next Plot and adds it', () =>
    {
        const { garden, backpack } = setup();
        backpack.addItem('wood', 12);

        expect(nextPlotCost(garden, costs)).toEqual([{ itemId: 'wood', count: 10 }]);
        expect(expandGardenUseCase(garden, backpack, costs)).toEqual({ success: true, plotCount: 7 });

        expect(backpack.getItemCount('wood')).toBe(2);
        expect(nextPlotCost(garden, costs)).toEqual([{ itemId: 'wood', count: 11 }]);
    });

    it('takes nothing when a Material is short, and stops at twelve Plots', () =>
    {
        const { garden, backpack } = setup();
        backpack.addItem('wood', 9);
        expect(expandGardenUseCase(garden, backpack, costs)).toEqual({ success: false, reason: 'insufficient_ingredients' });
        expect(backpack.getItemCount('wood')).toBe(9);

        for (let i = garden.plotCount; i < MAX_PLOTS; i++) garden.expand();
        expect(nextPlotCost(garden, costs)).toBeNull();
        expect(expandGardenUseCase(garden, backpack, costs)).toEqual({ success: false, reason: 'fully_grown' });
    });
});

describe('the Storage chest', () =>
{
    const chest = () => new Backpack([], catalog, 40);

    it('is a Backpack with 40 slots', () =>
    {
        expect(chest().maxSlots).toBe(40);
        expect(new Backpack([], catalog).maxSlots).toBe(30);
    });

    it('moves a stack across, both ways', () =>
    {
        const backpack = new Backpack([], catalog);
        const storage = chest();
        backpack.addItem('wood', 12);

        expect(transferItemUseCase(backpack, storage, 0)).toEqual({ success: true, moved: 12 });
        expect(backpack.getItemCount('wood')).toBe(0);
        expect(storage.getItemCount('wood')).toBe(12);

        expect(transferItemUseCase(storage, backpack, 0)).toEqual({ success: true, moved: 12 });
        expect(backpack.getItemCount('wood')).toBe(12);
    });

    it('moves as much as fits and leaves the rest where it was', () =>
    {
        const backpack = new Backpack([], catalog);
        const storage = chest();
        backpack.addItem('wood', 99);
        // Fill the chest so that only 10 more wood fit
        for (let i = 0; i < 39; i++) storage.addItem(`filler-${i}`, 1);
        storage.addItem('wood', 89);

        expect(transferItemUseCase(backpack, storage, 0)).toEqual({ success: true, moved: 10 });
        expect(backpack.getItemCount('wood')).toBe(89);
        expect(storage.getItemCount('wood')).toBe(99);
    });

    it('refuses when the other side is full or the slot is empty, and moves nothing', () =>
    {
        const backpack = new Backpack([], catalog);
        const storage = chest();
        for (let i = 0; i < 40; i++) storage.addItem(`filler-${i}`, 1);
        backpack.addItem('wood', 3);

        expect(transferItemUseCase(backpack, storage, 0)).toEqual({ success: false, reason: 'destination_full' });
        expect(backpack.getItemCount('wood')).toBe(3);
        expect(transferItemUseCase(backpack, storage, 5)).toEqual({ success: false, reason: 'empty_slot' });
    });

    it('keeps the Durability of a sword that goes in and comes out', () =>
    {
        const backpack = new Backpack([], catalog);
        const storage = chest();
        backpack.addItem('iron-sword', 1);
        backpack.wearItem('iron-sword', 6);

        transferItemUseCase(backpack, storage, 0);
        expect(storage.getDurability('iron-sword')?.current).toBe(4);
        expect(backpack.getItemCount('iron-sword')).toBe(0);

        transferItemUseCase(storage, backpack, 0);
        expect(backpack.getDurability('iron-sword')?.current).toBe(4);
    });

    it('is not touched when the hero dies: only the Backpack loses half', () =>
    {
        const backpack = new Backpack([], catalog);
        const storage = chest();
        backpack.addItem('wood', 10);
        storage.addItem('wood', 10);

        backpack.applyRetreatPenalty();

        expect(backpack.getItemCount('wood')).toBe(5);
        expect(storage.getItemCount('wood')).toBe(10);
    });

    it('saves and loads its slots', () =>
    {
        const storage = chest();
        storage.addItem('wood', 7);
        storage.addItem('iron-sword', 1);
        storage.wearItem('iron-sword', 3);

        const loaded = new Backpack(storage.toSnapshot(), catalog, 40);

        expect(loaded.getItemCount('wood')).toBe(7);
        expect(loaded.getDurability('iron-sword')?.current).toBe(7);
    });
});
