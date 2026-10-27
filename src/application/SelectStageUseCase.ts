import { DomainEvents } from '../domain/DomainEvents';
import { StageProgression } from '../domain/entities/StageProgression';

export const STAGE_SELECTED_EVENT = 'stage-selected';

export interface StageSelectedPayload
{
    stageId: string;
}

export function selectStageUseCase (
    progression: StageProgression,
    stageId: string
): boolean
{
    if (!progression.isStageUnlocked(stageId))
    {
        return false;
    }

    DomainEvents.emit<StageSelectedPayload>(STAGE_SELECTED_EVENT, {
        stageId,
    });

    return true;
}
