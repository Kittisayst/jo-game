import { Backpack } from '../domain/entities/Backpack';
import { Boss } from '../domain/entities/Boss';
import type { EnemyDrop } from '../domain/entities/Enemy';
import { DropEntry } from './CollectEnemyDropsUseCase';

export interface AwardBossRewardResult
{
    collected: DropEntry[];
    overflow: DropEntry[];
}

/**
 * Gives what the Boss drops (its drop table in `enemies.json`: boss core, crystal and Portal shards) after the
 * finisher question is answered correctly, every time the Boss is beaten.
 */
export function awardBossRewardUseCase (
    backpack: Backpack,
    drops: readonly EnemyDrop[],
    rng: () => number = Math.random
): AwardBossRewardResult
{
    const collected: DropEntry[] = [];
    const overflow: DropEntry[] = [];

    for (const reward of drops)
    {
        if (rng() >= reward.chance) continue;
        const { added, overflow: leftover } = backpack.addItem(reward.itemId, reward.count);
        if (added > 0) collected.push({ itemId: reward.itemId, count: added });
        if (leftover > 0) overflow.push({ itemId: reward.itemId, count: leftover });
    }

    return { collected, overflow };
}

/** A wrong finisher answer brings the Boss back with part of its HP; returns the HP restored. */
export function reviveBossAfterFailedFinisherUseCase (boss: Boss): number
{
    return boss.healAfterFailedFinisher();
}
