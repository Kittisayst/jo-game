import { describe, expect, it } from 'vitest';
import { getNextObjective, ObjectiveState } from './nextObjective';

const fresh: ObjectiveState = {
    ownsBook: false,
    bookFullyRead: false,
    examPassed: false,
    hasPickaxe: false,
    hasHammer: false,
    hasRepairKit: false,
    gateRepaired: false,
    bossCleared: false,
};

describe('getNextObjective', () =>
{
    it('walks a new player through the Chapter 1 loop in order', () =>
    {
        expect(getNextObjective(fresh)).toBe('buy-book');
        expect(getNextObjective({ ...fresh, ownsBook: true })).toBe('read-book');
        expect(getNextObjective({ ...fresh, ownsBook: true, bookFullyRead: true })).toBe('pass-exam');

        const learned = { ...fresh, ownsBook: true, bookFullyRead: true, examPassed: true };
        expect(getNextObjective(learned)).toBe('craft-pickaxe');
        expect(getNextObjective({ ...learned, hasPickaxe: true })).toBe('craft-hammer');
        expect(getNextObjective({ ...learned, hasPickaxe: true, hasHammer: true })).toBe('craft-repair-kit');
        expect(getNextObjective({ ...learned, hasPickaxe: true, hasHammer: true, hasRepairKit: true })).toBe('repair-gate');
        expect(getNextObjective({ ...learned, hasHammer: true, gateRepaired: true })).toBe('defeat-boss');
        expect(getNextObjective({ ...learned, gateRepaired: true, bossCleared: true })).toBe('chapter-cleared');
    });

    it('does not ask for a pickaxe again once the hammer exists', () =>
    {
        const state = { ...fresh, ownsBook: true, bookFullyRead: true, examPassed: true, hasHammer: true };
        expect(getNextObjective(state)).toBe('craft-repair-kit');
    });

    it('sends a player who lost their only Repair Kit to craft another instead of repairing', () =>
    {
        const state = { ...fresh, ownsBook: true, bookFullyRead: true, examPassed: true, hasPickaxe: true, hasHammer: true };
        expect(getNextObjective(state)).toBe('craft-repair-kit');
    });
});
