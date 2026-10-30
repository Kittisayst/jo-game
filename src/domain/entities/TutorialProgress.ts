/**
 * Progress through the hints of the first Stage ("Tutorial step" in CONTEXT.md). The steps are data
 * (`tutorial.json`): each has an id and the event that finishes it. Pure rules, no Phaser or React.
 */

export interface TutorialStep
{
    id: string;
    /** The thing the player has to do, such as `harvested:oak-tree` (see `TUTORIAL_EVENTS`). */
    event: string;
    /** When set, the hint stays hidden until this event has happened (a hint about something that is not met at the start). */
    showAfter?: string;
}

export interface TutorialSnapshot
{
    done: string[];
    dismissed: boolean;
    /** The events that unlocked a hidden hint (`showAfter`). Missing in older saves. */
    triggered?: string[];
}

export class TutorialProgress
{
    private _steps: readonly TutorialStep[] = [];
    private _done = new Set<string>();
    private _dismissed = false;
    private _triggered = new Set<string>();

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
        return this._steps.find(step => !this._done.has(step.id) && (!step.showAfter || this._triggered.has(step.showAfter))) ?? null;
    }

    /**
     * Something happened in the game. Every step waiting for that event is done, not only the current one,
     * so doing things in another order than the hints suggest never leaves a step stuck. Returns the steps
     * that were just finished.
     */
    notify (event: string): TutorialStep[]
    {
        if (this._dismissed) return [];

        // Remember the events that reveal a hidden hint
        if (this._steps.some(step => step.showAfter === event)) this._triggered.add(event);

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
        this._triggered = new Set();
    }

    loadFrom (snapshot: TutorialSnapshot): void
    {
        this._done = new Set(snapshot.done);
        this._dismissed = snapshot.dismissed;
        this._triggered = new Set(snapshot.triggered ?? []);
    }

    toSnapshot (): TutorialSnapshot
    {
        return { done: this.doneSteps, dismissed: this._dismissed, triggered: Array.from(this._triggered) };
    }
}
