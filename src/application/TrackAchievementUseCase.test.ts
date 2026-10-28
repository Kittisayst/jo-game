import { describe, expect, it } from 'vitest';
import { AchievementManager } from '../domain/entities/Achievement';
import { trackAchievementUseCase } from './TrackAchievementUseCase';

describe('trackAchievementUseCase', () =>
{
    it('records progress and returns true when unlocked', () =>
    {
        const manager = new AchievementManager();
        const unlocked = trackAchievementUseCase(manager, 'first-blood', 1);
        expect(unlocked).toBe(true);
        expect(manager.getProgress('first-blood').unlocked).toBe(true);

        const doubleTrack = trackAchievementUseCase(manager, 'first-blood', 1);
        expect(doubleTrack).toBe(false);
    });
});
