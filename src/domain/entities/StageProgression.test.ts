import { describe, expect, it } from 'vitest';
import { StageProgression } from './StageProgression';

describe('StageProgression entity', () =>
{
    it('initializes with the village and Chapter 1 unlocked by default', () =>
    {
        const progression = new StageProgression();
        expect(progression.isStageUnlocked('village')).toBe(true);
        expect(progression.isStageUnlocked('stage-001')).toBe(true);
        expect(progression.isStageUnlocked('stage-002')).toBe(false);
        expect(progression.completedStages).toEqual([]);
    });

    it('initializes with custom saved data', () =>
    {
        const progression = new StageProgression(['village', 'stage-001', 'stage-002'], ['stage-001']);
        expect(progression.isStageUnlocked('stage-002')).toBe(true);
        expect(progression.isStageCompleted('stage-001')).toBe(true);
        expect(progression.isStageCompleted('stage-002')).toBe(false);
        expect(progression.isStageUnlocked('stage-ch3')).toBe(false);
    });

    it('completing a stage unlocks the next one and records a first-time clear', () =>
    {
        const progression = new StageProgression();
        const result = progression.completeStage('stage-001', 'stage-002');

        expect(result.isFirstTimeClear).toBe(true);
        expect(result.newlyUnlocked).toBe('stage-002');
        expect(progression.isStageCompleted('stage-001')).toBe(true);
        expect(progression.isStageUnlocked('stage-002')).toBe(true);
    });

    it('re-completing a stage is not a first-time clear and does not re-unlock', () =>
    {
        const progression = new StageProgression(['village', 'stage-001', 'stage-002'], ['stage-001']);
        const result = progression.completeStage('stage-001', 'stage-002');

        expect(result.isFirstTimeClear).toBe(false);
        expect(result.newlyUnlocked).toBe(null);
    });

    it('completing the final stage with no next stage', () =>
    {
        const progression = new StageProgression(['village', 'stage-001', 'stage-002'], ['stage-001']);
        const result = progression.completeStage('stage-002', null);

        expect(result.isFirstTimeClear).toBe(true);
        expect(result.newlyUnlocked).toBe(null);
        expect(progression.isStageCompleted('stage-002')).toBe(true);
    });

    it('unlockStage manually unlocks stage if not already unlocked', () =>
    {
        const progression = new StageProgression();
        expect(progression.unlockStage('stage-002')).toBe(true);
        expect(progression.isStageUnlocked('stage-002')).toBe(true);
        expect(progression.unlockStage('stage-002')).toBe(false);
    });

    it('resets progression back to base unlocked stages', () =>
    {
        const progression = new StageProgression(['village', 'stage-001', 'stage-002'], ['stage-001']);
        progression.reset();

        expect(progression.isStageUnlocked('village')).toBe(true);
        expect(progression.isStageUnlocked('stage-001')).toBe(true);
        expect(progression.isStageUnlocked('stage-002')).toBe(false);
        expect(progression.completedStages).toEqual([]);
    });

    it('loads progression from snapshot', () =>
    {
        const progression = new StageProgression();
        progression.loadFrom(['village', 'stage-001', 'stage-002'], ['stage-001']);

        expect(progression.isStageUnlocked('stage-002')).toBe(true);
        expect(progression.isStageCompleted('stage-001')).toBe(true);
        expect(progression.isStageCompleted('stage-002')).toBe(false);
    });

    it('remembers which Stage questions have paid their Credit, once each', () =>
    {
        const progression = new StageProgression();

        expect(progression.isStageQuestionRewarded('stage-002')).toBe(false);
        expect(progression.markStageQuestionRewarded('stage-002')).toBe(true);
        expect(progression.markStageQuestionRewarded('stage-002')).toBe(false);
        expect(progression.questionRewardedStages).toEqual(['stage-002']);
    });

    it('loads, keeps and resets the rewarded Stages', () =>
    {
        const progression = new StageProgression();
        progression.loadFrom(['village', 'stage-001'], [], ['stage-001']);
        expect(progression.isStageQuestionRewarded('stage-001')).toBe(true);

        // A save from before this existed has none
        progression.loadFrom(['village', 'stage-001'], []);
        expect(progression.questionRewardedStages).toEqual([]);

        progression.markStageQuestionRewarded('stage-003');
        progression.reset();
        expect(progression.questionRewardedStages).toEqual([]);
    });
});
