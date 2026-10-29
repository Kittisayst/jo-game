import { BookDefinition, BookProgress } from '../domain/entities/Book';
import { Wallet } from '../domain/entities/Wallet';
import { StageProgression } from '../domain/entities/StageProgression';
import { DomainEvents } from '../domain/DomainEvents';

export const BOOK_PURCHASED_EVENT = 'book-purchased';

export type BookPurchaseBlockReason =
    | 'already_owned'
    | 'locked_prerequisite_exam'
    | 'locked_prerequisite_boss'
    | 'insufficient_credit';

export interface BookPurchaseEligibility
{
    canPurchase: boolean;
    reason?: BookPurchaseBlockReason;
    prereqExamPassed: boolean;
    prereqBossDefeated: boolean;
    hasEnoughCredit: boolean;
}

export interface BookPurchasedPayload
{
    bookId: string;
    pricePaid: number;
    remainingBalance: number;
}

export interface PurchaseBookResult
{
    success: boolean;
    reason?: BookPurchaseBlockReason;
    remainingBalance: number;
}

export function checkBookPurchaseEligibility (
    bookDef: BookDefinition,
    booksMap: Record<string, BookProgress>,
    wallet: Wallet,
    stageProgression?: StageProgression
): BookPurchaseEligibility
{
    const existing = booksMap[bookDef.id];
    const prereqExamPassed = bookDef.prerequisiteBookId
        ? Boolean(booksMap[bookDef.prerequisiteBookId]?.examPassed)
        : true;
    const prereqBossDefeated = bookDef.requiredCompletedStageId
        ? Boolean(stageProgression?.isStageCompleted(bookDef.requiredCompletedStageId))
        : true;
    const hasEnoughCredit = wallet.canAfford(bookDef.price);

    if (existing?.isUnlocked)
    {
        return {
            canPurchase: false,
            reason: 'already_owned',
            prereqExamPassed,
            prereqBossDefeated,
            hasEnoughCredit,
        };
    }

    if (!prereqExamPassed)
    {
        return {
            canPurchase: false,
            reason: 'locked_prerequisite_exam',
            prereqExamPassed,
            prereqBossDefeated,
            hasEnoughCredit,
        };
    }

    if (!prereqBossDefeated)
    {
        return {
            canPurchase: false,
            reason: 'locked_prerequisite_boss',
            prereqExamPassed,
            prereqBossDefeated,
            hasEnoughCredit,
        };
    }

    if (!hasEnoughCredit)
    {
        return {
            canPurchase: false,
            reason: 'insufficient_credit',
            prereqExamPassed,
            prereqBossDefeated,
            hasEnoughCredit,
        };
    }

    return {
        canPurchase: true,
        prereqExamPassed,
        prereqBossDefeated,
        hasEnoughCredit,
    };
}

export function purchaseBookUseCase (
    bookDef: BookDefinition,
    booksMap: Record<string, BookProgress>,
    wallet: Wallet,
    stageProgression?: StageProgression
): PurchaseBookResult
{
    const eligibility = checkBookPurchaseEligibility(bookDef, booksMap, wallet, stageProgression);
    if (!eligibility.canPurchase)
    {
        return {
            success: false,
            reason: eligibility.reason,
            remainingBalance: wallet.balance,
        };
    }

    const spent = wallet.spend(bookDef.price);
    if (!spent)
    {
        return {
            success: false,
            reason: 'insufficient_credit',
            remainingBalance: wallet.balance,
        };
    }

    let progress = booksMap[bookDef.id];
    if (!progress)
    {
        progress = new BookProgress(bookDef.id, true);
        booksMap[bookDef.id] = progress;
    }
    else
    {
        progress.unlock();
    }

    DomainEvents.emit<BookPurchasedPayload>(BOOK_PURCHASED_EVENT, {
        bookId: bookDef.id,
        pricePaid: bookDef.price,
        remainingBalance: wallet.balance,
    });

    return {
        success: true,
        remainingBalance: wallet.balance,
    };
}

