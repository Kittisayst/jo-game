import { describe, expect, it } from 'vitest';
import { Boss } from './Boss';

describe('Boss entity', () =>
{
    it('initializes with default maxHp', () =>
    {
        const boss = new Boss();
        expect(boss.maxHp).toBe(5);
        expect(boss.currentHp).toBe(5);
        expect(boss.isDefeated).toBe(false);
        expect(boss.phase).toBe(1);
        expect(boss.isEnraged).toBe(false);
        expect(boss.isBerserk).toBe(false);
    });

    it('initializes with custom maxHp', () =>
    {
        const boss = new Boss(3);
        expect(boss.maxHp).toBe(3);
        expect(boss.currentHp).toBe(3);
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

    it('transitions phases and rage states based on remaining HP', () =>
    {
        const boss = new Boss(5);

        // HP 5 -> Phase 1
        expect(boss.phase).toBe(1);
        expect(boss.isEnraged).toBe(false);
        expect(boss.isBerserk).toBe(false);

        // HP 4 -> Phase 1
        boss.takeDamage(1);
        expect(boss.currentHp).toBe(4);
        expect(boss.phase).toBe(1);
        expect(boss.isEnraged).toBe(false);

        // HP 3 -> Phase 2 & Enraged
        boss.takeDamage(1);
        expect(boss.currentHp).toBe(3);
        expect(boss.phase).toBe(2);
        expect(boss.isEnraged).toBe(true);
        expect(boss.isBerserk).toBe(false);

        // HP 2 -> Phase 2 & Enraged
        boss.takeDamage(1);
        expect(boss.currentHp).toBe(2);
        expect(boss.phase).toBe(2);
        expect(boss.isEnraged).toBe(true);
        expect(boss.isBerserk).toBe(false);

        // HP 1 -> Phase 3 & Berserk
        boss.takeDamage(1);
        expect(boss.currentHp).toBe(1);
        expect(boss.phase).toBe(3);
        expect(boss.isEnraged).toBe(true);
        expect(boss.isBerserk).toBe(true);
    });

    it('derives phases from the remaining HP ratio so any max HP works', () =>
    {
        const boss = new Boss(300);
        expect(boss.phase).toBe(1);

        boss.takeDamage(120); // 180/300 = 60%
        expect(boss.phase).toBe(2);
        expect(boss.isEnraged).toBe(true);

        boss.takeDamage(120); // 60/300 = 20%
        expect(boss.phase).toBe(3);
        expect(boss.isBerserk).toBe(true);
    });
});

describe('Boss.healAfterFailedFinisher', () =>
{
    it('recovers 15% of max HP rounded up and clears the defeated flag', () =>
    {
        const boss = new Boss(300);
        boss.takeDamage(300);

        expect(boss.healAfterFailedFinisher()).toBe(45);
        expect(boss.currentHp).toBe(45);
        expect(boss.isDefeated).toBe(false);
    });
});
