import { AchievementManager } from '../domain/entities/Achievement';

/**
 * Records progress towards an achievement, triggering an unlock event if target reached.
 */
export function trackAchievementUseCase (
    manager: AchievementManager,
    achievementId: string,
    amount = 1,
    isAbsolute = false
): boolean
{
    const res = manager.recordProgress(achievementId, amount, isAbsolute);
    return res !== null && res.justUnlocked;
}
