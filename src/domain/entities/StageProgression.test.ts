import { describe, expect, it } from 'vitest';
import { StageProgression } from './StageProgression';

describe('StageProgression entity', () =>
{
    it('initializes with village and level-1 unlocked by default', () =>
    {
        const progression = new StageProgression();
        expect(progression.isStageUnlocked('village')).toBe(true);
        expect(progression.isStageUnlocked('level-1')).toBe(true);
        expect(progression.isStageUnlocked('level-2')).toBe(false);
        expect(progression.isStageUnlocked('level-3')).toBe(false);
        expect(progression.completedStages).toEqual([]);
    });

    it('initializes with custom saved data', () =>
    {
        const progression = new StageProgression(['village', 'level-1', 'level-2'], ['level-1']);
        expect(progression.isStageUnlocked('level-2')).toBe(true);
        expect(progression.isStageCompleted('level-1')).toBe(true);
        expect(progression.isStageCompleted('level-2')).toBe(false);
        expect(progression.isStageUnlocked('level-3')).toBe(false);
    });

    it('completing level-1 unlocks level-2 and records first-time clear', () =>
    {
        const progression = new StageProgression();
        const result = progression.completeStage('level-1', 'level-2');

        expect(result.isFirstTimeClear).toBe(true);
        expect(result.newlyUnlocked).toBe('level-2');
        expect(progression.isStageCompleted('level-1')).toBe(true);
        expect(progression.isStageUnlocked('level-2')).toBe(true);
    });

    it('re-completing level-1 does not mark as first-time clear or re-unlock', () =>
    {
        const progression = new StageProgression(['village', 'level-1', 'level-2'], ['level-1']);
        const result = progression.completeStage('level-1', 'level-2');

        expect(result.isFirstTimeClear).toBe(false);
        expect(result.newlyUnlocked).toBe(null);
    });

    it('completing final stage with no next level', () =>
    {
        const progression = new StageProgression(['village', 'level-1', 'level-2', 'level-3'], ['level-1', 'level-2']);
        const result = progression.completeStage('level-3', null);

        expect(result.isFirstTimeClear).toBe(true);
        expect(result.newlyUnlocked).toBe(null);
        expect(progression.isStageCompleted('level-3')).toBe(true);
    });

    it('unlockStage manually unlocks stage if not already unlocked', () =>
    {
        const progression = new StageProgression();
        expect(progression.unlockStage('level-2')).toBe(true);
        expect(progression.isStageUnlocked('level-2')).toBe(true);
        expect(progression.unlockStage('level-2')).toBe(false);
    });

    it('resets progression back to base unlocked stages', () =>
    {
        const progression = new StageProgression(['village', 'level-1', 'level-2', 'level-3'], ['level-1', 'level-2']);
        progression.reset();

        expect(progression.isStageUnlocked('village')).toBe(true);
        expect(progression.isStageUnlocked('level-1')).toBe(true);
        expect(progression.isStageUnlocked('level-2')).toBe(false);
        expect(progression.completedStages).toEqual([]);
    });
});
