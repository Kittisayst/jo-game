import { afterEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { TutorialProgress } from '../domain/entities/TutorialProgress';
import {
    dismissTutorialUseCase, notifyTutorialUseCase, TUTORIAL_CHANGED_EVENT, TutorialChangedPayload,
} from './NotifyTutorialUseCase';

const heard: TutorialChangedPayload[] = [];
const listener = (payload: TutorialChangedPayload) => heard.push(payload);
DomainEvents.on(TUTORIAL_CHANGED_EVENT, listener);

const makeTutorial = () =>
{
    const tutorial = new TutorialProgress();
    tutorial.setSteps([{ id: 'move', event: 'moved' }, { id: 'herb', event: 'harvested:wild-herb' }]);
    return tutorial;
};

describe('notifyTutorialUseCase', () =>
{
    afterEach(() => { heard.length = 0; });

    it('finishes the step and announces the next one', () =>
    {
        const tutorial = makeTutorial();

        expect(notifyTutorialUseCase(tutorial, 'moved')).toEqual(['move']);
        expect(heard).toEqual([{ finished: ['move'], currentStepId: 'herb' }]);
    });

    it('announces nothing when the event means nothing to the tutorial', () =>
    {
        const tutorial = makeTutorial();

        expect(notifyTutorialUseCase(tutorial, 'enemy-defeated')).toEqual([]);
        expect(heard).toEqual([]);
    });

    it('announces no next step after the last one', () =>
    {
        const tutorial = makeTutorial();
        notifyTutorialUseCase(tutorial, 'moved');
        notifyTutorialUseCase(tutorial, 'harvested:wild-herb');

        expect(heard[1]).toEqual({ finished: ['herb'], currentStepId: null });
    });

    it('announces a dismissal so the hint can disappear', () =>
    {
        const tutorial = makeTutorial();
        dismissTutorialUseCase(tutorial);

        expect(tutorial.isDismissed).toBe(true);
        expect(heard).toEqual([{ finished: [], currentStepId: null }]);
    });
});
