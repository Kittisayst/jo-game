import { describe, expect, it } from 'vitest';
import { TutorialProgress } from './TutorialProgress';

const steps = [
    { id: 'move', event: 'moved' },
    { id: 'herb', event: 'harvested:wild-herb' },
    { id: 'tree', event: 'harvested:oak-tree' },
];

const makeTutorial = () =>
{
    const tutorial = new TutorialProgress();
    tutorial.setSteps(steps);
    return tutorial;
};

describe('TutorialProgress', () =>
{
    it('starts on the first step', () =>
    {
        const tutorial = makeTutorial();

        expect(tutorial.currentStep?.id).toBe('move');
        expect(tutorial.isActive).toBe(true);
    });

    it('finishes a step when its event happens and moves on to the next', () =>
    {
        const tutorial = makeTutorial();

        expect(tutorial.notify('moved').map(s => s.id)).toEqual(['move']);
        expect(tutorial.currentStep?.id).toBe('herb');
    });

    it('ignores an event no step is waiting for, and one already done', () =>
    {
        const tutorial = makeTutorial();
        tutorial.notify('moved');

        expect(tutorial.notify('enemy-defeated')).toEqual([]);
        expect(tutorial.notify('moved')).toEqual([]);
        expect(tutorial.doneSteps).toEqual(['move']);
    });

    it('counts a step done early, so doing things in another order never leaves one stuck', () =>
    {
        const tutorial = makeTutorial();

        tutorial.notify('harvested:oak-tree');
        expect(tutorial.isDone('tree')).toBe(true);
        expect(tutorial.currentStep?.id).toBe('move');

        tutorial.notify('moved');
        tutorial.notify('harvested:wild-herb');
        expect(tutorial.currentStep).toBeNull();
        expect(tutorial.isActive).toBe(false);
    });

    it('stops showing and counting once the player dismisses it', () =>
    {
        const tutorial = makeTutorial();
        tutorial.dismiss();

        expect(tutorial.currentStep).toBeNull();
        expect(tutorial.isActive).toBe(false);
        expect(tutorial.notify('moved')).toEqual([]);
        expect(tutorial.isDone('move')).toBe(false);
    });

    it('saves and loads what was done, and starts over on reset', () =>
    {
        const tutorial = makeTutorial();
        tutorial.notify('moved');
        tutorial.dismiss();
        const snapshot = tutorial.toSnapshot();
        expect(snapshot).toEqual({ done: ['move'], dismissed: true });

        const loaded = makeTutorial();
        loaded.loadFrom(snapshot);
        expect(loaded.isDone('move')).toBe(true);
        expect(loaded.isDismissed).toBe(true);

        loaded.reset();
        expect(loaded.toSnapshot()).toEqual({ done: [], dismissed: false });
        expect(loaded.currentStep?.id).toBe('move');
    });

    it('has nothing to show before the steps are set', () =>
    {
        const tutorial = new TutorialProgress();

        expect(tutorial.currentStep).toBeNull();
        expect(tutorial.isActive).toBe(false);
    });
});
