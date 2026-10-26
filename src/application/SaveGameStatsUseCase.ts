import { DomainEvents } from '../domain/DomainEvents';
import { GameStats } from '../domain/entities/GameStats';

export interface GameStatsData
{
    highScore: number;
    bestTimeSeconds: number | null;
}

export interface IGameStatsRepository
{
    load(): GameStatsData;
    save(data: GameStatsData): void;
}

export const GAME_STATS_UPDATED_EVENT = 'game-stats-updated';

export interface GameStatsUpdatedPayload
{
    highScore: number;
    bestTimeSeconds: number | null;
    isNewHighScore: boolean;
    isNewBestTime: boolean;
}

/**
 * Use case executed when a level or run completes, or game over occurs.
 * Evaluates records against current stats, persists via repository, and emits event.
 * See "Application layer" in CONTEXT.md.
 */
export function recordGameResultUseCase (
    gameStats: GameStats,
    repository: IGameStatsRepository,
    currentScore: number,
    currentTimeSeconds?: number
): GameStatsUpdatedPayload
{
    const scoreResult = gameStats.recordScore(currentScore);
    let isNewBestTime = false;

    if (typeof currentTimeSeconds === 'number' && currentTimeSeconds > 0)
    {
        const timeResult = gameStats.recordTime(currentTimeSeconds);
        isNewBestTime = timeResult.isNewBestTime;
    }

    repository.save({
        highScore: gameStats.highScore,
        bestTimeSeconds: gameStats.bestTimeSeconds,
    });

    const payload: GameStatsUpdatedPayload = {
        highScore: gameStats.highScore,
        bestTimeSeconds: gameStats.bestTimeSeconds,
        isNewHighScore: scoreResult.isNewHighScore,
        isNewBestTime,
    };

    DomainEvents.emit<GameStatsUpdatedPayload>(GAME_STATS_UPDATED_EVENT, payload);

    return payload;
}
