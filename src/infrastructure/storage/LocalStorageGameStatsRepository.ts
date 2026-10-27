import { GameStatsData, GameStatsPort } from '../../domain/ports';
import { readJson, removeKey, writeJson } from './safeStorage';

const STORAGE_KEY = 'jo_game_stats_v1';

/**
 * Browser LocalStorage implementation of GameStatsPort.
 * Lives in infrastructure layer — see CONTEXT.md.
 */
export class LocalStorageGameStatsRepository implements GameStatsPort
{
    load (): GameStatsData
    {
        const parsed = readJson<Partial<GameStatsData>>(STORAGE_KEY);
        return {
            highScore: typeof parsed?.highScore === 'number' ? Math.max(0, parsed.highScore) : 0,
            bestTimeSeconds:
                typeof parsed?.bestTimeSeconds === 'number' && parsed.bestTimeSeconds > 0
                    ? parsed.bestTimeSeconds
                    : null,
        };
    }

    save (data: GameStatsData): void
    {
        writeJson(STORAGE_KEY, data);
    }

    clear (): void
    {
        removeKey(STORAGE_KEY);
    }
}

export const localStorageGameStatsRepository = new LocalStorageGameStatsRepository();
