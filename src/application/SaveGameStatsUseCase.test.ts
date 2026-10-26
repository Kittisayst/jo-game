import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { GameStats } from '../domain/entities/GameStats';
import {
    recordGameResultUseCase,
    GAME_STATS_UPDATED_EVENT,
    GameStatsUpdatedPayload,
    IGameStatsRepository,
    GameStatsData,
} from './SaveGameStatsUseCase';

class MockGameStatsRepository implements IGameStatsRepository
{
    savedData: GameStatsData = { highScore: 0, bestTimeSeconds: null };

    load (): GameStatsData
    {
        return { ...this.savedData };
    }

    save (data: GameStatsData): void
    {
        this.savedData = { ...data };
    }
}

describe('recordGameResultUseCase', () =>
{
    it('records a new high score, persists, and emits GAME_STATS_UPDATED_EVENT', () =>
    {
        const stats = new GameStats(500, null);
        const repo = new MockGameStatsRepository();
        const listener = vi.fn();

        DomainEvents.on<GameStatsUpdatedPayload>(GAME_STATS_UPDATED_EVENT, listener);

        const result = recordGameResultUseCase(stats, repo, 850, 42.5);

        DomainEvents.off<GameStatsUpdatedPayload>(GAME_STATS_UPDATED_EVENT, listener);

        expect(result.isNewHighScore).toBe(true);
        expect(result.isNewBestTime).toBe(true);
        expect(result.highScore).toBe(850);
        expect(result.bestTimeSeconds).toBe(42.5);

        expect(repo.savedData.highScore).toBe(850);
        expect(repo.savedData.bestTimeSeconds).toBe(42.5);
        expect(listener).toHaveBeenCalledWith(result);
    });

    it('does not flag new records when performance does not exceed previous bests', () =>
    {
        const stats = new GameStats(1000, 30.0);
        const repo = new MockGameStatsRepository();
        const listener = vi.fn();

        DomainEvents.on<GameStatsUpdatedPayload>(GAME_STATS_UPDATED_EVENT, listener);

        const result = recordGameResultUseCase(stats, repo, 800, 45.0);

        DomainEvents.off<GameStatsUpdatedPayload>(GAME_STATS_UPDATED_EVENT, listener);

        expect(result.isNewHighScore).toBe(false);
        expect(result.isNewBestTime).toBe(false);
        expect(result.highScore).toBe(1000);
        expect(result.bestTimeSeconds).toBe(30.0);
        expect(repo.savedData.highScore).toBe(1000);
    });

    it('handles recording score without passing time', () =>
    {
        const stats = new GameStats(200, 25.0);
        const repo = new MockGameStatsRepository();

        const result = recordGameResultUseCase(stats, repo, 350);

        expect(result.isNewHighScore).toBe(true);
        expect(result.isNewBestTime).toBe(false);
        expect(result.highScore).toBe(350);
        expect(result.bestTimeSeconds).toBe(25.0);
    });
});
