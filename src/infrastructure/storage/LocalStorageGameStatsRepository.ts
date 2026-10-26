import {
    IGameStatsRepository,
    GameStatsData,
} from '../../application/SaveGameStatsUseCase';

const STORAGE_KEY = 'jo_game_stats_v1';

/**
 * Browser LocalStorage implementation of IGameStatsRepository.
 * Handles graceful fallbacks in non-browser or storage-restricted environments.
 * Lives in infrastructure layer — see CONTEXT.md.
 */
export class LocalStorageGameStatsRepository implements IGameStatsRepository
{
    load (): GameStatsData
    {
        const defaultData: GameStatsData = {
            highScore: 0,
            bestTimeSeconds: null,
        };

        if (typeof window === 'undefined' || !window.localStorage)
        {
            return defaultData;
        }

        try
        {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return defaultData;

            const parsed = JSON.parse(raw);
            return {
                highScore: typeof parsed.highScore === 'number' ? Math.max(0, parsed.highScore) : 0,
                bestTimeSeconds:
                    typeof parsed.bestTimeSeconds === 'number' && parsed.bestTimeSeconds > 0
                        ? parsed.bestTimeSeconds
                        : null,
            };
        }
        catch
        {
            return defaultData;
        }
    }

    save (data: GameStatsData): void
    {
        if (typeof window === 'undefined' || !window.localStorage)
        {
            return;
        }

        try
        {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
        catch
        {
            // Ignore quota or private-browsing storage errors gracefully
        }
    }
}

export const localStorageGameStatsRepository = new LocalStorageGameStatsRepository();
