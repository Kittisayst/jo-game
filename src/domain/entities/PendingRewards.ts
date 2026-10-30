/**
 * Story Materials a defeated Boss or Mini-boss dropped when the Backpack had no room (Portal shards, boss core,
 * crystal). They wait here, are saved, and move into the Backpack as soon as there is a free slot, so a full
 * Backpack never costs the player something the story needs. Pure rules, see "Material" in CONTEXT.md.
 */

export interface PendingReward
{
    itemId: string;
    count: number;
}

export class PendingRewards
{
    private _counts = new Map<string, number>();

    /** What is waiting, one entry per item. */
    get entries (): PendingReward[]
    {
        return Array.from(this._counts, ([itemId, count]) => ({ itemId, count }));
    }

    get total (): number
    {
        let sum = 0;
        for (const count of this._counts.values()) sum += count;
        return sum;
    }

    get isEmpty (): boolean
    {
        return this._counts.size === 0;
    }

    add (itemId: string, count: number): void
    {
        const whole = Math.floor(count);
        if (!itemId || whole < 1) return;
        this._counts.set(itemId, (this._counts.get(itemId) ?? 0) + whole);
    }

    /** Takes `count` of an item off the waiting list (what the Backpack accepted). */
    remove (itemId: string, count: number): void
    {
        const left = (this._counts.get(itemId) ?? 0) - Math.floor(count);
        if (left > 0) this._counts.set(itemId, left);
        else this._counts.delete(itemId);
    }

    clear (): void
    {
        this._counts.clear();
    }

    /** Replaces the waiting list in place; anything that is not a positive whole count of an item id is dropped. */
    loadFrom (entries: readonly PendingReward[]): void
    {
        this._counts.clear();
        for (const entry of entries) this.add(entry.itemId, entry.count);
    }

    toSnapshot (): PendingReward[]
    {
        return this.entries;
    }
}
