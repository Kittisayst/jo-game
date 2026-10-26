import { describe, expect, it } from 'vitest';
import { LevelProgress } from './LevelProgress';

describe('LevelProgress', () =>
{
    it('starts incomplete', () =>
    {
        expect(new LevelProgress().isComplete).toBe(false);
    });

    it('becomes complete after calling complete()', () =>
    {
        const progress = new LevelProgress();

        progress.complete();

        expect(progress.isComplete).toBe(true);
    });
});
