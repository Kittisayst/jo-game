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

    it('tracks read pages accurately', () =>
    {
        const book = new BookProgress('book-ch1', true);
        book.markPageRead(1);
        book.markPageRead(3);
        book.markPageRead(1); // duplicate

        expect(book.readPages).toEqual([1, 3]);
        expect(book.hasReadPage(1)).toBe(true);
        expect(book.hasReadPage(2)).toBe(false);
        expect(book.hasReadPage(3)).toBe(true);
        expect(book.isFullyRead(3)).toBe(false);

        book.markPageRead(2);
        expect(book.isFullyRead(3)).toBe(true);
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
});

