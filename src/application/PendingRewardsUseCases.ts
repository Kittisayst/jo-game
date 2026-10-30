import { Backpack } from '../domain/entities/Backpack';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
import { PendingRewards } from '../domain/entities/PendingRewards';
import type { DropEntry } from './CollectEnemyDropsUseCase';

export interface StashResult
{
    /** Story Materials put aside to be claimed later. */
    stashed: DropEntry[];
    /** Other Materials that did not fit and are gone, as before. */
    lost: DropEntry[];
}

/**
 * What did not fit in the Backpack when a Boss or Mini-boss dropped it: story Materials (Portal shards, boss
 * core, crystal) are put aside to claim later, anything else is lost as it always was.
 */
export function stashStoryOverflowUseCase (
    overflow: readonly DropEntry[],
    pending: PendingRewards,
    catalog: ItemCatalog
): StashResult
{
    const stashed: DropEntry[] = [];
    const lost: DropEntry[] = [];

    for (const drop of overflow)
    {
        if (catalog.isStory(drop.itemId))
        {
            pending.add(drop.itemId, drop.count);
            stashed.push({ ...drop });
        }
        else
        {
            lost.push({ ...drop });
        }
    }

    return { stashed, lost };
}

/**
 * Moves waiting story Materials into the Backpack as far as it has room (part of a pile may fit). Returns what
 * moved; nothing happens while the Backpack is still full.
 */
export function claimPendingRewardsUseCase (pending: PendingRewards, backpack: Backpack): DropEntry[]
{
    const claimed: DropEntry[] = [];

    for (const entry of pending.entries)
    {
        const { added } = backpack.addItem(entry.itemId, entry.count);
        if (added > 0)
        {
            pending.remove(entry.itemId, added);
            claimed.push({ itemId: entry.itemId, count: added });
        }
    }

    return claimed;
}
