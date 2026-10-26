import { describe, expect, it } from 'vitest';
import { GameStats } from './GameStats';

describe('GameStats entity', () =>
{
    it('initializes with default values', () =>
    {
        const stats = new GameStats();
        expect(stats.highScore).toBe(0);
        expect(stats.bestTimeSeconds).toBeNull();
    });

    it('initializes with custom initial values', () =>
    {
        const stats = new GameStats(1500, 45.2);
        expect(stats.highScore).toBe(1500);
        expect(stats.bestTimeSeconds).toBe(45.2);
    });

    it('records a new high score when score is higher', () =>
    {
        const stats = new GameStats(500);
        const result = stats.recordScore(800);

        expect(result.isNewHighScore).toBe(true);
        expect(result.highScore).toBe(800);
        expect(stats.highScore).toBe(800);
    });

    it('does not record a new high score when score is lower or equal', () =>
    {
        const stats = new GameStats(1000);
        const result = stats.recordScore(600);

        expect(result.isNewHighScore).toBe(false);
        expect(result.highScore).toBe(1000);
        expect(stats.highScore).toBe(1000);
    });

    it('records a new best time when initial best time was null', () =>
    {
        const stats = new GameStats();
        const result = stats.recordTime(55.4);

        expect(result.isNewBestTime).toBe(true);
        expect(result.bestTime).toBe(55.4);
        expect(stats.bestTimeSeconds).toBe(55.4);
    });

    it('records a new best time when faster than previous record', () =>
    {
        const stats = new GameStats(0, 60.0);
        const result = stats.recordTime(48.2);

        expect(result.isNewBestTime).toBe(true);
        expect(result.bestTime).toBe(48.2);
        expect(stats.bestTimeSeconds).toBe(48.2);
    });

    it('does not record a new best time when slower than previous record', () =>
    {
        const stats = new GameStats(0, 45.0);
        const result = stats.recordTime(52.8);

        expect(result.isNewBestTime).toBe(false);
        expect(result.bestTime).toBe(45.0);
        expect(stats.bestTimeSeconds).toBe(45.0);
    });

    it('resets all stats', () =>
    {
        const stats = new GameStats(1200, 30.5);
        stats.reset();

        expect(stats.highScore).toBe(0);
        expect(stats.bestTimeSeconds).toBeNull();
    });
});
