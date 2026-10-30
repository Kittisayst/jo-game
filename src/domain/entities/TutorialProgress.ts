/**
 * Progress through the hints of the first Stage ("Tutorial step" in CONTEXT.md). The steps are data
 * (`tutorial.json`): each has an id and the event that finishes it. Pure rules, no Phaser or React.
 */

export interface TutorialStep
{
    id: string;
    /** The thing the player has to do, such as `harvested:oak-tree` (see `TUTORIAL_EVENTS`). */
    event: string;
}

export interface TutorialSnapshot
{
    done: string[];
    dismissed: boolean;
}

export class TutorialProgress
{
    private _steps: readonly TutorialStep[] = [];
    private _done = new Set<string>();
    private _dismissed = false;

    /** Gives the steps once the game data is loaded. What was done stays done. */
    setSteps (steps: readonly TutorialStep[]): void
    {
        this._steps = steps;
    }

    get steps (): readonly TutorialStep[]
    {
        return this._steps;
    }

    get doneSteps (): string[]
    {
        return Array.from(this._done);
    }

    get isDismissed (): boolean
    {
        return this._dismissed;
    }

    isDone (stepId: string): boolean
    {
        return this._done.has(stepId);
    }

    /** True while there is a hint to show: not dismissed and not every step done. */
    get isActive (): boolean
    {
        return !this._dismissed && this.currentStep !== null;
    }

    /** The first step not done yet, or null when the player has done them all (or skipped the lesson). */
    get currentStep (): TutorialStep | null
    {
        if (this._dismissed) return null;
        return this._steps.find(step => !this._done.has(step.id)) ?? null;
    }

    /**
     * Something happened in the game. Every step waiting for that event is done, not only the current one,
     * so doing things in another order than the hints suggest never leaves a step stuck. Returns the steps
     * that were just finished.
     */
    notify (event: string): TutorialStep[]
    {
        if (this._dismissed) return [];

        const finished = this._steps.filter(step => step.event === event && !this._done.has(step.id));
        for (const step of finished) this._done.add(step.id);
        return finished;
    }

    /** The player does not want the hints. */
    dismiss (): void
    {
        this._dismissed = true;
    }

    reset (): void
    {
        this._done = new Set();
        this._dismissed = false;
    }

    loadFrom (snapshot: TutorialSnapshot): void
    {
        this._done = new Set(snapshot.done);
        this._dismissed = snapshot.dismissed;
    }

    toSnapshot (): TutorialSnapshot
    {
        return { done: this.doneSteps, dismissed: this._dismissed };
    }
}
