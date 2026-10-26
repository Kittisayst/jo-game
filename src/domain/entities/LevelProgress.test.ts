import { describe, expect, it } from 'vitest';
import { LevelProgress } from './LevelProgress';

describe('LevelProgress', () =>
{
    it('starts incomplete', () =>
    {
        expect(new LevelProgress().isComplete).toBe(false);
    });

    it('defaults to level-1 and null nextLevel', () =>
    {
        const progress = new LevelProgress();
        expect(progress.levelId).toBe('level-1');
        expect(progress.nextLevel).toBeNull();
    });

    it('accepts custom levelId and nextLevel', () =>
    {
        const progress = new LevelProgress('level-1', 'level-2');
        expect(progress.levelId).toBe('level-1');
        expect(progress.nextLevel).toBe('level-2');
    });

    it('becomes complete after calling complete()', () =>
    {
        const progress = new LevelProgress();

        progress.complete();

        expect(progress.isComplete).toBe(true);
    });
});
