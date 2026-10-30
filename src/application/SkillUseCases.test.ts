import { describe, expect, it } from 'vitest';
import { Backpack } from '../domain/entities/Backpack';
import { SkillCooldowns } from '../domain/entities/SkillCooldowns';
import { SkillProgression } from '../domain/entities/SkillProgression';
import { Wallet } from '../domain/entities/Wallet';
import { cooldownAtRank, castSkillUseCase, equipSkillUseCase, SkillRule, syncSkillsWithBooksUseCase, upgradeSkillUseCase } from './SkillUseCases';

const wave: SkillRule = {
    id: 'power-wave',
    realm: 1,
    cooldownMs: 4000,
    rankCooldowns: [4000, 3500, 3000],
    upgrades: [
        { credit: 30, ingredients: [{ itemId: 'iron-ore', count: 8 }] },
        { credit: 60, ingredients: [{ itemId: 'iron-ore', count: 15 }, { itemId: 'crystal', count: 3 }] },
    ],
};
const skills: SkillRule[] = [
    wave,
    { id: 'ping', realm: 2, cooldownMs: 6000, rankCooldowns: [6000, 5000, 4500], upgrades: [] },
    { id: 'end-task', realm: 3, cooldownMs: 9000, rankCooldowns: [9000, 9000, 9000], upgrades: [] },
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
        expect(castSkillUseCase(p, c, skills, 0)).toEqual({ success: true, skillId: 'power-wave', rank: 1 });
        expect(c.remainingMs('power-wave')).toBe(4000);
        expect(castSkillUseCase(p, c, skills, 0)).toEqual({ success: false, reason: 'cooldown' });
        c.tick(4000);
        expect(castSkillUseCase(p, c, skills, 0).success).toBe(true);
    });

    it('uses the cooldown of the rank the skill has reached', () =>
    {
        const p = new SkillProgression();
        const c = new SkillCooldowns();
        p.unlock('power-wave');
        p.upgradeRank('power-wave');
        p.upgradeRank('power-wave');
        expect(castSkillUseCase(p, c, skills, 0)).toEqual({ success: true, skillId: 'power-wave', rank: 3 });
        expect(c.remainingMs('power-wave')).toBe(3000);
        expect(cooldownAtRank(wave, 2)).toBe(3500);
        expect(cooldownAtRank(wave, 9)).toBe(3000);
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

describe('upgradeSkillUseCase', () =>
{
    function ready (): { p: SkillProgression; backpack: Backpack; wallet: Wallet }
    {
        const p = new SkillProgression();
        p.unlock('power-wave');
        const backpack = new Backpack();
        backpack.addItem('iron-ore', 30);
        backpack.addItem('crystal', 5);
        return { p, backpack, wallet: new Wallet(200) };
    }

    it('takes the Credit and Materials of the next rank and raises the skill', () =>
    {
        const { p, backpack, wallet } = ready();
        expect(upgradeSkillUseCase('power-wave', skills, p, backpack, wallet)).toEqual({ success: true, newRank: 2 });
        expect(wallet.balance).toBe(170);
        expect(backpack.getItemCount('iron-ore')).toBe(22);
        expect(p.rankOf('power-wave')).toBe(2);
        expect(upgradeSkillUseCase('power-wave', skills, p, backpack, wallet)).toEqual({ success: true, newRank: 3 });
        expect(wallet.balance).toBe(110);
        expect(backpack.getItemCount('crystal')).toBe(2);
    });

    it('stops at rank 3 and refuses a skill not learned', () =>
    {
        const { p, backpack, wallet } = ready();
        upgradeSkillUseCase('power-wave', skills, p, backpack, wallet);
        upgradeSkillUseCase('power-wave', skills, p, backpack, wallet);
        expect(upgradeSkillUseCase('power-wave', skills, p, backpack, wallet)).toEqual({ success: false, reason: 'max_rank' });
        expect(upgradeSkillUseCase('ping', skills, p, backpack, wallet)).toEqual({ success: false, reason: 'not_learned' });
    });

    it('takes nothing when the Credit or a Material is short', () =>
    {
        const poor = ready();
        poor.wallet.spend(190);
        expect(upgradeSkillUseCase('power-wave', skills, poor.p, poor.backpack, poor.wallet)).toEqual({ success: false, reason: 'insufficient_credit' });
        expect(poor.backpack.getItemCount('iron-ore')).toBe(30);

        const short = ready();
        short.backpack.removeItem('iron-ore', 25);
        expect(upgradeSkillUseCase('power-wave', skills, short.p, short.backpack, short.wallet)).toEqual({ success: false, reason: 'insufficient_ingredients' });
        expect(short.wallet.balance).toBe(200);
        expect(short.p.rankOf('power-wave')).toBe(1);
    });

    it('refuses a skill that has no upgrade defined', () =>
    {
        const p = new SkillProgression();
        p.unlock('ping');
        expect(upgradeSkillUseCase('ping', skills, p, new Backpack(), new Wallet(500))).toEqual({ success: false, reason: 'no_upgrade_defined' });
    });
});
