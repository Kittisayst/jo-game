import { Backpack } from '../domain/entities/Backpack';
import { Boss, BOSS_FINISHER_REWARD } from '../domain/entities/Boss';
import { DropEntry } from './CollectEnemyDropsUseCase';

export interface AwardBossRewardResult
{
    collected: DropEntry[];
    overflow: DropEntry[];
}

/** Gives the Boss's story Materials after the finisher question is answered correctly. */
export function awardBossRewardUseCase (backpack: Backpack): AwardBossRewardResult
{
    const collected: DropEntry[] = [];
    const overflow: DropEntry[] = [];

    for (const reward of BOSS_FINISHER_REWARD)
    {
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
