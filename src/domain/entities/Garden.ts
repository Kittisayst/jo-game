/**
 * The Garden: Plots in the Village Hub where Seeds are planted. No watering: plant, wait real time, harvest.
 * A Plot is empty, growing or ready. Pure rules, the time comes from a Clock; see "Garden" and "Plot" in
 * CONTEXT.md and ADR 0007.
 */

export const STARTING_PLOTS = 6;
export const MAX_PLOTS = 12;

const MS_PER_MINUTE = 60_000;

export interface PlantedPlot
{
    seedItemId: string;
    plantedAtMs: number;
}

export type PlotStatus =
    | { state: 'empty' }
    | { state: 'growing'; seedItemId: string; remainingMs: number }
    | { state: 'ready'; seedItemId: string };

export interface GardenSnapshot
{
    plotCount: number;
    plots: (PlantedPlot | null)[];
}

export class Garden
{
    private _plotCount = STARTING_PLOTS;
    private _plots: (PlantedPlot | null)[] = new Array(STARTING_PLOTS).fill(null);

    get plotCount (): number
    {
        return this._plotCount;
    }

    /** True when something is planted, growing or ready. */
    get hasPlants (): boolean
    {
        return this._plots.some(plot => plot !== null);
    }

    /** What is in a Plot, or null when it is empty or the number is not a Plot. */
    plotAt (index: number): PlantedPlot | null
    {
        const plot = index >= 0 && index < this._plotCount ? this._plots[index] : null;
        return plot ? { ...plot } : null;
    }

    /** Puts a Seed in an empty Plot. Returns false when the Plot is taken or does not exist. */
    plant (index: number, seedItemId: string, atMs: number): boolean
    {
        if (!Number.isInteger(index) || index < 0 || index >= this._plotCount || this._plots[index] !== null) return false;
        this._plots[index] = { seedItemId, plantedAtMs: atMs };
        return true;
    }

    /** Empties a Plot (after its harvest) and returns what was in it. */
    clear (index: number): PlantedPlot | null
    {
        const plot = this.plotAt(index);
        if (plot) this._plots[index] = null;
        return plot;
    }

    /**
     * How a Plot stands now. `minutesOf` says how long a Seed takes to grow; a Seed it does not know is treated as
     * ready at once, so a changed content file never leaves a Plot stuck.
     */
    statusOf (index: number, nowMs: number, minutesOf: (seedItemId: string) => number | undefined): PlotStatus
    {
        const plot = this._plots[index];
        if (index < 0 || index >= this._plotCount || !plot) return { state: 'empty' };

        const minutes = minutesOf(plot.seedItemId) ?? 0;
        const remainingMs = Math.max(0, plot.plantedAtMs + minutes * MS_PER_MINUTE - nowMs);
        return remainingMs > 0
            ? { state: 'growing', seedItemId: plot.seedItemId, remainingMs }
            : { state: 'ready', seedItemId: plot.seedItemId };
    }

    /** How many Plots are ready to harvest. */
    readyCount (nowMs: number, minutesOf: (seedItemId: string) => number | undefined): number
    {
        let ready = 0;
        for (let i = 0; i < this._plotCount; i++)
        {
            if (this.statusOf(i, nowMs, minutesOf).state === 'ready') ready++;
        }
        return ready;
    }

    /** Adds one more Plot, up to the maximum. Returns false when the Garden is as big as it gets. */
    expand (): boolean
    {
        if (this._plotCount >= MAX_PLOTS) return false;
        this._plotCount++;
        this._plots.push(null);
        return true;
    }

    reset (): void
    {
        this._plotCount = STARTING_PLOTS;
        this._plots = new Array(STARTING_PLOTS).fill(null);
    }

    /** Replaces the Garden in place with a saved one; a Plot count outside the limits and broken Plots are repaired. */
    loadFrom (snapshot: GardenSnapshot): void
    {
        const count = Math.min(MAX_PLOTS, Math.max(STARTING_PLOTS, Math.floor(snapshot.plotCount)));
        this._plotCount = Number.isFinite(count) ? count : STARTING_PLOTS;
        this._plots = Array.from({ length: this._plotCount }, (_, i) =>
        {
            const plot = snapshot.plots[i];
            return plot && typeof plot.seedItemId === 'string' && plot.seedItemId.length > 0 && Number.isFinite(plot.plantedAtMs)
                ? { seedItemId: plot.seedItemId, plantedAtMs: plot.plantedAtMs }
                : null;
        });
    }

    toSnapshot (): GardenSnapshot
    {
        return { plotCount: this._plotCount, plots: this._plots.map(plot => (plot ? { ...plot } : null)) };
    }
}
