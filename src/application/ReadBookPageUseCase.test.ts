import { describe, expect, it } from 'vitest';
import { readBookPageUseCase } from './ReadBookPageUseCase';
import { BookProgress } from '../domain/entities/Book';

describe('ReadBookPageUseCase', () =>
{
    it('blocks reading pages when book is not purchased', () =>
    {
        const book = new BookProgress('book-ch1', false);
        const res = readBookPageUseCase(book, 1, 3);

        expect(res.success).toBe(false);
        expect(res.reason).toBe('book_not_purchased');
        expect(book.readPages).toEqual([]);
    });

    it('rejects out-of-range page numbers', () =>
    {
        const book = new BookProgress('book-ch1', true);
        expect(readBookPageUseCase(book, 0, 3).reason).toBe('invalid_page');
        expect(readBookPageUseCase(book, 4, 3).reason).toBe('invalid_page');
    });

    it('records page reads and detects completion across all pages', () =>
    {
        const book = new BookProgress('book-ch1', true);

        const r1 = readBookPageUseCase(book, 1, 2);
        expect(r1.success).toBe(true);
        expect(r1.newlyRead).toBe(true);
        expect(r1.readCount).toBe(1);
        expect(r1.isFullyRead).toBe(false);

        // Re-reading same page
        const r1Dup = readBookPageUseCase(book, 1, 2);
        expect(r1Dup.success).toBe(true);
        expect(r1Dup.newlyRead).toBe(false);

        const r2 = readBookPageUseCase(book, 2, 2);
        expect(r2.success).toBe(true);
        expect(r2.newlyRead).toBe(true);
        expect(r2.readCount).toBe(2);
        expect(r2.isFullyRead).toBe(true);
    });
});

