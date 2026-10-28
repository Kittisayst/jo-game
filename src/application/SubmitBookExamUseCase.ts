import { BookProgress } from '../domain/entities/Book';
import { QuizExamSession } from '../domain/entities/Quiz';
import { Wallet } from '../domain/entities/Wallet';
import { DomainEvents } from '../domain/DomainEvents';

export const BOOK_EXAM_COMPLETED_EVENT = 'book-exam-completed';

export interface BookExamCompletedPayload
{
    bookId: string;
    score: number;
    total: number;
    passed: boolean;
    firstTime: boolean;
    creditReward: number;
    forgeUnlocked: boolean;
    newBalance: number;
}

export interface SubmitBookExamResult
{
    passed: boolean;
    firstTime: boolean;
    creditReward: number;
    score: number;
    total: number;
    forgeUnlocked: boolean;
}

export function submitBookExamUseCase (
    examSession: QuizExamSession,
    bookProgress: BookProgress,
    wallet: Wallet
): SubmitBookExamResult
{
    const score = examSession.score;
    const total = examSession.totalQuestions;
    const examRecord = bookProgress.recordExamResult(score, total);

    let forgeUnlocked = false;
    if (examRecord.passed)
    {
        if (examRecord.creditReward > 0)
        {
            wallet.earn(examRecord.creditReward);
        }
        if (bookProgress.bookId === 'book-ch1')
        {
            forgeUnlocked = true;
        }
    }

    DomainEvents.emit<BookExamCompletedPayload>(BOOK_EXAM_COMPLETED_EVENT, {
        bookId: bookProgress.bookId,
        score,
        total,
        passed: examRecord.passed,
        firstTime: examRecord.firstTime,
        creditReward: examRecord.creditReward,
        forgeUnlocked,
        newBalance: wallet.balance,
    });

    return {
        passed: examRecord.passed,
        firstTime: examRecord.firstTime,
        creditReward: examRecord.creditReward,
        score,
        total,
        forgeUnlocked,
    };
}

