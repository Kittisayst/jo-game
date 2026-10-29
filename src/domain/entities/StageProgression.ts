/**
 * Domain entity managing stage/level unlocking and completion progression.
 * Pure business rules — see "Domain layer" in CONTEXT.md.
 */
/** Stages the player can always enter. Chapter 1 has no earlier stage to unlock it, so it starts open. */
export const ALWAYS_UNLOCKED_STAGES = ['village', 'stage-ch1'];

export class StageProgression
{
    private _unlockedStages: Set<string>;
    private _completedStages: Set<string>;

    constructor (
        initialUnlockedStages: string[] = [...ALWAYS_UNLOCKED_STAGES],
        initialCompletedStages: string[] = []
    )
    {
        const baseUnlocked = new Set([...ALWAYS_UNLOCKED_STAGES, ...initialUnlockedStages]);
        this._unlockedStages = baseUnlocked;
        this._completedStages = new Set(initialCompletedStages);
    }

    get unlockedStages (): string[]
    {
        return Array.from(this._unlockedStages);
    }

    get completedStages (): string[]
    {
        return Array.from(this._completedStages);
    }

    isStageUnlocked (stageId: string): boolean
    {
        if (ALWAYS_UNLOCKED_STAGES.includes(stageId))
        {
            return true;
        }
        return this._unlockedStages.has(stageId);
    }

    isStageCompleted (stageId: string): boolean
    {
        return this._completedStages.has(stageId);
    }

    unlockStage (stageId: string): boolean
    {
        if (!stageId) return false;
        if (this._unlockedStages.has(stageId))
        {
            return false;
        }
        this._unlockedStages.add(stageId);
        return true;
    }

    completeStage (
        stageId: string,
        nextStageId?: string | null
    ): {
        isFirstTimeClear: boolean;
        newlyUnlocked: string | null;
    }
    {
        const isFirstTimeClear = !this._completedStages.has(stageId);
        this._completedStages.add(stageId);

        let newlyUnlocked: string | null = null;
        if (nextStageId && !this._unlockedStages.has(nextStageId))
        {
            this._unlockedStages.add(nextStageId);
            newlyUnlocked = nextStageId;
        }

        return {
            isFirstTimeClear,
            newlyUnlocked,
        };
    }

    reset (): void
    {
        this._unlockedStages = new Set(ALWAYS_UNLOCKED_STAGES);
        this._completedStages = new Set();
    }

    loadFrom (unlockedStages: string[], completedStages: string[]): void
    {
        this._unlockedStages = new Set([...ALWAYS_UNLOCKED_STAGES, ...unlockedStages]);
        this._completedStages = new Set(completedStages);
    }
}
