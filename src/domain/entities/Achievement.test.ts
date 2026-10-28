import { beforeEach, describe, expect, it } from 'vitest';
import { AchievementManager, ACHIEVEMENT_UNLOCKED_EVENT, AchievementUnlockedPayload } from './Achievement';
import { Wallet } from './Wallet';
import { DomainEvents } from '../DomainEvents';

describe('AchievementManager domain entity', () =>
{
    let manager: AchievementManager;
    let wallet: Wallet;

    beforeEach(() =>
    {
        manager = new AchievementManager();
        wallet = new Wallet(0);
    });

    it('initializes with default achievement progress for all catalog items', () =>
    {
        const achievements = manager.getAllAchievements();
        expect(achievements.length).toBeGreaterThanOrEqual(10);
        expect(manager.unclaimedCount).toBe(0);

        const firstBlood = manager.getProgress('first-blood');
        expect(firstBlood.progress).toBe(0);
        expect(firstBlood.unlocked).toBe(false);
        expect(firstBlood.claimed).toBe(false);
    });

    it('increments progress and emits event when unlocked', () =>
    {
        let emittedPayload: AchievementUnlockedPayload | null = null;
        const listener = (payload: AchievementUnlockedPayload) =>
        {
            emittedPayload = payload;
        };
        DomainEvents.on<AchievementUnlockedPayload>(ACHIEVEMENT_UNLOCKED_EVENT, listener);

        const res1 = manager.recordProgress('first-blood', 1);
        expect(res1?.justUnlocked).toBe(true);
        expect(res1?.achievement.id).toBe('first-blood');
        expect(emittedPayload).not.toBeNull();
        expect((emittedPayload as AchievementUnlockedPayload | null)?.rewardCoins).toBe(50);

        const firstBlood = manager.getProgress('first-blood');
        expect(firstBlood.unlocked).toBe(true);
        expect(firstBlood.claimed).toBe(false);
        expect(manager.unclaimedCount).toBe(1);

        DomainEvents.off(ACHIEVEMENT_UNLOCKED_EVENT, listener);
    });

    it('does not re-unlock or double emit if progress exceeds target', () =>
    {
        let emitCount = 0;
        const listener = () =>
        {
            emitCount++;
        };
        DomainEvents.on(ACHIEVEMENT_UNLOCKED_EVENT, listener);

        manager.recordProgress('first-blood', 1);
        expect(emitCount).toBe(1);

        const res2 = manager.recordProgress('first-blood', 1);
        expect(res2).toBeNull();
        expect(emitCount).toBe(1);

        DomainEvents.off(ACHIEVEMENT_UNLOCKED_EVENT, listener);
    });

    it('supports multi-step achievements and absolute values', () =>
    {
        // Slime slayer needs 15 kills
        manager.recordProgress('slime-slayer', 5);
        expect(manager.getProgress('slime-slayer').unlocked).toBe(false);
        expect(manager.getProgress('slime-slayer').progress).toBe(5);

        manager.recordProgress('slime-slayer', 10);
        expect(manager.getProgress('slime-slayer').unlocked).toBe(true);
        expect(manager.getProgress('slime-slayer').progress).toBe(15);
    });

    it('claims reward and deposits coins into wallet', () =>
    {
        manager.recordProgress('first-blood', 1);
        expect(manager.unclaimedCount).toBe(1);
        expect(wallet.balance).toBe(0);

        const claimRes = manager.claimReward('first-blood', wallet);
        expect(claimRes.success).toBe(true);
        expect(claimRes.rewardCoins).toBe(50);
        expect(wallet.balance).toBe(50);
        expect(manager.unclaimedCount).toBe(0);
        expect(manager.getProgress('first-blood').claimed).toBe(true);

        // Cannot claim twice
        const secondClaim = manager.claimReward('first-blood', wallet);
        expect(secondClaim.success).toBe(false);
        expect(wallet.balance).toBe(50);
    });

    it('cannot claim reward if not unlocked', () =>
    {
        const claimRes = manager.claimReward('boss-slayer', wallet);
        expect(claimRes.success).toBe(false);
        expect(wallet.balance).toBe(0);
    });

    it('serializes and deserializes correctly', () =>
    {
        manager.recordProgress('first-blood', 1);
        manager.claimReward('first-blood', wallet);
        manager.recordProgress('slime-slayer', 7);

        const snapshot = manager.serialize();
        const restored = new AchievementManager(snapshot);

        expect(restored.getProgress('first-blood').unlocked).toBe(true);
        expect(restored.getProgress('first-blood').claimed).toBe(true);
        expect(restored.getProgress('slime-slayer').progress).toBe(7);
        expect(restored.getProgress('slime-slayer').unlocked).toBe(false);
    });
});
