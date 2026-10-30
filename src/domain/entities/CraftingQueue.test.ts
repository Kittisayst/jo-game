import { describe, expect, it } from 'vitest';
import { CraftingQueue } from './CraftingQueue';

describe('CraftingQueue', () =>
{
    it('runs one job at a time', () =>
    {
        const queue = new CraftingQueue();
        expect(queue.isBusy).toBe(false);
        expect(queue.start('recipe-iron-sword', 'iron-sword', 1, 30_000)).toBe(true);
        expect(queue.start('recipe-axe-t1', 'axe-t1', 1, 10_000)).toBe(false);
        expect(queue.job?.recipeId).toBe('recipe-iron-sword');
    });

    it('counts Game time down and is ready at zero', () =>
    {
        const queue = new CraftingQueue();
        queue.start('r', 'iron-sword', 1, 30_000);
        queue.tick(10_000);
        expect(queue.job?.remainingMs).toBe(20_000);
        expect(queue.isReady).toBe(false);
        queue.tick(25_000);
        expect(queue.job?.remainingMs).toBe(0);
        expect(queue.isReady).toBe(true);
    });

    it('ignores a bad delta and does nothing without a job', () =>
    {
        const queue = new CraftingQueue();
        queue.tick(1000);
        queue.start('r', 'x', 1, 5000);
        queue.tick(-100);
        queue.tick(Number.NaN);
        expect(queue.job?.remainingMs).toBe(5000);
    });

    it('gives the job up only when it is ready, then is free again', () =>
    {
        const queue = new CraftingQueue();
        queue.start('r', 'iron-sword', 1, 1000);
        expect(queue.collect()).toBeNull();
        queue.tick(1000);
        expect(queue.collect()?.resultItemId).toBe('iron-sword');
        expect(queue.isBusy).toBe(false);
        expect(queue.collect()).toBeNull();
    });

    it('round-trips through a snapshot', () =>
    {
        const queue = new CraftingQueue();
        queue.start('r', 'iron-sword', 1, 30_000);
        queue.tick(5000);
        const copy = new CraftingQueue();
        copy.loadFrom(queue.toSnapshot());
        expect(copy.job).toEqual(queue.job);
        copy.loadFrom(null);
        expect(copy.isBusy).toBe(false);
    });
});
