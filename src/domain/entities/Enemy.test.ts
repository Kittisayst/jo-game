import { describe, expect, it } from 'vitest';
import { Enemy } from './Enemy';

describe('Enemy entity', () =>
{
    it('initializes as not defeated with default points', () =>
    {
        const enemy = new Enemy();
        expect(enemy.isDefeated).toBe(false);
        expect(enemy.points).toBe(100);
    });

    it('accepts custom points', () =>
    {
        const enemy = new Enemy(250);
        expect(enemy.points).toBe(250);
    });

    it('marks as defeated', () =>
    {
        const enemy = new Enemy();
        enemy.defeat();
        expect(enemy.isDefeated).toBe(true);
    });
});
