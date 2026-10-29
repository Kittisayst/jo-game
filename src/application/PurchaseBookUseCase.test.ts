import { describe, expect, it } from 'vitest';
import { purchaseBookUseCase, checkBookPurchaseEligibility } from './PurchaseBookUseCase';
import { BookDefinition, BookProgress } from '../domain/entities/Book';
import { Wallet } from '../domain/entities/Wallet';
import { StageProgression } from '../domain/entities/StageProgression';

const bookCh1: BookDefinition = {
    id: 'book-ch1',
    chapter: 1,
    title: 'Chapter 1',
    titleEn: 'Chapter 1',
    description: 'Intro',
    price: 20,
    prerequisiteBookId: null,
    requiredCompletedStageId: null,
    unlockedRecipes: [],
    pages: [{ pageNumber: 1, title: 'P1', content: 'C1', keyPoints: [] }],
};

const bookCh2: BookDefinition = {
    id: 'book-ch2',
    chapter: 2,
    title: 'Chapter 2',
    titleEn: 'Chapter 2',
    description: 'Networking',
    price: 60,
    prerequisiteBookId: 'book-ch1',
    requiredCompletedStageId: 'stage-010',
    unlockedRecipes: [],
    pages: [{ pageNumber: 1, title: 'P1', content: 'C1', keyPoints: [] }],
};

describe('PurchaseBookUseCase', () =>
{
    it('purchases starter book when player has sufficient Credit', () =>
    {
        const books: Record<string, BookProgress> = {
            'book-ch1': new BookProgress('book-ch1', false),
        };
        const wallet = new Wallet(50);
        const stages = new StageProgression();

        const res = purchaseBookUseCase(bookCh1, books, wallet, stages);
        expect(res.success).toBe(true);
        expect(res.remainingBalance).toBe(30);
        expect(wallet.balance).toBe(30);
        expect(books['book-ch1'].isUnlocked).toBe(true);
    });

    it('rejects duplicate purchase when book is already owned', () =>
    {
        const books: Record<string, BookProgress> = {
            'book-ch1': new BookProgress('book-ch1', true),
        };
        const wallet = new Wallet(50);

        const res = purchaseBookUseCase(bookCh1, books, wallet);
        expect(res.success).toBe(false);
        expect(res.reason).toBe('already_owned');
        expect(wallet.balance).toBe(50);
    });

    it('rejects purchase when Credit is insufficient', () =>
    {
        const books: Record<string, BookProgress> = {
            'book-ch1': new BookProgress('book-ch1', false),
        };
        const wallet = new Wallet(15);

        const res = purchaseBookUseCase(bookCh1, books, wallet);
        expect(res.success).toBe(false);
        expect(res.reason).toBe('insufficient_credit');
        expect(books['book-ch1'].isUnlocked).toBe(false);
    });

    it('blocks Chapter 2 book until Chapter 1 exam is passed AND Chapter 1 Boss stage is completed', () =>
    {
        const books: Record<string, BookProgress> = {
            'book-ch1': new BookProgress('book-ch1', true),
        };
        const wallet = new Wallet(100);
        const stages = new StageProgression(['village', 'level-1', 'stage-010'], []);

        // 1. Neither exam passed nor boss defeated
        const res1 = purchaseBookUseCase(bookCh2, books, wallet, stages);
        expect(res1.success).toBe(false);
        expect(res1.reason).toBe('locked_prerequisite_exam');

        // 2. Exam passed, but boss stage-010 NOT completed yet
        books['book-ch1'].recordExamResult(5, 5);
        const elig2 = checkBookPurchaseEligibility(bookCh2, books, wallet, stages);
        expect(elig2.prereqExamPassed).toBe(true);
        expect(elig2.prereqBossDefeated).toBe(false);

        const res2 = purchaseBookUseCase(bookCh2, books, wallet, stages);
        expect(res2.success).toBe(false);
        expect(res2.reason).toBe('locked_prerequisite_boss');
        expect(wallet.balance).toBe(100);

        // 3. Boss stage-010 completed -> purchase succeeds!
        stages.completeStage('stage-010');
        const res3 = purchaseBookUseCase(bookCh2, books, wallet, stages);
        expect(res3.success).toBe(true);
        expect(res3.remainingBalance).toBe(40);
        expect(books['book-ch2'].isUnlocked).toBe(true);
    });
});
