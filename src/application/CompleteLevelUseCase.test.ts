import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { LevelProgress } from '../domain/entities/LevelProgress';
import { completeLevelUseCase, LEVEL_COMPLETE_EVENT } from './CompleteLevelUseCase';

describe('completeLevelUseCase', () =>
{
    it('marks the level progress complete and emits the domain event', () =>
    {
        const progress = new LevelProgress();
        const listener = vi.fn();

        DomainEvents.on(LEVEL_COMPLETE_EVENT, listener);
        completeLevelUseCase(progress);
        DomainEvents.off(LEVEL_COMPLETE_EVENT, listener);

        expect(progress.isComplete).toBe(true);
        expect(listener).toHaveBeenCalledOnce();
    });

    it('does not emit the event again if already complete', () =>
    {
        const progress = new LevelProgress();
        const listener = vi.fn();

        completeLevelUseCase(progress);

        DomainEvents.on(LEVEL_COMPLETE_EVENT, listener);
        completeLevelUseCase(progress);
        DomainEvents.off(LEVEL_COMPLETE_EVENT, listener);

        expect(listener).not.toHaveBeenCalled();
    });
});
