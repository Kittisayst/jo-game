import { DomainEvents } from '../domain/DomainEvents';
import { TutorialProgress } from '../domain/entities/TutorialProgress';

export const TUTORIAL_CHANGED_EVENT = 'tutorial-changed';

export interface TutorialChangedPayload
{
    /** Ids of the steps this event finished. */
    finished: string[];
    /** The step to show now, or null when there is none left. */
    currentStepId: string | null;
}

/**
 * Tells the tutorial that something happened in the game. Announces a change only when a step was
 * finished. Returns the ids of the finished steps (empty when the event meant nothing to it).
 */
export function notifyTutorialUseCase (tutorial: TutorialProgress, event: string): string[]
{
    const finished = tutorial.notify(event).map(step => step.id);

    if (finished.length > 0)
    {
        DomainEvents.emit<TutorialChangedPayload>(TUTORIAL_CHANGED_EVENT, {
            finished,
            currentStepId: tutorial.currentStep?.id ?? null,
        });
    }

    return finished;
}

/** The player skips the hints. Announces the change so the hint disappears. */
export function dismissTutorialUseCase (tutorial: TutorialProgress): void
{
    tutorial.dismiss();
    DomainEvents.emit<TutorialChangedPayload>(TUTORIAL_CHANGED_EVENT, { finished: [], currentStepId: null });
}
