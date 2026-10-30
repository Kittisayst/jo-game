import { describe, expect, it } from 'vitest';
import { SkillCooldowns } from './SkillCooldowns';
import { SkillProgression } from './SkillProgression';

describe('SkillProgression', () =>
{
    it('puts a new skill on the first empty slot, once', () =>
    {
        const p = new SkillProgression();
        expect(p.unlock('power-wave')).toBe(true);
        expect(p.unlock('power-wave')).toBe(false);
        expect(p.equipped).toEqual(['power-wave', null]);
        p.unlock('ping');
        p.unlock('end-task');
        expect(p.equipped).toEqual(['power-wave', 'ping']);
        expect(p.isUnlocked('end-task')).toBe(true);
    });

    it('equips only learned skills and never twice', () =>
    {
        const p = new SkillProgression();
        p.unlock('a');
        p.unlock('b');
        expect(p.equip(0, 'zzz')).toBe(false);
        expect(p.equip(5, 'a')).toBe(false);
        expect(p.equip(1, 'a')).toBe(true);
        expect(p.equipped).toEqual(['b', 'a']);
        expect(p.equip(0, null)).toBe(true);
        expect(p.equipped).toEqual([null, 'a']);
    });

    it('round-trips a snapshot and drops what cannot be on a slot', () =>
    {
        const p = new SkillProgression();
        p.unlock('a');
        const copy = new SkillProgression();
        copy.loadFrom(p.toSnapshot());
        expect(copy.equipped).toEqual(['a', null]);
        copy.loadFrom({ unlocked: ['a'], equipped: ['a', 'a'] });
        expect(copy.equipped).toEqual(['a', null]);
        copy.loadFrom({ unlocked: ['a'], equipped: ['x', 'a'] });
        expect(copy.equipped).toEqual([null, 'a']);
        copy.loadFrom(undefined);
        expect(copy.unlocked).toEqual([]);
    });
});

describe('SkillCooldowns', () =>
{
    it('counts down in Game time and is ready at zero', () =>
    {
        const c = new SkillCooldowns();
        c.start('a', 1000);
        expect(c.anyActive).toBe(true);
        c.tick(400);
        expect(c.remainingMs('a')).toBe(600);
        expect(c.fraction('a')).toBeCloseTo(0.6);
        c.tick(-5);
        c.tick(Number.NaN);
        expect(c.remainingMs('a')).toBe(600);
        c.tick(700);
        expect(c.remainingMs('a')).toBe(0);
        expect(c.anyActive).toBe(false);
        expect(c.fraction('a')).toBe(0);
    });
});

describe('SkillProgression ranks', () =>
{
    it('starts a learned skill at rank 1 and goes up to 3', () =>
    {
        const p = new SkillProgression();
        expect(p.rankOf('a')).toBe(0);
        p.unlock('a');
        expect(p.rankOf('a')).toBe(1);
        expect([p.upgradeRank('a'), p.upgradeRank('a'), p.upgradeRank('a')]).toEqual([true, true, false]);
        expect(p.rankOf('a')).toBe(3);
        expect(p.upgradeRank('zzz')).toBe(false);
    });

    it('saves and loads ranks, ignoring a bad one or one for a skill not learned', () =>
    {
        const p = new SkillProgression();
        p.unlock('a');
        p.upgradeRank('a');
        const copy = new SkillProgression();
        copy.loadFrom(p.toSnapshot());
        expect(copy.rankOf('a')).toBe(2);
        copy.loadFrom({ unlocked: ['a'], equipped: [null, null], ranks: { a: 9, b: 3 } });
        expect(copy.rankOf('a')).toBe(1);
        expect(copy.rankOf('b')).toBe(0);
        copy.loadFrom({ unlocked: ['a'], equipped: [null, null] });
        expect(copy.rankOf('a')).toBe(1);
    });
});
