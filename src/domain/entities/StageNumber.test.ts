import { describe, expect, it } from 'vitest';
import {
    isLessonNumber,
    nextStageIdInRealm,
    positionInRealm,
    realmOf,
    stageIdOf,
    stageNumberOf,
} from './StageNumber';

describe('stage numbers', () =>
{
    it('writes ids with three digits and reads them back', () =>
    {
        expect(stageIdOf(1)).toBe('stage-001');
        expect(stageIdOf(100)).toBe('stage-100');
        expect(stageNumberOf('stage-037')).toBe(37);
    });

    it('rejects numbers outside 1 to 100', () =>
    {
        expect(() => stageIdOf(0)).toThrow(/1 to 100/);
        expect(() => stageIdOf(101)).toThrow(/1 to 100/);
        expect(() => stageIdOf(2.5)).toThrow(/whole number/);
    });

    it('does not read the village or a malformed id as a stage', () =>
    {
        expect(stageNumberOf('village')).toBeNull();
        expect(stageNumberOf('stage-ch1')).toBeNull();
        expect(stageNumberOf('stage-1')).toBeNull();
        expect(stageNumberOf('stage-000')).toBeNull();
        expect(stageNumberOf('stage-101')).toBeNull();
    });

    it('puts ten stages in each realm', () =>
    {
        expect(realmOf(1)).toBe(1);
        expect(realmOf(10)).toBe(1);
        expect(realmOf(11)).toBe(2);
        expect(realmOf(100)).toBe(10);
        expect(positionInRealm(10)).toBe(10);
        expect(positionInRealm(11)).toBe(1);
    });

    it('opens the next stage inside a realm but not across realms', () =>
    {
        expect(nextStageIdInRealm('stage-001')).toBe('stage-002');
        expect(nextStageIdInRealm('stage-009')).toBe('stage-010');
        expect(nextStageIdInRealm('stage-010')).toBeNull();
        expect(nextStageIdInRealm('stage-100')).toBeNull();
        expect(nextStageIdInRealm('village')).toBeNull();
    });

    it('recognises lesson numbers written stage-order', () =>
    {
        expect(isLessonNumber('1-1')).toBe(true);
        expect(isLessonNumber('12-3')).toBe(true);
        expect(isLessonNumber('100-2')).toBe(true);
        expect(isLessonNumber('0-1')).toBe(false);
        expect(isLessonNumber('101-1')).toBe(false);
        expect(isLessonNumber('12-0')).toBe(false);
        expect(isLessonNumber('12')).toBe(false);
    });
});
