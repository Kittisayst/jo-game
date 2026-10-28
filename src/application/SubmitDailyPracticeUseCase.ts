import { SpacedRepetitionSystem } from '../domain/entities/Quiz';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';

export const DAILY_PRACTICE_COMPLETED_EVENT = 'daily-practice-completed';

export interface PracticeAnswerInput
{
    questionId: string;
    isCorrect: boolean;
}

export interface DailyPracticeCompletedPayload
{
    todayDate: string;
    correctCount: number;
    totalAnswered: number;
    creditReward: number;
    newBalance: number;
}

export interface SubmitDailyPracticeResult
{
    success: boolean;
    reason?: string;
    correctCount: number;
    totalAnswered: number;
    creditReward: number;
}

export function submitDailyPracticeUseCase (
    todayDate: string,
    answers: PracticeAnswerInput[],
    srs: SpacedRepetitionSystem,
    wallet: Wallet
): SubmitDailyPracticeResult
{
    if (!srs.canPracticeToday(todayDate))
    {
        return {
            success: false,
            reason: 'daily_limit_reached',
            correctCount: 0,
            totalAnswered: 0,
            creditReward: 0,
        };
    }

    let correctCount = 0;
    for (const ans of answers)
    {
        srs.recordAnswer(ans.questionId, ans.isCorrect);
        if (ans.isCorrect)
        {
            correctCount++;
        }
    }

    // +5 Credit per correct answer
    const creditReward = correctCount * 5;
    if (creditReward > 0)
    {
        wallet.earn(creditReward);
    }

    srs.completeDailySession(todayDate, answers.length > 0 ? 1 : 0);

    DomainEvents.emit<DailyPracticeCompletedPayload>(DAILY_PRACTICE_COMPLETED_EVENT, {
        todayDate,
        correctCount,
        totalAnswered: answers.length,
        creditReward,
        newBalance: wallet.balance,
    });

    return {
        success: true,
        correctCount,
        totalAnswered: answers.length,
        creditReward,
    };
}

