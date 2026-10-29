import { Backpack } from '../domain/entities/Backpack';
import { Enemy } from '../domain/entities/Enemy';

export interface DropEntry
{
    itemId: string;
    count: number;
}

export interface CollectEnemyDropsResult
{
    collected: DropEntry[];
    overflow: DropEntry[];
}

/**
 * Rolls a defeated enemy's drop table and puts the winnings straight into the backpack.
 * Items that do not fit are reported as overflow so the UI can tell the player.
 */
export function collectEnemyDropsUseCase (
    enemy: Enemy,
    backpack: Backpack,
    rng: () => number = Math.random
): CollectEnemyDropsResult
{
    const collected: DropEntry[] = [];
    const overflow: DropEntry[] = [];

    for (const drop of enemy.drops)
    {
        if (rng() >= drop.chance) continue;

        const { added, overflow: leftover } = backpack.addItem(drop.itemId, drop.count);
        if (added > 0) collected.push({ itemId: drop.itemId, count: added });
        if (leftover > 0) overflow.push({ itemId: drop.itemId, count: leftover });
    }

    return { collected, overflow };
}
