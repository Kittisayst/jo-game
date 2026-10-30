/**
 * The one thing being made at the Workshop or the Forge: a recipe with a build time. Only one job runs at a
 * time. The time is Game time: it counts down while the game is being played (the scene ticks it), not while
 * the game is closed or paused. Pure rules; see "Crafting job" in CONTEXT.md.
 */

export interface CraftingJob
{
    recipeId: string;
    resultItemId: string;
    resultCount: number;
    totalMs: number;
    remainingMs: number;
}

export type CraftingJobSnapshot = CraftingJob;

export class CraftingQueue
{
    private _job: CraftingJob | null = null;

    /** The job in progress or waiting to be collected, or null. */
    get job (): CraftingJob | null
    {
        return this._job ? { ...this._job } : null;
    }

    get isBusy (): boolean
    {
        return this._job !== null;
    }

    /** True when the job has finished and its result waits to be collected. */
    get isReady (): boolean
    {
        return this._job !== null && this._job.remainingMs <= 0;
    }

    /** Starts a job. Returns false when one is already there (running or waiting to be collected). */
    start (recipeId: string, resultItemId: string, resultCount: number, totalMs: number): boolean
    {
        if (this._job) return false;
        this._job = { recipeId, resultItemId, resultCount, totalMs, remainingMs: totalMs };
        return true;
    }

    /** Moves the running job forward by `deltaMs` of Game time. */
    tick (deltaMs: number): void
    {
        if (!this._job || this._job.remainingMs <= 0 || !(deltaMs > 0)) return;
        this._job.remainingMs = Math.max(0, this._job.remainingMs - deltaMs);
    }

    /** Takes the finished job out of the queue; null when nothing is ready. */
    collect (): CraftingJob | null
    {
        if (!this.isReady) return null;
        const job = this._job;
        this._job = null;
        return job;
    }

    toSnapshot (): CraftingJobSnapshot | null
    {
        return this._job ? { ...this._job } : null;
    }

    loadFrom (snapshot: CraftingJobSnapshot | null | undefined): void
    {
        this._job = snapshot ? { ...snapshot } : null;
    }
}
