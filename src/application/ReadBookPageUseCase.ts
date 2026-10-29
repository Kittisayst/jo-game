import { BookProgress } from '../domain/entities/Book';
import { DomainEvents } from '../domain/DomainEvents';

export const BOOK_PAGE_READ_EVENT = 'book-page-read';

export interface BookPageReadPayload
{
    bookId: string;
    pageNumber: number;
    readCount: number;
    totalPages: number;
    isFullyRead: boolean;
}

export interface ReadBookPageResult
{
    success: boolean;
    reason?: 'book_not_purchased' | 'invalid_page';
    newlyRead: boolean;
    readCount: number;
    totalPages: number;
    isFullyRead: boolean;
}

export function readBookPageUseCase (
    bookProgress: BookProgress,
    pageNumber: number,
    totalPages: number
): ReadBookPageResult
{
    const safeTotal = Math.max(0, Math.floor(totalPages));

    if (!bookProgress.isUnlocked)
    {
        return {
            success: false,
            reason: 'book_not_purchased',
            newlyRead: false,
            readCount: 0,
            totalPages: safeTotal,
            isFullyRead: false,
        };
    }

    if (pageNumber < 1 || (safeTotal > 0 && pageNumber > safeTotal))
    {
        const prog = bookProgress.getReadProgress(safeTotal);
        return {
            success: false,
            reason: 'invalid_page',
            newlyRead: false,
            readCount: prog.readCount,
            totalPages: safeTotal,
            isFullyRead: prog.isComplete,
        };
    }

    const newlyRead = bookProgress.markPageRead(pageNumber);
    const prog = bookProgress.getReadProgress(safeTotal);

    DomainEvents.emit<BookPageReadPayload>(BOOK_PAGE_READ_EVENT, {
        bookId: bookProgress.bookId,
        pageNumber,
        readCount: prog.readCount,
        totalPages: safeTotal,
        isFullyRead: prog.isComplete,
    });

    return {
        success: true,
        newlyRead,
        readCount: prog.readCount,
        totalPages: safeTotal,
        isFullyRead: prog.isComplete,
    };
}

