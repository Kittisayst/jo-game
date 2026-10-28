import { describe, expect, it } from 'vitest';
import { AchievementManager } from '../domain/entities/Achievement';
import { Wallet } from '../domain/entities/Wallet';
import { claimAchievementRewardUseCase } from './ClaimAchievementRewardUseCase';

describe('claimAchievementRewardUseCase', () =>
{
    it('claims reward for unlocked achievement and deposits coins', () =>
    {
        const manager = new AchievementManager();
        const wallet = new Wallet(20);

        // Not unlocked yet
        const failedClaim = claimAchievementRewardUseCase(manager, wallet, 'first-blood');
        expect(failedClaim.success).toBe(false);
        expect(wallet.balance).toBe(20);

        // Unlock
        manager.recordProgress('first-blood', 1);

        // Claim
        const claim = claimAchievementRewardUseCase(manager, wallet, 'first-blood');
        expect(claim.success).toBe(true);
        expect(claim.rewardCoins).toBe(50);
        expect(claim.newBalance).toBe(70);
        expect(wallet.balance).toBe(70);
    });
});
