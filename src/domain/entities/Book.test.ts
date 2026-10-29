import { describe, expect, it } from 'vitest';
import { BookProgress } from './Book';

describe('BookProgress Entity', () =>
{
    it('initializes with default values', () =>
    {
        const book = new BookProgress('book-ch1');
        expect(book.bookId).toBe('book-ch1');
        expect(book.isUnlocked).toBe(false);
        expect(book.readPages).toEqual([]);
        expect(book.examPassed).toBe(false);
        expect(book.bestScore).toBe(0);
        expect(book.attempts).toBe(0);
    });

    it('blocks marking pages read or taking exam before purchase (unlocked = false)', () =>
    {
        const book = new BookProgress('book-ch1', false);
        expect(book.markPageRead(1)).toBe(false);
        expect(book.readPages).toEqual([]);
        expect(book.hasReadPage(1)).toBe(false);
        expect(book.isFullyRead(3)).toBe(false);
        expect(book.canTakeExam(3)).toBe(false);
        expect(book.getReadProgress(3)).toEqual({
            readCount: 0,
            totalPages: 3,
            percentage: 0,
            isComplete: false,
        });
    });

    it('tracks read pages accurately and unlocks exam only when fully read', () =>
    {
        const book = new BookProgress('book-ch1', true);
        expect(book.markPageRead(1)).toBe(true);
        expect(book.markPageRead(3)).toBe(true);
        expect(book.markPageRead(1)).toBe(false); // duplicate

        expect(book.readPages).toEqual([1, 3]);
        expect(book.hasReadPage(1)).toBe(true);
        expect(book.hasReadPage(2)).toBe(false);
        expect(book.hasReadPage(3)).toBe(true);
        expect(book.isFullyRead(3)).toBe(false);
        expect(book.canTakeExam(3)).toBe(false);
        expect(book.getReadProgress(3)).toEqual({
            readCount: 2,
            totalPages: 3,
            percentage: 67,
            isComplete: false,
        });

        book.markPageRead(2);
        expect(book.isFullyRead(3)).toBe(true);
        expect(book.canTakeExam(3)).toBe(true);
        expect(book.getReadProgress(3)).toEqual({
            readCount: 3,
            totalPages: 3,
            percentage: 100,
            isComplete: true,
        });
    });

    it('handles exam failure (score < 4/5)', () =>
    {
        const book = new BookProgress('book-ch1', true);
        const result = book.recordExamResult(3, 5);

        expect(result.passed).toBe(false);
        expect(result.firstTime).toBe(false);
        expect(result.creditReward).toBe(0);
        expect(book.examPassed).toBe(false);
        expect(book.bestScore).toBe(3);
        expect(book.attempts).toBe(1);
    });

    it('awards 50 credit on first exam pass (score >= 4/5)', () =>
    {
        const book = new BookProgress('book-ch1', true);
        const result = book.recordExamResult(4, 5);

        expect(result.passed).toBe(true);
        expect(result.firstTime).toBe(true);
        expect(result.creditReward).toBe(50);
        expect(book.examPassed).toBe(true);
        expect(book.bestScore).toBe(4);
        expect(book.attempts).toBe(1);
    });

    it('awards 5 credit on repeat exam pass', () =>
    {
        const book = new BookProgress('book-ch1', true, [1, 2, 3, 4, 5], true, 4, 1);
        const result = book.recordExamResult(5, 5);

        expect(result.passed).toBe(true);
        expect(result.firstTime).toBe(false);
        expect(result.creditReward).toBe(5);
        expect(book.bestScore).toBe(5);
        expect(book.attempts).toBe(2);
    });

    it('serializes and deserializes cleanly via snapshot', () =>
    {
        const original = new BookProgress('book-ch1', true, [1, 2], true, 4, 2);
        const snapshot = original.toSnapshot();
        const restored = BookProgress.fromSnapshot(snapshot);

        expect(restored.bookId).toBe('book-ch1');
        expect(restored.isUnlocked).toBe(true);
        expect(restored.readPages).toEqual([1, 2]);
        expect(restored.examPassed).toBe(true);
        expect(restored.bestScore).toBe(4);
        expect(restored.attempts).toBe(2);
    });

    describe('resit reward cap', () =>
    {
        const passedBook = (): BookProgress => new BookProgress('b1', true, [1, 2, 3], true, 5, 1);

        it('pays the +5 resit reward only once per day', () =>
        {
            const book = passedBook();

            const first = book.recordExamResult(5, 5, '2026-10-28');
            const second = book.recordExamResult(5, 5, '2026-10-28');

            expect(first).toMatchObject({ passed: true, firstTime: false, creditReward: 5 });
            expect(second).toMatchObject({ passed: true, firstTime: false, creditReward: 0 });
        });

        it('pays again on the next day', () =>
        {
            const book = passedBook();
            book.recordExamResult(4, 5, '2026-10-28');

            expect(book.recordExamResult(5, 5, '2026-10-29').creditReward).toBe(5);
        });

        it('keeps the resit date through a snapshot round trip', () =>
        {
            const book = passedBook();
            book.recordExamResult(5, 5, '2026-10-28');

            const restored = BookProgress.fromSnapshot(book.toSnapshot());

            expect(restored.recordExamResult(5, 5, '2026-10-28').creditReward).toBe(0);
        });
    });
});
