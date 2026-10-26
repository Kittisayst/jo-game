import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { LevelProgress } from '../domain/entities/LevelProgress';
import {
    completeLevelUseCase,
    LEVEL_COMPLETE_EVENT,
    LevelCompletePayload,
} from './CompleteLevelUseCase';

describe('completeLevelUseCase', () =>
{
    it('marks the level progress complete and emits the domain event with levelId and nextLevel', () =>
    {
        const progress = new LevelProgress('level-1', 'level-2');
        const listener = vi.fn();

        DomainEvents.on<LevelCompletePayload>(LEVEL_COMPLETE_EVENT, listener);
        completeLevelUseCase(progress);
        DomainEvents.off<LevelCompletePayload>(LEVEL_COMPLETE_EVENT, listener);

        expect(progress.isComplete).toBe(true);
        expect(listener).toHaveBeenCalledWith({ levelId: 'level-1', nextLevel: 'level-2' });
    });

    it('does not emit the event again if already complete', () =>
    {
        const progress = new LevelProgress('level-2', null);
        const listener = vi.fn();

        completeLevelUseCase(progress);

        DomainEvents.on<LevelCompletePayload>(LEVEL_COMPLETE_EVENT, listener);
        completeLevelUseCase(progress);
        DomainEvents.off<LevelCompletePayload>(LEVEL_COMPLETE_EVENT, listener);

        expect(listener).not.toHaveBeenCalled();
    });
});
