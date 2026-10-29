import React, { useEffect, useState } from 'react';
import { BookDefinition, BookProgress } from '../../../domain/entities/Book';
import {
    checkBookPurchaseEligibility,
    purchaseBookUseCase,
} from '../../../application/PurchaseBookUseCase';
import { readBookPageUseCase } from '../../../application/ReadBookPageUseCase';
import { getGameContent } from '../../content/ContentCatalog';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';

export type TextbookModalMode = 'library-store' | 'reader';

export interface TextbookModalProps
{
    isOpen: boolean;
    mode?: TextbookModalMode;
    isInVillage?: boolean;
    initialBookId?: string;
    /** Book page number (1-based) to open the reader on, e.g. from an exam review. */
    initialPageNumber?: number;
    pageReadTimerSeconds?: number;
    onClose: () => void;
    onBookPurchased?: (bookId: string, newBalance: number) => void;
    onPageRead?: (bookId: string, pageNumber: number, isFullyRead: boolean) => void;
    onGoToExam?: (bookId: string) => void;
}

export const TextbookModal: React.FC<TextbookModalProps> = ({
    isOpen,
    mode = 'reader',
    isInVillage = true,
    initialBookId,
    initialPageNumber,
    pageReadTimerSeconds = 5,
    onClose,
    onBookPurchased,
    onPageRead,
    onGoToExam,
}) =>
{
    const [books] = useState<BookDefinition[]>(() => getGameContent().books);
    const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || 'book-ch1');
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
    const [storeSubView, setStoreSubView] = useState<'shelf' | 'reading'>('shelf');
    const [remainingReadSeconds, setRemainingReadSeconds] = useState<number>(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [, setRevision] = useState(0);

    // Reset sub-view whenever modal opens or mode changes
    useEffect(() =>
    {
        if (!isOpen) return;
        setToastMessage(null);

        if (mode === 'library-store')
        {
            setStoreSubView('shelf');
            if (initialBookId)
            {
                setSelectedBookId(initialBookId);
            }
        }
        else
        {
            setStoreSubView('reading');
            const ownedIds = Object.values(entities.books)
                .filter(bp => bp.isUnlocked)
                .map(bp => bp.bookId);
            if (initialBookId && entities.books[initialBookId]?.isUnlocked)
            {
                setSelectedBookId(initialBookId);
            }
            else if (ownedIds.length > 0 && !ownedIds.includes(selectedBookId))
            {
                setSelectedBookId(ownedIds[0]);
            }
            const targetBook = books.find(b => b.id === (initialBookId ?? selectedBookId));
            const pageIndex = initialPageNumber && targetBook
                ? targetBook.pages.findIndex(p => p.pageNumber === initialPageNumber)
                : -1;
            setCurrentPageIndex(pageIndex >= 0 ? pageIndex : 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, mode, initialBookId, initialPageNumber, books.length]);

    const ensureBookProgress = (bookId: string): BookProgress =>
    {
        let bp = entities.books[bookId];
        if (!bp)
        {
            bp = new BookProgress(bookId, false);
            entities.books[bookId] = bp;
        }
        return bp;
    };

    const ownedBooks = books.filter(b => entities.books[b.id]?.isUnlocked);
    const isReadingActive = mode === 'reader' ? ownedBooks.length > 0 : storeSubView === 'reading';

    const activeBookList = mode === 'reader' ? ownedBooks : books;
    const currentBook = activeBookList.find(b => b.id === selectedBookId) || activeBookList[0] || null;
    const bookProgress = currentBook ? ensureBookProgress(currentBook.id) : null;
    const pages = currentBook?.pages || [];
    const activePage = pages[currentPageIndex] || pages[0] || null;
    const isPageAlreadyRead = Boolean(
        bookProgress && activePage && bookProgress.hasReadPage(activePage.pageNumber)
    );

    // 3-second countdown timer for first-time page reading
    useEffect(() =>
    {
        if (!isOpen || !isReadingActive || !bookProgress?.isUnlocked || !activePage)
        {
            setRemainingReadSeconds(0);
            return;
        }

        if (bookProgress.hasReadPage(activePage.pageNumber))
        {
            setRemainingReadSeconds(0);
            return;
        }

        const initialWait = Math.max(0, Math.floor(pageReadTimerSeconds));
        setRemainingReadSeconds(initialWait);
        if (initialWait <= 0) return;

        const timer = window.setInterval(() =>
        {
            setRemainingReadSeconds(prev =>
            {
                if (prev <= 1)
                {
                    window.clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isOpen, isReadingActive, currentBook?.id, activePage, isPageAlreadyRead, pageReadTimerSeconds, bookProgress]);

    // Keyboard navigation (Escape to close, Left/Right when reviewing already-read pages)
    useEffect(() =>
    {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === 'Escape')
            {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const showToast = (msg: string) =>
    {
        setToastMessage(msg);
        window.setTimeout(() => setToastMessage(null), 3000);
    };

    const handlePurchaseBook = (book: BookDefinition) =>
    {
        ensureBookProgress(book.id);
        const result = purchaseBookUseCase(
            book,
            entities.books,
            entities.wallet,
            entities.stageProgression
        );

        if (result.success)
        {
            soundManager.playBuy();
            onBookPurchased?.(book.id, result.remainingBalance);
            setSelectedBookId(book.id);
            setCurrentPageIndex(0);
            showToast(`🎉 ຊື້ປຶ້ມ "${book.title}" ສຳເລັດ! ກົດ "ເປີດອ່ານຕຳລາ" ໄດ້ເລີຍ!`);
            setRevision(r => r + 1);
        }
        else
        {
            soundManager.playHurt();
            if (result.reason === 'insufficient_credit')
            {
                showToast('❌ Credit ບໍ່ພຽງພໍສຳລັບຊື້ປຶ້ມເຫຼັ້ມນີ້');
            }
            else
            {
                showToast('🔒 ຍັງບໍ່ຜ່ານເງື່ອນໄຂການປົດລັອກບົດຮຽນນີ້');
            }
        }
    };

    const handleOpenBookInReader = (bookId: string) =>
    {
        const bp = ensureBookProgress(bookId);
        if (!bp.isUnlocked) return;

        soundManager.playSelect();
        setSelectedBookId(bookId);
        // Jump to first unread page if any, else page 0
        const targetBook = books.find(b => b.id === bookId);
        if (targetBook)
        {
            const firstUnreadIdx = targetBook.pages.findIndex(p => !bp.hasReadPage(p.pageNumber));
            setCurrentPageIndex(firstUnreadIdx >= 0 ? firstUnreadIdx : 0);
        }
        else
        {
            setCurrentPageIndex(0);
        }
        setStoreSubView('reading');
    };

    const handlePrevPage = () =>
    {
        if (currentPageIndex > 0)
        {
            soundManager.playSelect();
            setCurrentPageIndex(p => p - 1);
        }
    };

    const handleConfirmReadAndAdvance = () =>
    {
        if (!currentBook || !bookProgress || !activePage) return;
        if (!isPageAlreadyRead && remainingReadSeconds > 0) return;

        if (!isPageAlreadyRead)
        {
            const res = readBookPageUseCase(bookProgress, activePage.pageNumber, pages.length);
            if (res.success)
            {
                soundManager.playPowerUp();
                onPageRead?.(currentBook.id, activePage.pageNumber, res.isFullyRead);
                setRevision(r => r + 1);
            }
        }
        else
        {
            soundManager.playSelect();
        }

        if (currentPageIndex < pages.length - 1)
        {
            setCurrentPageIndex(p => p + 1);
        }
    };

    const handleTakeExam = (bookId: string) =>
    {
        const targetBook = books.find(b => b.id === bookId);
        const bp = entities.books[bookId];
        if (!targetBook || !bp || !bp.canTakeExam(targetBook.pages.length))
        {
            soundManager.playHurt();
            return;
        }

        onClose();
        if (onGoToExam)
        {
            onGoToExam(bookId);
        }
        else
        {
            EventBus.emit('open-academy', bookId);
        }
    };

    const readProgress = currentBook && bookProgress
        ? bookProgress.getReadProgress(pages.length)
        : { readCount: 0, totalPages: 0, percentage: 0, isComplete: false };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-slate-950/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{mode === 'library-store' ? '🏛️' : '📚'}</span>
                        <div>
                            <h2 className="text-xl font-bold text-amber-300">
                                {mode === 'library-store'
                                    ? 'ຫໍສະໝຸດແຫ່ງປັນຍາ (Library Bookstore)'
                                    : 'ປຶ້ມຕຳລາສ່ວນຕົວ (My Textbooks)'}
                            </h2>
                            <p className="text-xs text-slate-400">
                                {mode === 'library-store'
                                    ? 'ເລືອກຊື້ປຶ້ມຕຳລາຮຽນດ້ວຍ Credit ເພື່ອເປີດອ່ານ ແລະ ປົດລັອກການສອບເສັງ'
                                    : 'ເປີດອ່ານທົບທວນປຶ້ມຕຳລາທີ່ຊື້ມາແລ້ວໄດ້ທຸກເວລາ'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm flex items-center gap-1.5">
                            <span>🎓</span>
                            <span>{entities.wallet.balance} Credit</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                            title="ປິດ (Escape)"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Toast notification */}
                {toastMessage && (
                    <div className="px-6 py-2.5 bg-emerald-950/40 border-b border-emerald-500/40 text-emerald-300 text-sm font-bold text-center">
                        {toastMessage}
                    </div>
                )}

                {/* ==================== MODE 1: LIBRARY STORE SHELF ==================== */}
                {mode === 'library-store' && storeSubView === 'shelf' && (
                    <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-200">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-sm font-bold text-slate-300">
                                📚 ລາຍການປຶ້ມຕຳລາປະຈຳບົດຮຽນ ({ownedBooks.length}/{books.length} ເຫຼັ້ມທີ່ຊື້ແລ້ວ)
                            </span>
                            <span className="text-xs text-amber-300">
                                💡 ຕ້ອງຊື້ປຶ້ມກ່ອນ ຈຶ່ງສາມາດເປີດອ່ານ ແລະ ສອບເສັງໄດ້
                            </span>
                        </div>

                        <div className="space-y-4">
                            {books.map(book =>
                            {
                                const bp = ensureBookProgress(book.id);
                                const eligibility = checkBookPurchaseEligibility(
                                    book,
                                    entities.books,
                                    entities.wallet,
                                    entities.stageProgression
                                );
                                const prog = bp.getReadProgress(book.pages.length);
                                const isLockedByProgression =
                                    eligibility.reason === 'locked_prerequisite_exam' ||
                                    eligibility.reason === 'locked_prerequisite_boss';

                                return (
                                    <div
                                        key={book.id}
                                        className={`p-5 rounded-2xl border-2 transition space-y-3 ${
                                            bp.isUnlocked
                                                ? 'bg-slate-800/80 border-emerald-500/40'
                                                : isLockedByProgression
                                                    ? 'bg-slate-900/60 border-slate-800'
                                                    : 'bg-slate-800/60 border-amber-500/40'
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <span className="text-4xl">
                                                    {bp.isUnlocked ? '📖' : isLockedByProgression ? '🔒' : '📕'}
                                                </span>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                            ບົດທີ {book.chapter}
                                                        </span>
                                                        <h3 className="text-lg font-bold text-white">{book.title}</h3>
                                                        {bp.examPassed && (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                                                ⭐ ສອບຜ່ານແລ້ວ
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400">{book.titleEn} • {book.pages.length} ໜ້າ</p>
                                                </div>
                                            </div>

                                            <div>
                                                {bp.isUnlocked ? (
                                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                                        ✓ ຊື້ແລ້ວ (ອ່ານ {prog.readCount}/{prog.totalPages} ໜ້າ)
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                                        ລາຄາ: {book.price} 🎓 Credit
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm text-slate-300">{book.description}</p>

                                        {book.unlockedRecipes && book.unlockedRecipes.length > 0 && (
                                            <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                                <span>🎁 ສູດສ້າງທີ່ຈະໄດ້ຮັບເມື່ອສອບຜ່ານ:</span>
                                                <span className="text-amber-300 font-semibold">
                                                    {book.unlockedRecipes.join(', ')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Progression Lock Checklist for Chapter 2+ */}
                                        {!bp.isUnlocked && isLockedByProgression && (
                                            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-700/60 space-y-1.5 text-xs">
                                                <div className="font-bold text-rose-300">
                                                    🔒 ເງື່ອນໄຂກ່ອນເປີດຂາຍປຶ້ມບົດທີ {book.chapter}:
                                                </div>
                                                {book.prerequisiteBookId && (
                                                    <div className={eligibility.prereqExamPassed ? 'text-emerald-400' : 'text-slate-400'}>
                                                        {eligibility.prereqExamPassed ? '✓' : '○'} ສອບເສັງປຶ້ມບົດກ່ອນໜ້າຜ່ານ ({book.prerequisiteBookId})
                                                    </div>
                                                )}
                                                {book.requiredCompletedStageId && (
                                                    <div className={eligibility.prereqBossDefeated ? 'text-emerald-400' : 'text-slate-400'}>
                                                        {eligibility.prereqBossDefeated ? '✓' : '○'} ປາບ Boss ປະຈຳດ່ານບົດກ່ອນໜ້າສຳເລັດ ({book.requiredCompletedStageId})
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                            {bp.isUnlocked ? (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenBookInReader(book.id)}
                                                        className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow transition"
                                                    >
                                                        📖 ເປີດອ່ານຕຳລາ ({prog.readCount}/{prog.totalPages})
                                                    </button>
                                                    {prog.isComplete && isInVillage && (
                                                        <button
                                                            onClick={() => handleTakeExam(book.id)}
                                                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow transition"
                                                        >
                                                            📝 ໄປສອບເສັງທີ່ສະຖາບັນ
                                                        </button>
                                                    )}
                                                </div>
                                            ) : isLockedByProgression ? (
                                                <button
                                                    disabled
                                                    className="px-5 py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm border border-slate-700"
                                                >
                                                    🔒 ຍັງບໍ່ປົດລັອກບົດຮຽນນີ້
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchaseBook(book)}
                                                    disabled={!eligibility.canPurchase}
                                                    className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition ${
                                                        eligibility.canPurchase
                                                            ? 'bg-amber-600 hover:bg-cyan-500 text-white'
                                                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                                                    }`}
                                                >
                                                    {eligibility.canPurchase
                                                        ? `🛒 ຊື້ປຶ້ມຕຳລາ (${book.price} 🎓 Credit)`
                                                        : `Credit ບໍ່ພໍ (ຕ້ອງການ ${book.price} 🎓)`}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ==================== MODE 2: EMPTY READER STATE (0 BOOKS OWNED) ==================== */}
                {mode === 'reader' && ownedBooks.length === 0 && (
                    <div className="p-12 overflow-y-auto flex-1 text-center space-y-4 text-slate-200">
                        <div className="text-6xl">📕🔒</div>
                        <h3 className="text-xl font-bold text-amber-300">
                            ທ່ານຍັງບໍ່ມີປຶ້ມຕຳລາຮຽນໃນຄອບຄອງ
                        </h3>
                        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                            ປຶ້ມຕຳລາທຸກເຫຼັ້ມຕ້ອງຊື້ເອົາກ່ອນຈຶ່ງສາມາດເປີດອ່ານໄດ້!
                            ກະລຸນາຍ່າງໄປທີ່ອາຄານ <strong className="text-amber-300">🏛️ ຫໍສະໝຸດ (Library)</strong> ໃນໝູ່ບ້ານ
                            ເພື່ອເລືອກຊື້ປຶ້ມຕຳລາບົດທີ 1.
                        </p>
                        <div className="pt-2">
                            <span className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 font-semibold">
                                🎓 ທຶນປັດຈຸບັນຂອງທ່ານ: {entities.wallet.balance} Credit (ລາຄາບົດທີ 1: 20 Credit)
                            </span>
                        </div>
                        <div className="pt-4">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition"
                            >
                                ຮັບຊາບ (ປິດໜ້າຕ່າງ)
                            </button>
                        </div>
                    </div>
                )}

                {/* ==================== ACTIVE BOOK READER VIEW ==================== */}
                {isReadingActive && currentBook && bookProgress?.isUnlocked && activePage && (
                    <>
                        {/* Reader Subbar: Back to Shelf (if in Library Store) + Owned Book Tabs */}
                        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-2.5 border-b border-slate-700/60 bg-slate-900/60">
                            <div className="flex items-center gap-2 overflow-x-auto">
                                {mode === 'library-store' && (
                                    <button
                                        onClick={() =>
                                        {
                                            soundManager.playSelect();
                                            setStoreSubView('shelf');
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/30 transition"
                                    >
                                        ⬅️ ກັບໄປໜ້າຮ້ານຫໍສະໝຸດ
                                    </button>
                                )}

                                {ownedBooks.map(b =>
                                {
                                    const bp = ensureBookProgress(b.id);
                                    const isSelected = b.id === currentBook.id;
                                    return (
                                        <button
                                            key={b.id}
                                            onClick={() =>
                                            {
                                                setSelectedBookId(b.id);
                                                setCurrentPageIndex(0);
                                                soundManager.playSelect();
                                            }}
                                            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition flex items-center gap-1.5 ${
                                                isSelected
                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400 font-bold'
                                                    : 'text-slate-400 hover:text-white bg-slate-800/50'
                                            }`}
                                        >
                                            <span>📖</span>
                                            <span>ບົດທີ {b.chapter}: {b.title}</span>
                                            {bp.examPassed && <span>⭐</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            <span className="text-xs font-bold text-emerald-300">
                                ອ່ານແລ້ວ {readProgress.readCount}/{readProgress.totalPages} ໜ້າ ({readProgress.percentage}%)
                            </span>
                        </div>

                        {/* Page Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded">
                                    ໜ້າທີ {activePage.pageNumber} / {pages.length}
                                </span>
                                {isPageAlreadyRead ? (
                                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                        ✓ ອ່ານໜ້ານີ້ແລ້ວ
                                    </span>
                                ) : (
                                    <span className="text-xs text-amber-300 font-semibold">
                                        {remainingReadSeconds > 0
                                            ? `⏳ ກະລຸນາອ່ານເນື້ອຫາ (${remainingReadSeconds} ວິນາທີ)...`
                                            : '✨ ພ້ອມບັນທຶກການອ່ານໜ້ານີ້ແລ້ວ!'}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-2xl font-bold text-white border-l-4 border-amber-400 pl-3">
                                {activePage.title}
                            </h3>

                            {activePage.illustration && (
                                <div className="rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950/60 p-2 shadow-inner">
                                    <img
                                        src={activePage.illustration}
                                        alt={activePage.title}
                                        className="w-full max-w-xl mx-auto h-auto block rounded-lg"
                                    />
                                </div>
                            )}

                            <div className="text-slate-300 leading-relaxed whitespace-pre-line bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                {activePage.content}
                            </div>

                            {activePage.keyPoints && activePage.keyPoints.length > 0 && (
                                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 space-y-2">
                                    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                                        <span>💡</span> ຈຸດສຳຄັນທີ່ຕ້ອງຈື່ (Key Takeaways)
                                    </h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-emerald-100">
                                        {activePage.keyPoints.map((kp, idx) => (
                                            <li key={idx}>{kp}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Page Dot Indicators */}
                            <div className="flex items-center justify-center gap-2 pt-2">
                                {pages.map((p, idx) =>
                                {
                                    const read = bookProgress.hasReadPage(p.pageNumber);
                                    const active = idx === currentPageIndex;
                                    return (
                                        <button
                                            key={p.pageNumber}
                                            onClick={() =>
                                            {
                                                soundManager.playSelect();
                                                setCurrentPageIndex(idx);
                                            }}
                                            className={`px-2.5 py-1 rounded-md text-xs font-bold border transition ${
                                                active
                                                    ? 'bg-amber-600 text-white border-amber-400'
                                                    : read
                                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                            }`}
                                            title={`ໜ້າທີ ${p.pageNumber}`}
                                        >
                                            {p.pageNumber} {read ? '✓' : ''}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reader Footer Controls */}
                        <div className="px-6 py-4 border-t border-slate-700/60 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPageIndex === 0}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                        currentPageIndex > 0
                                            ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                            : 'bg-slate-800 text-slate-500'
                                    }`}
                                >
                                    ⬅️ ໜ້າກ່ອນ
                                </button>

                                {/* Primary Read Confirmation / Next Page Button */}
                                {!isPageAlreadyRead ? (
                                    <button
                                        onClick={handleConfirmReadAndAdvance}
                                        disabled={remainingReadSeconds > 0}
                                        className={`px-5 py-2 rounded-lg font-bold text-sm transition shadow ${
                                            remainingReadSeconds > 0
                                                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                        }`}
                                    >
                                        {remainingReadSeconds > 0
                                            ? `⏳ ກຳລັງອ່ານ... (${remainingReadSeconds}s)`
                                            : currentPageIndex < pages.length - 1
                                                ? '✓ ອ່ານເຂົ້າໃຈແລ້ວ & ໜ້າຕໍ່ໄປ ➡️'
                                                : '🎉 ຢືນຢັນອ່ານຈົບໜ້າສຸດທ້າຍ!'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleConfirmReadAndAdvance}
                                        disabled={currentPageIndex >= pages.length - 1}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                            currentPageIndex < pages.length - 1
                                                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                                : 'bg-slate-800 text-slate-500'
                                        }`}
                                    >
                                        ໜ້າຕໍ່ໄປ ➡️
                                    </button>
                                )}
                            </div>

                            {isInVillage && (
                                readProgress.isComplete ? (
                                    <button
                                        onClick={() => handleTakeExam(currentBook.id)}
                                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
                                    >
                                        <span>📝</span>
                                        <span>ໄປສອບເສັງທີ່ສະຖາບັນ</span>
                                    </button>
                                ) : (
                                    <span className="text-xs text-slate-400 font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                                        🔒 ອ່ານໃຫ້ຄົບທຸກໜ້າກ່ອນສອບ ({readProgress.readCount}/{readProgress.totalPages})
                                    </span>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
