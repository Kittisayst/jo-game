import { describe, expect, it } from 'vitest';
import { checkGateRequirements, repairBrokenGateUseCase } from './RepairBrokenGateUseCase';
import { Backpack } from '../domain/entities/Backpack';
import { QuestionData } from '../domain/entities/Quiz';

describe('RepairBrokenGateUseCase', () =>
{
    const question: QuestionData = {
        id: 'q1',
        bookId: 'book-ch1',
        pageNumber: 1,
        question: 'What is hardware?',
        options: ['Software', 'Physical equipment', 'User'],
        correctIndex: 1,
        explanation: 'Hardware is physical',
    };

    it('rejects repair if player lacks hammer', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('repair-kit', 1);
        const gates = new Set<string>();

        const result = repairBrokenGateUseCase('gate-1', gates, backpack, question, 1);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('missing_hammer');
        expect(backpack.getItemCount('repair-kit')).toBe(1);
    });

    it('rejects repair if player lacks repair-kit', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('hammer-t1', 1);
        const gates = new Set<string>();

        const result = repairBrokenGateUseCase('gate-1', gates, backpack, question, 1);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('missing_repair_kit');
    });

    it('does NOT consume repair-kit when quiz answer is incorrect', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('hammer-t1', 1);
        backpack.addItem('repair-kit', 1);
        const gates = new Set<string>();

        // Selected option 0 is wrong (correct is 1)
        const result = repairBrokenGateUseCase('gate-1', gates, backpack, question, 0);
        expect(result.success).toBe(false);
        expect(result.reason).toBe('quiz_failed');
        expect(result.repairKitConsumed).toBe(false);
        expect(backpack.getItemCount('repair-kit')).toBe(1); // Kept!
        expect(gates.has('gate-1')).toBe(false);
    });

    it('repairs gate, consumes 1 repair-kit, and adds to repaired set on correct answer', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('hammer-t1', 1);
        backpack.addItem('repair-kit', 1);
        const gates = new Set<string>();

        const result = repairBrokenGateUseCase('gate-1', gates, backpack, question, 1);
        expect(result.success).toBe(true);
        expect(result.repairKitConsumed).toBe(true);
        expect(backpack.getItemCount('repair-kit')).toBe(0);
        expect(gates.has('gate-1')).toBe(true);
    });

    it('reads the required tool and item from the gate requirements', () =>
    {
        const backpack = new Backpack();
        backpack.addItem('pickaxe-t1', 1);
        backpack.addItem('crystal', 2);
        const requirements = { requiredTool: 'pickaxe', requiredItem: 'crystal' };
        const gates = new Set<string>();

        expect(checkGateRequirements(backpack, requirements)).toEqual({ hasTool: true, hasItem: true });
        expect(checkGateRequirements(backpack, { requiredTool: 'hammer', requiredItem: 'crystal' }))
            .toEqual({ hasTool: false, hasItem: true });

        const result = repairBrokenGateUseCase('gate-2', gates, backpack, question, 1, requirements);
        expect(result.success).toBe(true);
        expect(backpack.getItemCount('crystal')).toBe(1);
        expect(gates.has('gate-2')).toBe(true);
    });
});
