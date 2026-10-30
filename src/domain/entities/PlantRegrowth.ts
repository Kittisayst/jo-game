/**
 * When each small plant of a Stage was last harvested, so it can stay a Sapling until enough real time has
 * passed, even while the game is closed. A plant is told apart by its Stage and its node id. Pure rules, the time
 * comes from a Clock; see "Regrow" and "Sapling" in CONTEXT.md.
 */

const MS_PER_MINUTE = 60_000;

export class PlantRegrowth
{
    private _harvestedAt = new Map<string, number>();

    /** The key of one plant: Stage id plus node id (both are stable, a generated Stage always has the same nodes). */
    static keyOf (stageId: string, nodeId: string): string
    {
        return `${stageId}:${nodeId}`;
    }

    markHarvested (key: string, atMs: number): void
    {
        this._harvestedAt.set(key, atMs);
    }

    harvestedAt (key: string): number | undefined
    {
        return this._harvestedAt.get(key);
    }

    /** Milliseconds until the plant is grown again; 0 when it is grown (or was never harvested). */
    remainingMs (key: string, nowMs: number, regrowMinutes: number): number
    {
        const at = this._harvestedAt.get(key);
        if (at === undefined) return 0;
        return Math.max(0, at + regrowMinutes * MS_PER_MINUTE - nowMs);
    }

    isGrown (key: string, nowMs: number, regrowMinutes: number): boolean
    {
        return this.remainingMs(key, nowMs, regrowMinutes) === 0;
    }

    /** Forgets the plant: it is whole again. */
    clear (key: string): void
    {
        this._harvestedAt.delete(key);
    }

    reset (): void
    {
        this._harvestedAt.clear();
    }

    /** Replaces the records in place; anything that is not a finite time is dropped. */
    loadFrom (records: Readonly<Record<string, number>>): void
    {
        this._harvestedAt.clear();
        for (const [key, at] of Object.entries(records))
        {
            if (typeof at === 'number' && Number.isFinite(at)) this._harvestedAt.set(key, at);
        }
    }

    toSnapshot (): Record<string, number>
    {
        return Object.fromEntries(this._harvestedAt);
    }
}
