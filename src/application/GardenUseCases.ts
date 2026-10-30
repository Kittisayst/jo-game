import { DomainEvents } from '../domain/DomainEvents';
import { Backpack, CraftingIngredient } from '../domain/entities/Backpack';
import { Garden, MAX_PLOTS } from '../domain/entities/Garden';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
import type { Clock } from '../domain/ports';

export const SEED_PLANTED_EVENT = 'seed-planted';
export const PLOT_HARVESTED_EVENT = 'plot-harvested';
export const GARDEN_EXPANDED_EVENT = 'garden-expanded';

export interface SeedPlantedPayload
{
    plot: number;
    seedItemId: string;
}

export interface PlotHarvestedPayload
{
    plot: number;
    harvest: CraftingIngredient[];
}

/** How long a Seed takes to grow, from `plant.minutes` in `items.json`; undefined for an item that is not a Seed. */
export function growMinutesOf (catalog: ItemCatalog): (seedItemId: string) => number | undefined
{
    return seedItemId => catalog.get(seedItemId)?.plant?.minutes;
}

export type PlantSeedResult =
    | { success: true }
    | { success: false; reason: 'not_a_seed' | 'not_in_backpack' | 'plot_taken' };

/** Plants one Seed from the Backpack in an empty Plot. Nothing is taken when it cannot be planted. */
export function plantSeedUseCase (
    plotIndex: number,
    seedItemId: string,
    garden: Garden,
    backpack: Backpack,
    catalog: ItemCatalog,
    clock: Clock
): PlantSeedResult
{
    if (!catalog.get(seedItemId)?.plant) return { success: false, reason: 'not_a_seed' };
    if (backpack.getItemCount(seedItemId) < 1) return { success: false, reason: 'not_in_backpack' };
    if (!garden.plant(plotIndex, seedItemId, clock.now())) return { success: false, reason: 'plot_taken' };

    backpack.removeItem(seedItemId, 1);
    DomainEvents.emit<SeedPlantedPayload>(SEED_PLANTED_EVENT, { plot: plotIndex, seedItemId });
    return { success: true };
}

export type HarvestPlotResult =
    | { success: true; harvest: CraftingIngredient[] }
    | { success: false; reason: 'empty' | 'not_ready' | 'backpack_full'; remainingMs?: number };

/**
 * Harvests a ready Plot: its Materials go to the Backpack and the Plot is empty again. The Plot is left as it
 * was when the Backpack has no room for everything, so nothing is lost.
 */
export function harvestPlotUseCase (
    plotIndex: number,
    garden: Garden,
    backpack: Backpack,
    catalog: ItemCatalog,
    clock: Clock
): HarvestPlotResult
{
    const status = garden.statusOf(plotIndex, clock.now(), growMinutesOf(catalog));
    if (status.state === 'empty') return { success: false, reason: 'empty' };
    if (status.state === 'growing') return { success: false, reason: 'not_ready', remainingMs: status.remainingMs };

    const harvest = catalog.get(status.seedItemId)?.plant?.harvest ?? [];
    for (const drop of harvest)
    {
        if (!backpack.canAddItem(drop.itemId, drop.count)) return { success: false, reason: 'backpack_full' };
    }

    for (const drop of harvest) backpack.addItem(drop.itemId, drop.count);
    garden.clear(plotIndex);

    DomainEvents.emit<PlotHarvestedPayload>(PLOT_HARVESTED_EVENT, { plot: plotIndex, harvest });
    return { success: true, harvest };
}

/** What the Materials for each new Plot cost: `costs[0]` is the 7th Plot, and so on up to the maximum. */
export type ExpansionCosts = readonly (readonly CraftingIngredient[])[];

export type ExpandGardenResult =
    | { success: true; plotCount: number }
    | { success: false; reason: 'fully_grown' | 'insufficient_ingredients' };

/** The cost of the next Plot, or null when the Garden is as big as it gets. */
export function nextPlotCost (garden: Garden, costs: ExpansionCosts): readonly CraftingIngredient[] | null
{
    if (garden.plotCount >= MAX_PLOTS) return null;
    return costs[garden.plotCount - 6] ?? costs[costs.length - 1] ?? [];
}

/** Adds a Plot for Materials (never Credit). Nothing is taken when the Backpack lacks any of them. */
export function expandGardenUseCase (garden: Garden, backpack: Backpack, costs: ExpansionCosts): ExpandGardenResult
{
    const cost = nextPlotCost(garden, costs);
    if (cost === null) return { success: false, reason: 'fully_grown' };
    if (cost.some(ing => backpack.getItemCount(ing.itemId) < ing.count)) return { success: false, reason: 'insufficient_ingredients' };

    for (const ing of cost) backpack.removeItem(ing.itemId, ing.count);
    garden.expand();

    DomainEvents.emit(GARDEN_EXPANDED_EVENT, { plotCount: garden.plotCount });
    return { success: true, plotCount: garden.plotCount };
}
