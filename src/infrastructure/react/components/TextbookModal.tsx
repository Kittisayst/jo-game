import React, { useEffect, useState } from 'react';
import { BookDefinition, BookProgress } from '../../../domain/entities/Book';
import {
    checkBookPurchaseEligibility,
    purchaseBookUseCase,
} from '../../../application/PurchaseBookUseCase';
import { readBookPageUseCase } from '../../../application/ReadBookPageUseCase';
import { getGameContent } from '../../content/ContentCatalog';
import { entities } from '../../composition';
import { stageIdOf, stageOfLesson } from '../../../domain/entities/StageNumber';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { BookFrame, BookTabItem } from './book/BookFrame';

export type TextbookModalMode = 'library-store' | 'reader';

type LibraryTab = 'shop' | 'mine' | 'read';

export interface TextbookModalProps {
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

function lessonNotReachedNote(lesson: string): string {
    const stageNumber = stageOfLesson(lesson);
    if (stageNumber === null) return '';
    return entities.stageProgression.isStageCompleted(stageIdOf(stageNumber)) ? '' : ` · ດ່ານ ${stageNumber} ຍັງບໍ່ຜ່ານ`;
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
}) => {
    const [books] = useState<BookDefinition[]>(() => getGameContent().books);
    const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId || 'book-ch1');
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
    const [tab, setTab] = useState<LibraryTab>('shop');
    const [remainingReadSeconds, setRemainingReadSeconds] = useState<number>(0);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [, setRevision] = useState(0);

    // Reset sub-view whenever modal opens or mode changes
    useEffect(() => {
        if (!isOpen) return;
        setToastMessage(null);

        if (mode === 'library-store') {
            const hasBookForSale = getGameContent().books.some(b => !entities.books[b.id]?.isUnlocked);
            setTab(hasBookForSale ? 'shop' : 'mine');
            if (initialBookId) {
                setSelectedBookId(initialBookId);
            }
        } else {
            setTab('read');
            const ownedIds = Object.values(entities.books)
                .filter(bp => bp.isUnlocked)
                .map(bp => bp.bookId);
            if (initialBookId && entities.books[initialBookId]?.isUnlocked) {
                setSelectedBookId(initialBookId);
            } else if (ownedIds.length > 0 && !ownedIds.includes(selectedBookId)) {
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

    const ensureBookProgress = (bookId: string): BookProgress => {
        let bp = entities.books[bookId];
        if (!bp) {
            bp = new BookProgress(bookId, false);
            entities.books[bookId] = bp;
        }
        return bp;
    };

    const ownedBooks = books.filter(b => entities.books[b.id]?.isUnlocked);
    const booksForSale = books.filter(b => !entities.books[b.id]?.isUnlocked);
    const isReadingActive = tab === 'read';

    const currentBook = books.find(b => b.id === selectedBookId) || books[0] || null;
    const bookProgress = currentBook ? ensureBookProgress(currentBook.id) : null;
    const pages = currentBook?.pages || [];
    const activePage = pages[currentPageIndex] || pages[0] || null;
    const isPageAlreadyRead = Boolean(
        bookProgress && activePage && bookProgress.hasReadPage(activePage.pageNumber)
    );

    // Countdown timer for first-time page reading
    useEffect(() => {
        if (!isOpen || !isReadingActive || !bookProgress?.isUnlocked || !activePage) {
            setRemainingReadSeconds(0);
            return;
        }

        if (bookProgress.hasReadPage(activePage.pageNumber)) {
            setRemainingReadSeconds(0);
            return;
        }

        const initialWait = Math.max(0, Math.floor(pageReadTimerSeconds));
        setRemainingReadSeconds(initialWait);
        if (initialWait <= 0) return;

        const timer = window.setInterval(() => {
            setRemainingReadSeconds(prev => {
                if (prev <= 1) {
                    window.clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [isOpen, isReadingActive, currentBook?.id, activePage, isPageAlreadyRead, pageReadTimerSeconds, bookProgress]);

    if (!isOpen) return null;

    const showToast = (msg: string) => {
        setToastMessage(msg);
        window.setTimeout(() => setToastMessage(null), 3000);
    };

    const handlePurchaseBook = (book: BookDefinition) => {
        ensureBookProgress(book.id);
        const result = purchaseBookUseCase(
            book,
            entities.books,
            entities.wallet,
            entities.stageProgression
        );

        if (result.success) {
            soundManager.playBuy();
            onBookPurchased?.(book.id, result.remainingBalance);
            setSelectedBookId(book.id);
            setCurrentPageIndex(0);
            setTab('mine');
            showToast(`🎉 ຊື້ປຶ້ມ "${book.title}" ສຳເລັດ! ຍ້າຍໄປຢູ່ "ປຶ້ມຂອງຂ້ອຍ" ແລ້ວ — ກົດ "ເປີດອ່ານ" ໄດ້ເລີຍ!`);
            setRevision(r => r + 1);
        } else {
            soundManager.playHurt();
            if (result.reason === 'insufficient_credit') {
                showToast('❌ Credit ບໍ່ພຽງພໍສຳລັບຊື້ປຶ້ມເຫຼັ້ມນີ້');
            } else {
                showToast('🔒 ຍັງບໍ່ຜ່ານເງື່ອນໄຂການປົດລັອກບົດຮຽນນີ້');
            }
        }
    };

    const handleOpenBookInReader = (bookId: string) => {
        const bp = ensureBookProgress(bookId);
        if (!bp.isUnlocked) return;

        soundManager.playPageTurn();
        setSelectedBookId(bookId);
        const targetBook = books.find(b => b.id === bookId);
        if (targetBook) {
            const firstUnreadIdx = targetBook.pages.findIndex(p => !bp.hasReadPage(p.pageNumber));
            setCurrentPageIndex(firstUnreadIdx >= 0 ? firstUnreadIdx : 0);
        } else {
            setCurrentPageIndex(0);
        }
        setTab('read');
    };

    const handlePrevPage = () => {
        if (currentPageIndex > 0) {
            soundManager.playPageTurn();
            setCurrentPageIndex(p => p - 1);
        }
    };

    const handleConfirmReadAndAdvance = () => {
        if (!currentBook || !bookProgress || !activePage) return;
        if (!isPageAlreadyRead && remainingReadSeconds > 0) return;

        if (!isPageAlreadyRead) {
            const res = readBookPageUseCase(bookProgress, activePage.pageNumber, pages.length);
            if (res.success) {
                soundManager.playPowerUp();
                onPageRead?.(currentBook.id, activePage.pageNumber, res.isFullyRead);
                setRevision(r => r + 1);
            }
        } else {
            soundManager.playPageTurn();
        }

        if (currentPageIndex < pages.length - 1) {
            setCurrentPageIndex(p => p + 1);
        }
    };

    const handleTakeExam = (bookId: string) => {
        const targetBook = books.find(b => b.id === bookId);
        const bp = entities.books[bookId];
        if (!targetBook || !bp || !bp.canTakeExam(targetBook.pages.length)) {
            soundManager.playHurt();
            return;
        }

        onClose();
        if (onGoToExam) {
            onGoToExam(bookId);
        } else {
            EventBus.emit('open-academy', bookId);
        }
    };

    const readProgress = currentBook && bookProgress
        ? bookProgress.getReadProgress(pages.length)
        : { readCount: 0, totalPages: 0, percentage: 0, isComplete: false };

    const isStore = mode === 'library-store';

    const ribbonTabs: BookTabItem[] = isStore
        ? [
            { id: 'shop', icon: '🛒', label: 'ວາງຂາຍ', badge: booksForSale.length },
            { id: 'mine', icon: '🎒', label: 'ປຶ້ມຂອງຂ້ອຍ', badge: ownedBooks.length },
            { id: 'read', icon: '📖', label: 'ອ່ານ', disabled: ownedBooks.length === 0 },
        ]
        : [];

    const recipeLabel = (id: string) => {
        const item = getGameContent().items.find(i => i.id === id);
        return item ? `${item.icon ?? ''} ${item.name}`.trim() : id;
    };

    const windowTitle = isStore
        ? 'ຫໍສະໝຸດແຫ່ງປັນຍາ (Library Bookstore)'
        : 'ປຶ້ມຕຳລາສ່ວນຕົວ';

    const windowSubtitle = isStore
        ? 'ຊື້ປຶ້ມດ້ວຍ Credit · ເກັບໄວ້ໃນຊັ້ນຂອງຂ້ອຍ · ເປີດອ່ານເພື່ອປົດລັອກການສອບເສັງ'
        : currentBook
            ? `ບົດທີ ${currentBook.chapter}: ${currentBook.title}`
            : 'ປຶ້ມຕຳລາຮຽນເພື່ອເພີ່ມພູນຄວາມຮູ້';

    // -------------------------------------------------------------------------
    // 1. EMPTY READER STATE (0 Books Owned)
    // -------------------------------------------------------------------------
    if (tab === 'read' && ownedBooks.length === 0) {
        return (
            <BookFrame
                isOpen={isOpen}
                onClose={onClose}
                title={windowTitle}
                icon="📕"
                subtitle="ຍັງບໍ່ມີປຶ້ມຕຳລາໃນຄອບຄອງ"
                tabs={ribbonTabs}
                activeTab={tab}
                onTabChange={t => setTab(t as LibraryTab)}
                maxWidth="max-w-4xl"
                className="lib-card"
                leftPage={
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                        <div className="text-6xl drop-shadow">📕🔒</div>
                        <h3 className="text-lg sm:text-xl font-bold text-amber-900">
                            ທ່ານຍັງບໍ່ມີປຶ້ມຕຳລາຮຽນໃນຄອບຄອງ
                        </h3>
                        <p className="text-xs sm:text-sm text-amber-800/80 leading-relaxed max-w-xs">
                            ປຶ້ມຕຳລາທຸກເຫຼັ້ມຕ້ອງຊື້ເອົາກ່ອນຈຶ່ງສາມາດເປີດອ່ານໄດ້!
                        </p>
                    </div>
                }
                rightPage={
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                        <div className="p-4 rounded-xl bg-amber-100/60 border border-amber-300 text-xs text-amber-900 leading-relaxed text-left space-y-2">
                            <p className="font-bold flex items-center gap-1.5 text-amber-950">
                                <span>🏛️</span> ວິທີການເລີ່ມຕົ້ນ:
                            </p>
                            <p>
                                ຍ່າງໄປທີ່ອາຄານ <strong className="text-amber-900">ຫໍສະໝຸດ (Library)</strong> ໃນໝູ່ບ້ານ
                                ເພື່ອຊື້ປຶ້ມຕຳລາບົດທີ 1 ດ້ວຍ Credit ເລີ່ມຕົ້ນ.
                            </p>
                            <p className="font-semibold text-emerald-800">
                                🎓 ທຶນປັດຈຸບັນຂອງທ່ານ: {entities.wallet.balance} Credit
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-100 font-bold text-sm shadow transition"
                        >
                            ຮັບຊາບ (ປິດໜ້າຕ່າງ)
                        </button>
                    </div>
                }
                footer={
                    <div className="flex items-center justify-between w-full text-xs text-amber-200/80">
                        <span>🏛️ ຫໍສະໝຸດແຫ່ງປັນຍາ</span>
                        <span className="font-bold text-amber-300">🎓 {entities.wallet.balance} Credit</span>
                    </div>
                }
            />
        );
    }

    // -------------------------------------------------------------------------
    // 2. ACTIVE READER VIEW (Reading actual textbook pages)
    // -------------------------------------------------------------------------
    if (tab === 'read' && currentBook && bookProgress?.isUnlocked && activePage) {
        return (
            <BookFrame
                isOpen={isOpen}
                onClose={onClose}
                title={windowTitle}
                icon="📚"
                subtitle={windowSubtitle}
                tabs={ribbonTabs}
                activeTab={tab}
                onTabChange={t => setTab(t as LibraryTab)}
                maxWidth="max-w-5xl"
                className="lib-card is-reading-mode"
                leftPage={
                    <div className="flex flex-col h-full space-y-3 book-page-turn">
                        {/* Book Title & Chapter Banner */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#d4c5a9]">
                            <div>
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                                    ບົດທີ {currentBook.chapter}
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-amber-950 mt-1">
                                    {currentBook.title}
                                </h3>
                                <p className="text-[11px] text-amber-800/70">{currentBook.titleEn}</p>
                            </div>
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-full border border-emerald-300">
                                {readProgress.readCount}/{readProgress.totalPages} ໜ້າ ({readProgress.percentage}%)
                            </span>
                        </div>

                        {/* Page Numbers Indicator Bar */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {pages.map((p, idx) => {
                                const read = bookProgress.hasReadPage(p.pageNumber);
                                const active = idx === currentPageIndex;
                                return (
                                    <button
                                        key={p.pageNumber}
                                        type="button"
                                        onClick={() => {
                                            soundManager.playPageTurn();
                                            setCurrentPageIndex(idx);
                                        }}
                                        className={`min-h-[44px] min-w-[44px] px-2 py-1 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-0.5 ${active
                                            ? 'bg-amber-800 text-amber-100 border-amber-950 shadow-inner'
                                            : read
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                                : 'bg-[#ede0c8] text-amber-900 border-[#c49a6c] hover:bg-[#e4d4b8]'
                                            }`}
                                        title={p.lesson ? `ບົດ ${p.lesson}${lessonNotReachedNote(p.lesson)}` : `ໜ້າທີ ${p.pageNumber}`}
                                    >
                                        <span>{p.lesson ?? p.pageNumber}</span>
                                        {read && <span className="text-[10px] text-emerald-700">✓</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Illustration (if available) */}
                        {activePage.illustration && (
                            <div className="rounded-xl overflow-hidden border border-[#c49a6c] bg-[#ede0c8] p-2 shadow-inner">
                                <img
                                    src={activePage.illustration}
                                    alt={activePage.title}
                                    className="w-full max-h-48 mx-auto block rounded-lg object-contain"
                                />
                            </div>
                        )}

                        {/* Key Points */}
                        {activePage.keyPoints && activePage.keyPoints.length > 0 && (
                            <div className="bg-emerald-900/10 border border-emerald-600/30 rounded-xl p-3 space-y-1.5 flex-1">
                                <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                                    <span>💡</span> ຈຸດສຳຄັນທີ່ຕ້ອງຈື່ (Key Takeaways)
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-xs text-emerald-950 leading-relaxed">
                                    {activePage.keyPoints.map((kp, idx) => (
                                        <li key={idx}>{kp}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                }
                rightPage={
                    <div className="flex flex-col h-full space-y-3 book-page-turn">
                        {/* Page Reading Scroll Area (.gw-reader-body required for tests!) */}
                        <div className="gw-reader-body overflow-y-auto flex-1 space-y-3 pr-1 text-amber-950">
                            <div className="gw-readermeta flex items-center justify-between pb-1 border-b border-[#d4c5a9]">
                                <span className="text-xs uppercase tracking-wider text-amber-900 font-bold bg-amber-200/60 px-2 py-0.5 rounded">
                                    ໜ້າທີ {activePage.pageNumber} / {pages.length}
                                </span>
                                {activePage.lesson && (
                                    <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-300" data-testid="lesson-badge">
                                        ບົດ {activePage.lesson}{lessonNotReachedNote(activePage.lesson)}
                                    </span>
                                )}
                                {isPageAlreadyRead ? (
                                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                                        ✓ ອ່ານໜ້ານີ້ແລ້ວ
                                    </span>
                                ) : (
                                    <span className="text-xs text-amber-800 font-semibold">
                                        {remainingReadSeconds > 0
                                            ? `⏳ ກະລຸນາອ່ານ (${remainingReadSeconds}s)...`
                                            : '✨ ພ້ອມບັນທຶກແລ້ວ!'}
                                    </span>
                                )}
                            </div>

                            <h3 className="gw-reader-title text-base sm:text-lg font-bold text-amber-950 border-l-4 border-amber-700 pl-2.5">
                                {activePage.title}
                            </h3>

                            <div className="gw-reader-content text-amber-950 leading-relaxed whitespace-pre-line bg-[#fffdfa]/60 p-3 sm:p-4 rounded-xl border border-[#d4c5a9] text-xs sm:text-sm shadow-sm">
                                {activePage.content}
                            </div>
                        </div>

                        {/* Reader Footer Controls (.gw-readerfoot required by mobile tests!) */}
                        <div className="gw-readerfoot pt-3 border-t border-[#d4c5a9] flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handlePrevPage}
                                    disabled={currentPageIndex === 0}
                                    className={`min-h-[44px] px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${currentPageIndex > 0
                                        ? 'bg-[#ede0c8] hover:bg-[#e4d4b8] text-amber-900 border border-[#c49a6c]'
                                        : 'bg-[#e4d4b8]/50 text-amber-900/40 cursor-not-allowed'
                                        }`}
                                >
                                    ⬅️ ໜ້າກ່ອນ
                                </button>

                                {!isPageAlreadyRead ? (
                                    <button
                                        type="button"
                                        onClick={handleConfirmReadAndAdvance}
                                        disabled={remainingReadSeconds > 0}
                                        className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition shadow ${remainingReadSeconds > 0
                                            ? 'bg-amber-200/50 text-amber-900/50 border border-amber-300 cursor-not-allowed'
                                            : 'bg-emerald-700 hover:bg-emerald-600 text-white'
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
                                        type="button"
                                        onClick={handleConfirmReadAndAdvance}
                                        disabled={currentPageIndex >= pages.length - 1}
                                        className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition ${currentPageIndex < pages.length - 1
                                            ? 'bg-amber-800 hover:bg-amber-700 text-amber-100'
                                            : 'bg-amber-200/50 text-amber-900/40 cursor-not-allowed'
                                            }`}
                                    >
                                        ໜ້າຕໍ່ໄປ ➡️
                                    </button>
                                )}
                            </div>

                            {isInVillage && (
                                readProgress.isComplete ? (
                                    <button
                                        type="button"
                                        onClick={() => handleTakeExam(currentBook.id)}
                                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow transition flex items-center gap-1.5"
                                    >
                                        <span>📝</span>
                                        <span>ໄປສອບເສັງທີ່ສະຖາບັນ</span>
                                    </button>
                                ) : (
                                    <span className="text-[11px] text-amber-900/70 font-semibold px-2.5 py-1 rounded bg-[#ede0c8] border border-[#c49a6c]">
                                        🔒 ອ່ານໃຫ້ຄົບທຸກໜ້າ ({readProgress.readCount}/{readProgress.totalPages})
                                    </span>
                                )
                            )}
                        </div>
                    </div>
                }
                footer={
                    <div className="flex items-center justify-between w-full text-xs text-amber-200/80">
                        <span>📖 ບົດຮຽນ: {activePage.title}</span>
                        <span className="font-bold text-amber-300">🎓 {entities.wallet.balance} Credit</span>
                    </div>
                }
            />
        );
    }

    // -------------------------------------------------------------------------
    // 3. BOOKSTORE: FOR SALE (shop) & MY BOOKS (mine)
    // -------------------------------------------------------------------------
    const selectedBook = books.find(b => b.id === selectedBookId) || books[0];
    const selectedProgress = selectedBook ? ensureBookProgress(selectedBook.id) : null;
    const selectedProgStats = selectedBook && selectedProgress
        ? selectedProgress.getReadProgress(selectedBook.pages.length)
        : { readCount: 0, totalPages: 0, percentage: 0, isComplete: false };

    const selectedEligibility = selectedBook
        ? checkBookPurchaseEligibility(selectedBook, entities.books, entities.wallet, entities.stageProgression)
        : null;

    const isLockedByProgression = selectedEligibility && (
        selectedEligibility.reason === 'locked_prerequisite_exam' ||
        selectedEligibility.reason === 'locked_prerequisite_boss'
    );

    return (
        <BookFrame
            isOpen={isOpen}
            onClose={onClose}
            title={windowTitle}
            icon={isStore ? '🏛️' : '📚'}
            subtitle={windowSubtitle}
            tabs={ribbonTabs}
            activeTab={tab}
            onTabChange={t => setTab(t as LibraryTab)}
            maxWidth="max-w-4xl"
            className="lib-card"
            leftPage={
                <div className="space-y-3 book-page-turn">
                    {toastMessage && (
                        <div className="p-2 rounded-lg bg-amber-100 border border-amber-400 text-amber-900 text-xs font-semibold">
                            {toastMessage}
                        </div>
                    )}

                    {/* ============ TAB: SHOP (ວາງຂາຍ) ============ */}
                    {tab === 'shop' && (
                        <>
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#d4c5a9]">
                                <h3 className="font-bold text-amber-950 text-xs sm:text-sm">
                                    🛒 ປຶ້ມຕຳລາທີ່ວາງຂາຍ ({booksForSale.length})
                                </h3>
                                <span className="text-[11px] text-amber-800">💡 ຊື້ເພື່ອປົດລັອກບົດຮຽນ</span>
                            </div>

                            {booksForSale.length === 0 ? (
                                <div className="text-center py-8 space-y-2 text-amber-900">
                                    <div className="text-4xl">🎉</div>
                                    <h4 className="font-bold text-sm">ທ່ານຊື້ປຶ້ມຄົບທຸກເຫຼັ້ມແລ້ວ</h4>
                                    <p className="text-xs text-amber-800/80">ປຶ້ມທັງໝົດຢູ່ໃນແຖບ "ປຶ້ມຂອງຂ້ອຍ"</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {booksForSale.map(book => {
                                        const eligibility = checkBookPurchaseEligibility(
                                            book,
                                            entities.books,
                                            entities.wallet,
                                            entities.stageProgression
                                        );
                                        const locked =
                                            eligibility.reason === 'locked_prerequisite_exam' ||
                                            eligibility.reason === 'locked_prerequisite_boss';
                                        const isSelected = book.id === selectedBook?.id;

                                        return (
                                            <button
                                                key={book.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBookId(book.id);
                                                    soundManager.playSelect();
                                                }}
                                                className={`min-h-[44px] w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${isSelected
                                                    ? 'bg-amber-100/90 border-amber-600 shadow-sm'
                                                    : 'bg-[#fffdfa]/60 border-[#d4c5a9] hover:bg-amber-50'
                                                    } ${locked ? 'opacity-70' : ''}`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-2xl">{locked ? '🔒' : '📕'}</span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">
                                                                ບົດທີ {book.chapter}
                                                            </span>
                                                            <h4 className="font-bold text-xs sm:text-sm text-amber-950 truncate">
                                                                {book.title}
                                                            </h4>
                                                        </div>
                                                        <p className="text-[11px] text-amber-800/70 truncate">{book.titleEn}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    {book.price} 🎓
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* ============ TAB: MINE (ປຶ້ມຂອງຂ້ອຍ) ============ */}
                    {tab === 'mine' && (
                        <>
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#d4c5a9]">
                                <h3 className="font-bold text-amber-950 text-xs sm:text-sm">
                                    🎒 ປຶ້ມໃນຄອບຄອງ ({ownedBooks.length})
                                </h3>
                                <span className="text-[11px] text-amber-800">ກົດເພື່ອເປີດອ່ານ</span>
                            </div>

                            {ownedBooks.length === 0 ? (
                                <div className="text-center py-8 space-y-3 text-amber-900">
                                    <div className="text-4xl">📕🔒</div>
                                    <h4 className="font-bold text-sm">ຊັ້ນປຶ້ມຂອງທ່ານຍັງຫວ່າງ</h4>
                                    <p className="text-xs text-amber-800/80">ໄປແຖບ "ວາງຂາຍ" ເພື່ອຊື້ປຶ້ມເຫຼັ້ມທຳອິດ</p>
                                    <button
                                        type="button"
                                        onClick={() => setTab('shop')}
                                        className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-800 text-amber-100 font-bold text-xs shadow"
                                    >
                                        🛒 ໄປເບິ່ງປຶ້ມທີ່ວາງຂາຍ
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {ownedBooks.map(book => {
                                        const bp = ensureBookProgress(book.id);
                                        const prog = bp.getReadProgress(book.pages.length);
                                        const isSelected = book.id === selectedBook?.id;

                                        return (
                                            <button
                                                key={book.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBookId(book.id);
                                                    soundManager.playSelect();
                                                }}
                                                className={`min-h-[44px] w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${isSelected
                                                    ? 'bg-amber-100/90 border-amber-600 shadow-sm'
                                                    : 'bg-[#fffdfa]/60 border-[#d4c5a9] hover:bg-amber-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-2xl">📖</span>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">
                                                                ບົດທີ {book.chapter}
                                                            </span>
                                                            <h4 className="font-bold text-xs sm:text-sm text-amber-950 truncate">
                                                                {book.title}
                                                            </h4>
                                                        </div>
                                                        <p className="text-[11px] text-amber-800/70">{book.titleEn}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-24 h-1.5 rounded-full bg-amber-200 overflow-hidden">
                                                                <div className="h-full bg-emerald-600" style={{ width: `${prog.percentage}%` }} />
                                                            </div>
                                                            <span className="text-[10px] text-amber-900 font-semibold">{prog.readCount}/{prog.totalPages}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {bp.examPassed ? (
                                                    <span className="text-xs text-amber-600 font-bold">⭐ ຜ່ານແລ້ວ</span>
                                                ) : (
                                                    <span className="text-[11px] text-amber-800/70">📝 ຍັງບໍ່ສອບ</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            }
            rightPage={
                selectedBook ? (
                    <div className="flex flex-col h-full space-y-3 book-page-turn text-amber-950">
                        {/* Selected Book Overview */}
                        <div className="p-3 rounded-xl bg-[#fffdfa]/70 border border-[#d4c5a9] space-y-2">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl p-2 rounded-lg bg-amber-100 border border-amber-300">
                                    {tab === 'mine' ? '📖' : isLockedByProgression ? '🔒' : '📕'}
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                                            ບົດທີ {selectedBook.chapter}
                                        </span>
                                        <h3 className="font-bold text-sm sm:text-base text-amber-950">
                                            {selectedBook.title}
                                        </h3>
                                    </div>
                                    <p className="text-xs text-amber-800/80">{selectedBook.titleEn} • {selectedBook.pages.length} ໜ້າ</p>
                                </div>
                            </div>

                            <p className="text-xs text-amber-900 leading-relaxed bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                                {selectedBook.description}
                            </p>

                            {selectedBook.unlockedRecipes && selectedBook.unlockedRecipes.length > 0 && (
                                <div className="text-xs text-amber-900 space-y-1">
                                    <span className="font-bold text-amber-950">🎁 ສູດສ້າງທີ່ຈະໄດ້ຮັບເມື່ອສອບຜ່ານ:</span>
                                    <p className="font-semibold text-emerald-800">
                                        {selectedBook.unlockedRecipes.map(recipeLabel).join(', ')}
                                    </p>
                                </div>
                            )}

                            {isLockedByProgression && selectedEligibility && (
                                <div className="p-2.5 rounded-lg bg-amber-100/70 border border-amber-300 text-xs space-y-1">
                                    <div className="font-bold text-amber-950">
                                        🔒 ເງື່ອນໄຂກ່ອນເປີດຂາຍປຶ້ມບົດທີ {selectedBook.chapter}:
                                    </div>
                                    {selectedBook.prerequisiteBookId && (
                                        <div className={selectedEligibility.prereqExamPassed ? 'text-emerald-800 font-semibold' : 'text-amber-900'}>
                                            {selectedEligibility.prereqExamPassed ? '✓' : '○'} ສອບເສັງປຶ້ມບົດກ່ອນໜ້າຜ່ານ ({selectedBook.prerequisiteBookId})
                                        </div>
                                    )}
                                    {selectedBook.requiredCompletedStageId && (
                                        <div className={selectedEligibility.prereqBossDefeated ? 'text-emerald-800 font-semibold' : 'text-amber-900'}>
                                            {selectedEligibility.prereqBossDefeated ? '✓' : '○'} ປາບ Boss ປະຈຳດ່ານບົດກ່ອນໜ້າສຳເລັດ ({selectedBook.requiredCompletedStageId})
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions for Shop vs Mine */}
                        <div className="mt-auto pt-2 space-y-2">
                            {tab === 'shop' && (
                                isLockedByProgression ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="min-h-[44px] w-full py-2.5 rounded-xl bg-amber-200/50 text-amber-900/50 font-bold text-sm border border-amber-300 cursor-not-allowed"
                                    >
                                        ຍັງບໍ່ປົດລັອກບົດຮຽນນີ້
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handlePurchaseBook(selectedBook)}
                                        disabled={!selectedEligibility?.canPurchase}
                                        className="min-h-[44px] book-btn-craft w-full"
                                    >
                                        {selectedEligibility?.canPurchase
                                            ? `ຊື້ປຶ້ມຕຳລາ (${selectedBook.price} 🎓 Credit)`
                                            : `Credit ບໍ່ພໍ (ຕ້ອງການ ${selectedBook.price} 🎓)`}
                                    </button>
                                )
                            )}

                            {tab === 'mine' && (
                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenBookInReader(selectedBook.id)}
                                        className="min-h-[44px] book-btn-craft w-full"
                                    >
                                        📖 ເປີດອ່ານຕຳລາ ({selectedProgStats.readCount}/{selectedProgStats.totalPages})
                                    </button>

                                    {isInVillage && (
                                        selectedProgStats.isComplete ? (
                                            <button
                                                type="button"
                                                onClick={() => handleTakeExam(selectedBook.id)}
                                                className="min-h-[44px] w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow transition flex items-center justify-center gap-2"
                                            >
                                                <span>📝</span>
                                                <span>ໄປສອບເສັງທີ່ສະຖາບັນ</span>
                                            </button>
                                        ) : (
                                            <span className="block text-center text-xs text-amber-900/70 font-semibold p-2 rounded-lg bg-[#ede0c8] border border-[#c49a6c]">
                                                🔒 ອ່ານໃຫ້ຄົບທຸກໜ້າກ່ອນສອບ
                                            </span>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-amber-900/60">
                        ເລືອກປຶ້ມເພື່ອເບິ່ງລາຍລະອຽດ
                    </div>
                )
            }
            footer={
                <div className="flex items-center justify-between w-full text-xs text-amber-200/80">
                    <span>🏛️ ຫໍສະໝຸດແຫ່ງປັນຍາ</span>
                    <span className="font-bold text-amber-300">🎓 {entities.wallet.balance} Credit</span>
                </div>
            }
        />
    );
};
