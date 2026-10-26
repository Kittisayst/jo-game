import { describe, expect, it } from 'vitest';
import { Boss } from './Boss';

describe('Boss entity', () =>
{
    it('initializes with default maxHp and points', () =>
    {
        const boss = new Boss();
        expect(boss.maxHp).toBe(5);
        expect(boss.currentHp).toBe(5);
        expect(boss.isDefeated).toBe(false);
        expect(boss.points).toBe(1000);
    });

    it('initializes with custom maxHp and points', () =>
    {
        const boss = new Boss(3, 500);
        expect(boss.maxHp).toBe(3);
        expect(boss.currentHp).toBe(3);
        expect(boss.points).toBe(500);
    });

    it('takes damage and reduces currentHp', () =>
    {
        const boss = new Boss(3);
        const result = boss.takeDamage(1);

        expect(result.currentHp).toBe(2);
        expect(result.defeated).toBe(false);
        expect(boss.currentHp).toBe(2);
        expect(boss.isDefeated).toBe(false);
    });

    it('becomes defeated when currentHp hits 0', () =>
    {
        const boss = new Boss(2);
        boss.takeDamage(1);
        const finalHit = boss.takeDamage(1);

        expect(finalHit.currentHp).toBe(0);
        expect(finalHit.defeated).toBe(true);
        expect(boss.isDefeated).toBe(true);
    });

    it('ignores further damage once already defeated', () =>
    {
        const boss = new Boss(1);
        boss.takeDamage(1);
        const extraHit = boss.takeDamage(1);

        expect(extraHit.currentHp).toBe(0);
        expect(extraHit.defeated).toBe(true);
    });

    it('resets HP and defeated status', () =>
    {
        const boss = new Boss(3);
        boss.takeDamage(3);
        expect(boss.isDefeated).toBe(true);

        boss.reset();
        expect(boss.currentHp).toBe(3);
        expect(boss.isDefeated).toBe(false);
    });
});
