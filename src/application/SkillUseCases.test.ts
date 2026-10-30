import { describe, expect, it } from 'vitest';
import { SkillCooldowns } from '../domain/entities/SkillCooldowns';
import { SkillProgression } from '../domain/entities/SkillProgression';
import { equipSkillUseCase, syncSkillsWithBooksUseCase, castSkillUseCase } from './SkillUseCases';

const skills = [
    { id: 'power-wave', realm: 1, cooldownMs: 4000 },
    { id: 'ping', realm: 2, cooldownMs: 6000 },
    { id: 'end-task', realm: 3, cooldownMs: 9000 },
];
const realms = [
    { number: 1, bookId: 'book-ch1' },
    { number: 2, bookId: 'book-ch2' },
    { number: 3, bookId: null },
];

describe('syncSkillsWithBooksUseCase', () =>
{
    it('teaches the skill of each passed Textbook, only the new ones each time', () =>
    {
        const p = new SkillProgression();
        expect(syncSkillsWithBooksUseCase(p, skills, realms, new Set())).toEqual([]);
        expect(syncSkillsWithBooksUseCase(p, skills, realms, new Set(['book-ch1']))).toEqual(['power-wave']);
        expect(syncSkillsWithBooksUseCase(p, skills, realms, new Set(['book-ch1']))).toEqual([]);
        expect(syncSkillsWithBooksUseCase(p, skills, realms, new Set(['book-ch1', 'book-ch2']))).toEqual(['ping']);
        expect(p.unlocked).toEqual(['power-wave', 'ping']);
    });

    it('gives nothing for a Realm that has no Textbook yet', () =>
    {
        const p = new SkillProgression();
        expect(syncSkillsWithBooksUseCase(p, skills, realms, new Set(['book-ch3']))).toEqual([]);
    });
});

describe('castSkillUseCase', () =>
{
    it('refuses an empty slot', () =>
    {
        expect(castSkillUseCase(new SkillProgression(), new SkillCooldowns(), skills, 0)).toEqual({ success: false, reason: 'empty_slot' });
    });

    it('uses the skill, starts its cooldown and refuses until it is over', () =>
    {
        const p = new SkillProgression();
        const c = new SkillCooldowns();
        p.unlock('power-wave');
        expect(castSkillUseCase(p, c, skills, 0)).toEqual({ success: true, skillId: 'power-wave' });
        expect(c.remainingMs('power-wave')).toBe(4000);
        expect(castSkillUseCase(p, c, skills, 0)).toEqual({ success: false, reason: 'cooldown' });
        c.tick(4000);
        expect(castSkillUseCase(p, c, skills, 0).success).toBe(true);
    });

    it('lets a skill be moved to the other slot', () =>
    {
        const p = new SkillProgression();
        p.unlock('power-wave');
        expect(equipSkillUseCase(p, 1, 'power-wave')).toBe(true);
        expect(castSkillUseCase(p, new SkillCooldowns(), skills, 0)).toEqual({ success: false, reason: 'empty_slot' });
        expect(castSkillUseCase(p, new SkillCooldowns(), skills, 1).success).toBe(true);
    });
});
