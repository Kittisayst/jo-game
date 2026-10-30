import { DomainEvents } from '../domain/DomainEvents';
import { StageProgression } from '../domain/entities/StageProgression';
import { StageProgressionPort } from '../domain/ports';

export const STAGE_COMPLETED_EVENT = 'stage-completed';
export const STAGE_UNLOCKED_EVENT = 'stage-unlocked';

export interface StageCompletedPayload
{
    stageId: string;
    isFirstTimeClear: boolean;
    newlyUnlocked: string | null;
}

export interface StageUnlockedPayload
{
    stageId: string;
}

export function completeStageUseCase (
    progression: StageProgression,
    port: StageProgressionPort,
    stageId: string,
    nextStageId?: string | null
): {
    isFirstTimeClear: boolean;
    newlyUnlocked: string | null;
}
{
    const result = progression.completeStage(stageId, nextStageId);

    port.save({
        unlockedStages: progression.unlockedStages,
        completedStages: progression.completedStages,
        questionRewardedStages: progression.questionRewardedStages,
    });

    DomainEvents.emit<StageCompletedPayload>(STAGE_COMPLETED_EVENT, {
        stageId,
        isFirstTimeClear: result.isFirstTimeClear,
        newlyUnlocked: result.newlyUnlocked,
    });

    if (result.newlyUnlocked)
    {
        DomainEvents.emit<StageUnlockedPayload>(STAGE_UNLOCKED_EVENT, {
            stageId: result.newlyUnlocked,
        });
    }

    return result;
}
