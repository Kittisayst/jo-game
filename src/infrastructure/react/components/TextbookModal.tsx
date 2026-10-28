import React, { useEffect, useState } from 'react';
import { BookDefinition, BookProgress } from '../../../domain/entities/Book';
import { loadBooksData } from '../../dataLoader';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';

interface TextbookModalProps
{
    isOpen: boolean;
    onClose: () => void;
    onGoToExam?: (bookId: string) => void;
}

export const TextbookModal: React.FC<TextbookModalProps> = ({ isOpen, onClose, onGoToExam }) =>
{
    const [books, setBooks] = useState<BookDefinition[]>([]);
    const [selectedBookId, setSelectedBookId] = useState<string>('book-ch1');
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
    const [, setRevision] = useState(0);

    useEffect(() =>
    {
        loadBooksData().then(setBooks).catch(console.error);
    }, []);

    if (!isOpen) return null;

    const currentBook = books.find(b => b.id === selectedBookId) || books[0];
    if (!currentBook) return null;

    let bookProgress = entities.books[currentBook.id];
    if (!bookProgress)
    {
        bookProgress = new BookProgress(currentBook.id, currentBook.price === 0);
        entities.books[currentBook.id] = bookProgress;
    }

    const pages = currentBook.pages || [];
    const activePage = pages[currentPageIndex] || pages[0];
    const isPageRead = activePage ? bookProgress.hasReadPage(activePage.pageNumber) : false;

    const handleNextPage = () =>
    {
        if (currentPageIndex < pages.length - 1)
        {
            soundManager.playSelect();
            setCurrentPageIndex(p => p + 1);
        }
    };

    const handlePrevPage = () =>
    {
        if (currentPageIndex > 0)
        {
            soundManager.playSelect();
            setCurrentPageIndex(p => p - 1);
        }
    };

    const handleMarkAsRead = () =>
    {
        if (activePage)
        {
            bookProgress.markPageRead(activePage.pageNumber);
            soundManager.playPowerUp();
            setRevision(r => r + 1);
        }
    };

    const handleUnlockBook = (b: BookDefinition) =>
    {
        if (entities.wallet.balance >= b.price)
        {
            entities.wallet.spend(b.price);
            bookProgress.unlock();
            soundManager.playCoin();
            setRevision(r => r + 1);
        }
    };

    const handleTakeExam = () =>
    {
        onClose();
        if (onGoToExam)
        {
            onGoToExam(currentBook.id);
        }
        else
        {
            EventBus.emit('open-academy', currentBook.id);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📚</span>
                        <div>
                            <h2 className="text-xl font-bold text-amber-300">ຫໍສະໝຸດແຫ່ງປັນຍາ (Library)</h2>
                            <p className="text-xs text-slate-400">ອ່ານປຶ້ມຕຳລາຮຽນເພື່ອປົດລັອກສູດສ້າງອຸປະກອນ ແລະ ກຽມສອບເສັງ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Book Selector Tabs */}
                <div className="flex gap-2 px-6 pt-3 border-b border-slate-700/60 bg-slate-900/40 overflow-x-auto">
                    {books.map(b =>
                    {
                        const prog = entities.books[b.id];
                        const isUnlocked = prog ? prog.isUnlocked : b.price === 0;
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
                                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-amber-500/20 text-amber-300 border-b-2 border-amber-400'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                            >
                                <span>{isUnlocked ? '📖' : '🔒'}</span>
                                <span>ບົດທີ {b.chapter}: {b.title}</span>
                                {prog?.examPassed && (
                                    <span className="text-xs bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">ຜ່ານແລ້ວ ⭐</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-200">
                    {!bookProgress.isUnlocked ? (
                        <div className="text-center py-12 space-y-4">
                            <span className="text-6xl">🔒</span>
                            <h3 className="text-xl font-bold text-slate-200">{currentBook.title}</h3>
                            <p className="text-slate-400 max-w-md mx-auto">{currentBook.description}</p>
                            <p className="text-amber-400 font-semibold">ລາຄາປົດລັອກ: {currentBook.price} 🎓 Credit</p>
                            <button
                                onClick={() => handleUnlockBook(currentBook)}
                                disabled={entities.wallet.balance < currentBook.price}
                                className={`px-6 py-2.5 rounded-xl font-bold transition shadow-lg ${
                                    entities.wallet.balance >= currentBook.price
                                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                ປົດລັອກປຶ້ມຮຽນ
                            </button>
                        </div>
                    ) : activePage ? (
                        <div className="space-y-4">
                            {/* Page Header */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs uppercase tracking-wider text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded">
                                    ໜ້າທີ {activePage.pageNumber} / {pages.length}
                                </span>
                                {isPageRead ? (
                                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                        ✓ ອ່ານແລ້ວ
                                    </span>
                                ) : (
                                    <button
                                        onClick={handleMarkAsRead}
                                        className="text-xs bg-emerald-600/80 hover:bg-emerald-500 text-white px-3 py-1 rounded-md font-semibold transition"
                                    >
                                        ໝາຍວ່າອ່ານແລ້ວ
                                    </button>
                                )}
                            </div>

                            <h3 className="text-2xl font-bold text-white border-l-4 border-amber-400 pl-3">
                                {activePage.title}
                            </h3>

                            <div className="text-slate-300 leading-relaxed whitespace-pre-line bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                {activePage.content}
                            </div>

                            {/* Key points box */}
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

                            {/* Unlocked recipes preview */}
                            {currentBook.unlockedRecipes && currentBook.unlockedRecipes.length > 0 && (
                                <div className="text-xs text-slate-400 flex items-center gap-2 pt-2">
                                    <span>🎁 ສູດສ້າງທີ່ຈະໄດ້ຮັບເມື່ອສອບຜ່ານ:</span>
                                    <span className="text-amber-300 font-medium">
                                        {currentBook.unlockedRecipes.join(', ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-slate-700/60 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPageIndex === 0}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                currentPageIndex > 0
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                        >
                            ⬅️ ໜ້າກ່ອນ
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPageIndex >= pages.length - 1}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                                currentPageIndex < pages.length - 1
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                        >
                            ໜ້າຕໍ່ໄປ ➡️
                        </button>
                    </div>

                    <button
                        onClick={handleTakeExam}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center gap-2"
                    >
                        <span>📝</span>
                        <span>ໄປສອບເສັງທີ່ສະຖາບັນ</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

