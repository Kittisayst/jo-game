import { DomainEvents } from '../domain/DomainEvents';
import { GameStats } from '../domain/entities/GameStats';
import { GameStatsData, GameStatsPort } from '../domain/ports';

/** @deprecated Import from `domain/ports` instead. Kept as aliases for existing callers. */
export type { GameStatsData };
/** @deprecated Use `GameStatsPort` from `domain/ports`. */
export type IGameStatsRepository = GameStatsPort;

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
    repository: GameStatsPort,
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
