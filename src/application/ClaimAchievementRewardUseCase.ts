import { AchievementManager } from '../domain/entities/Achievement';
import { Wallet } from '../domain/entities/Wallet';

export interface ClaimRewardResult
{
    success: boolean;
    rewardCoins: number;
    newBalance: number;
}

/**
 * Claims the reward for an unlocked achievement and credits coins to the player wallet.
 */
export function claimAchievementRewardUseCase (
    manager: AchievementManager,
    wallet: Wallet,
    achievementId: string
): ClaimRewardResult
{
    const res = manager.claimReward(achievementId, wallet);
    return {
        success: res.success,
        rewardCoins: res.rewardCoins,
        newBalance: wallet.balance,
    };
}
