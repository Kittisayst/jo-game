import { StageProgressionData, StageProgressionPort } from '../../domain/ports';
import { readJson, removeKey, writeJson } from './safeStorage';

const STORAGE_KEY = 'jo_stage_progression_v1';

const DEFAULT_DATA: StageProgressionData = {
    unlockedStages: ['village', 'level-1'],
    completedStages: [],
    questionRewardedStages: [],
};

/**
 * Browser LocalStorage implementation of StageProgressionPort.
 * Lives in infrastructure layer — see CONTEXT.md.
 */
export class LocalStorageStageProgressionRepository implements StageProgressionPort
{
    load (): StageProgressionData
    {
        const parsed = readJson<Partial<StageProgressionData>>(STORAGE_KEY);
        const unlocked = Array.isArray(parsed?.unlockedStages)
            ? Array.from(new Set(['village', 'level-1', ...parsed.unlockedStages]))
            : DEFAULT_DATA.unlockedStages;
        const completed = Array.isArray(parsed?.completedStages)
            ? Array.from(new Set(parsed.completedStages))
            : DEFAULT_DATA.completedStages;

        const rewarded = Array.isArray(parsed?.questionRewardedStages)
            ? Array.from(new Set(parsed.questionRewardedStages))
            : [];

        return {
            unlockedStages: unlocked,
            completedStages: completed,
            questionRewardedStages: rewarded,
        };
    }

    save (data: StageProgressionData): void
    {
        writeJson(STORAGE_KEY, data);
    }

    clear (): void
    {
        removeKey(STORAGE_KEY);
    }
}

export const localStorageStageProgressionRepository = new LocalStorageStageProgressionRepository();
