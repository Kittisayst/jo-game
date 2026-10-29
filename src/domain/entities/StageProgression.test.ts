import { describe, expect, it } from 'vitest';
import { StageProgression } from './StageProgression';

describe('StageProgression entity', () =>
{
    it('initializes with the village and Chapter 1 unlocked by default', () =>
    {
        const progression = new StageProgression();
        expect(progression.isStageUnlocked('village')).toBe(true);
        expect(progression.isStageUnlocked('stage-ch1')).toBe(true);
        expect(progression.isStageUnlocked('stage-ch2')).toBe(false);
        expect(progression.completedStages).toEqual([]);
    });

    it('initializes with custom saved data', () =>
    {
        const progression = new StageProgression(['village', 'stage-ch1', 'stage-ch2'], ['stage-ch1']);
        expect(progression.isStageUnlocked('stage-ch2')).toBe(true);
        expect(progression.isStageCompleted('stage-ch1')).toBe(true);
        expect(progression.isStageCompleted('stage-ch2')).toBe(false);
        expect(progression.isStageUnlocked('stage-ch3')).toBe(false);
    });

    it('completing a stage unlocks the next one and records a first-time clear', () =>
    {
        const progression = new StageProgression();
        const result = progression.completeStage('stage-ch1', 'stage-ch2');

        expect(result.isFirstTimeClear).toBe(true);
        expect(result.newlyUnlocked).toBe('stage-ch2');
        expect(progression.isStageCompleted('stage-ch1')).toBe(true);
        expect(progression.isStageUnlocked('stage-ch2')).toBe(true);
    });

    it('re-completing a stage is not a first-time clear and does not re-unlock', () =>
    {
        const progression = new StageProgression(['village', 'stage-ch1', 'stage-ch2'], ['stage-ch1']);
        const result = progression.completeStage('stage-ch1', 'stage-ch2');

        expect(result.isFirstTimeClear).toBe(false);
        expect(result.newlyUnlocked).toBe(null);
    });

    it('completing the final stage with no next stage', () =>
    {
        const progression = new StageProgression(['village', 'stage-ch1', 'stage-ch2'], ['stage-ch1']);
        const result = progression.completeStage('stage-ch2', null);

        expect(result.isFirstTimeClear).toBe(true);
        expect(result.newlyUnlocked).toBe(null);
        expect(progression.isStageCompleted('stage-ch2')).toBe(true);
    });

    it('unlockStage manually unlocks stage if not already unlocked', () =>
    {
        const progression = new StageProgression();
        expect(progression.unlockStage('stage-ch2')).toBe(true);
        expect(progression.isStageUnlocked('stage-ch2')).toBe(true);
        expect(progression.unlockStage('stage-ch2')).toBe(false);
    });

    it('resets progression back to base unlocked stages', () =>
    {
        const progression = new StageProgression(['village', 'stage-ch1', 'stage-ch2'], ['stage-ch1']);
        progression.reset();

        expect(progression.isStageUnlocked('village')).toBe(true);
        expect(progression.isStageUnlocked('stage-ch1')).toBe(true);
        expect(progression.isStageUnlocked('stage-ch2')).toBe(false);
        expect(progression.completedStages).toEqual([]);
    });

    it('loads progression from snapshot', () =>
    {
        const progression = new StageProgression();
        progression.loadFrom(['village', 'stage-ch1', 'stage-ch2'], ['stage-ch1']);

        expect(progression.isStageUnlocked('stage-ch2')).toBe(true);
        expect(progression.isStageCompleted('stage-ch1')).toBe(true);
        expect(progression.isStageCompleted('stage-ch2')).toBe(false);
    });
});
