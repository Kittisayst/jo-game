import { DomainEvents } from '../domain/DomainEvents';
import { LevelProgress } from '../domain/entities/LevelProgress';

export const LEVEL_COMPLETE_EVENT = 'level-complete';

export interface LevelCompletePayload
{
    levelId: string;
    nextLevel: string | null;
}

/**
 * Marks the level complete and emits the domain event, exactly once.
 * Infrastructure calls this after detecting (spatially) that the player
 * reached the finish line — see "LevelProgress" in CONTEXT.md.
 */
export function completeLevelUseCase (progress: LevelProgress)
{
    if (progress.isComplete) return;

    progress.complete();

    DomainEvents.emit<LevelCompletePayload>(LEVEL_COMPLETE_EVENT, {
        levelId: progress.levelId,
        nextLevel: progress.nextLevel,
    });
}
