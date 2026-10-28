import { describe, expect, it } from 'vitest';
import { submitDailyPracticeUseCase } from './SubmitDailyPracticeUseCase';
import { SpacedRepetitionSystem } from '../domain/entities/Quiz';
import { Wallet } from '../domain/entities/Wallet';

describe('SubmitDailyPracticeUseCase', () =>
{
    it('awards 5 credit per correct answer and records SRS results', () =>
    {
        const srs = new SpacedRepetitionSystem();
        const wallet = new Wallet(0);

        const result = submitDailyPracticeUseCase(
            '2026-10-28',
            [
                { questionId: 'q1', isCorrect: true },
                { questionId: 'q2', isCorrect: true },
                { questionId: 'q3', isCorrect: false },
            ],
            srs,
            wallet
        );

        expect(result.success).toBe(true);
        expect(result.correctCount).toBe(2);
        expect(result.creditReward).toBe(10); // 2 * 5
        expect(wallet.balance).toBe(10);

        expect(srs.getQuestionStats('q1').timesCorrect).toBe(1);
        expect(srs.getQuestionStats('q3').timesIncorrect).toBe(1);
    });

    it('rejects submission if daily practice limit was already reached', () =>
    {
        const srs = new SpacedRepetitionSystem({}, '2026-10-28', 3);
        const wallet = new Wallet(10);

        const result = submitDailyPracticeUseCase(
            '2026-10-28',
            [{ questionId: 'q1', isCorrect: true }],
            srs,
            wallet
        );

        expect(result.success).toBe(false);
        expect(result.reason).toBe('daily_limit_reached');
        expect(wallet.balance).toBe(10);
    });
});

