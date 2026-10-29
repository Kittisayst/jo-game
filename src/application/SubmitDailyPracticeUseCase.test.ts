import { describe, expect, it } from 'vitest';
import { canAccessDailyPractice, submitDailyPracticeUseCase } from './SubmitDailyPracticeUseCase';
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

describe('canAccessDailyPractice', () =>
{
    it('is open when the player owns a Textbook', () =>
    {
        expect(canAccessDailyPractice(1, 0)).toBe(true);
        expect(canAccessDailyPractice(2, 500)).toBe(true);
    });

    it('is open for a player who owns nothing and cannot afford the first Textbook', () =>
    {
        expect(canAccessDailyPractice(0, 0)).toBe(true);
        expect(canAccessDailyPractice(0, 19)).toBe(true);
    });

    it('is closed while the first Textbook is affordable but not bought', () =>
    {
        expect(canAccessDailyPractice(0, 20)).toBe(false);
        expect(canAccessDailyPractice(0, 60)).toBe(false);
    });
});
