import { beforeEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { StageProgression } from '../domain/entities/StageProgression';
import { StageProgressionData, StageProgressionPort } from '../domain/ports';
import {
    completeStageUseCase,
    STAGE_COMPLETED_EVENT,
    STAGE_UNLOCKED_EVENT,
    StageCompletedPayload,
    StageUnlockedPayload,
} from './CompleteStageUseCase';

class MemoryStageProgressionRepository implements StageProgressionPort
{
    data: StageProgressionData = {
        unlockedStages: ['village', 'level-1'],
        completedStages: [],
    };

    load (): StageProgressionData
    {
        return this.data;
    }

    save (data: StageProgressionData): void
    {
        this.data = {
            unlockedStages: [...data.unlockedStages],
            completedStages: [...data.completedStages],
        };
    }

    clear (): void
    {
        this.data = {
            unlockedStages: ['village', 'level-1'],
            completedStages: [],
        };
    }
}

describe('CompleteStageUseCase', () =>
{
    let repo: MemoryStageProgressionRepository;
    let progression: StageProgression;

    beforeEach(() =>
    {
        DomainEvents.clear();
        repo = new MemoryStageProgressionRepository();
        progression = new StageProgression();
    });

    it('completing stage unlocks next level, persists to port, and emits events', () =>
    {
        let completedPayload: StageCompletedPayload | null = null;
        let unlockedPayload: StageUnlockedPayload | null = null;

        DomainEvents.on<StageCompletedPayload>(STAGE_COMPLETED_EVENT, payload =>
        {
            completedPayload = payload;
        });

        DomainEvents.on<StageUnlockedPayload>(STAGE_UNLOCKED_EVENT, payload =>
        {
            unlockedPayload = payload;
        });

        const result = completeStageUseCase(progression, repo, 'level-1', 'level-2');

        expect(result.isFirstTimeClear).toBe(true);
        expect(result.newlyUnlocked).toBe('level-2');

        expect(repo.data.completedStages).toContain('level-1');
        expect(repo.data.unlockedStages).toContain('level-2');

        expect(completedPayload).toEqual({
            stageId: 'level-1',
            isFirstTimeClear: true,
            newlyUnlocked: 'level-2',
        });

        expect(unlockedPayload).toEqual({
            stageId: 'level-2',
        });
    });

    it('re-clearing a stage does not emit STAGE_UNLOCKED_EVENT if already unlocked', () =>
    {
        completeStageUseCase(progression, repo, 'level-1', 'level-2');

        let unlockedEmitted = false;
        DomainEvents.on<StageUnlockedPayload>(STAGE_UNLOCKED_EVENT, () =>
        {
            unlockedEmitted = true;
        });

        const result = completeStageUseCase(progression, repo, 'level-1', 'level-2');

        expect(result.isFirstTimeClear).toBe(false);
        expect(result.newlyUnlocked).toBeNull();
        expect(unlockedEmitted).toBe(false);
    });
});
