import React, { useEffect, useState } from 'react';
import { BookDefinition, BookProgress } from '../../../domain/entities/Book';
import { QuestionData, QuizExamSession } from '../../../domain/entities/Quiz';
import { loadBooksData, loadQuestionsData } from '../../dataLoader';
import { entities } from '../../composition';
import { submitBookExamUseCase, SubmitBookExamResult } from '../../../application/SubmitBookExamUseCase';
import { submitDailyPracticeUseCase, SubmitDailyPracticeResult } from '../../../application/SubmitDailyPracticeUseCase';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';

interface AcademyModalProps
{
    isOpen: boolean;
    onClose: () => void;
    initialBookId?: string;
    onExamPassed?: (bookId: string) => void;
    onCreditChanged?: (newBalance: number) => void;
    onOpenLibraryStore?: () => void;
    onOpenReader?: (bookId: string, pageNumber?: number) => void;
}

export const AcademyModal: React.FC<AcademyModalProps> = ({
    isOpen,
    onClose,
    initialBookId = 'book-ch1',
    onExamPassed,
    onCreditChanged,
    onOpenLibraryStore,
    onOpenReader,
}) =>
{
    const [activeTab, setActiveTab] = useState<'exam' | 'practice'>('exam');
    const [books, setBooks] = useState<BookDefinition[]>([]);
    const [allQuestions, setAllQuestions] = useState<QuestionData[]>([]);
    const [selectedBookId, setSelectedBookId] = useState<string>(initialBookId);

    // Exam State
    const [examSession, setExamSession] = useState<QuizExamSession | null>(null);
    const [examResults, setExamResults] = useState<SubmitBookExamResult | null>(null);
    const [, setExamRevision] = useState(0);

    // Practice State
    const [practiceQuestions, setPracticeQuestions] = useState<QuestionData[]>([]);
    const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
    const [practiceResults, setPracticeResults] = useState<SubmitDailyPracticeResult | null>(null);

    const todayDate = new Date().toISOString().split('T')[0];

    useEffect(() =>
    {
        loadBooksData().then(setBooks).catch(console.error);
        loadQuestionsData().then(setAllQuestions).catch(console.error);
    }, []);

    useEffect(() =>
    {
        if (initialBookId)
        {
            setSelectedBookId(initialBookId);
        }
    }, [initialBookId]);

    if (!isOpen) return null;

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

    const currentBook = books.find(b => b.id === selectedBookId) || books[0];
    const bookProgress = currentBook ? ensureBookProgress(currentBook.id) : null;
    const readProgress = currentBook && bookProgress
        ? bookProgress.getReadProgress(currentBook.pages.length)
        : { readCount: 0, totalPages: 0, percentage: 0, isComplete: false };
    const canStartCurrentExam = Boolean(
        currentBook && bookProgress && bookProgress.canTakeExam(currentBook.pages.length)
    );
    const hasAnyOwnedBook = books.some(b => entities.books[b.id]?.isUnlocked);
    const canAccessDailyPractice = hasAnyOwnedBook || entities.wallet.balance < 20;

    // --- Start Exam ---
    const handleStartExam = () =>
    {
        if (!currentBook || !bookProgress || !bookProgress.canTakeExam(currentBook.pages.length))
        {
            soundManager.playHurt();
            return;
        }
        const bookQuestions = allQuestions.filter(q => q.bookId === currentBook.id);
        if (bookQuestions.length === 0) return;

        // Shuffle & pick 5 questions
        const shuffled = [...bookQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(5, shuffled.length));

        const session = new QuizExamSession(selected);
        setExamSession(session);
        setExamResults(null);
        soundManager.playSelect();
    };

    const handleAnswerExamQuestion = (qIndex: number, optIndex: number) =>
    {
        if (!examSession) return;
        examSession.answerQuestion(qIndex, optIndex);
        soundManager.playSelect();
        setExamRevision(r => r + 1);
    };

    const handleSubmitExam = () =>
    {
        if (!examSession || !bookProgress || !currentBook) return;
        const result = submitBookExamUseCase(
            examSession,
            bookProgress,
            entities.wallet,
            currentBook.pages.length
        );
        setExamResults(result);

        if (result.passed)
        {
            soundManager.playPowerUp();
            onCreditChanged?.(entities.wallet.balance);
            if (onExamPassed) onExamPassed(bookProgress.bookId);
            EventBus.emit('book-exam-passed', bookProgress.bookId);
        }
        else
        {
            soundManager.playHurt();
        }
    };

    // --- Daily Practice ---
    const handleStartDailyPractice = () =>
    {
        if (!canAccessDailyPractice)
        {
            soundManager.playHurt();
            return;
        }
        const eligibleQuestions = allQuestions.filter(q =>
        {
            const bp = entities.books[q.bookId];
            return bp && bp.isUnlocked;
        });

        const selected = entities.spacedRepetition.selectQuestions(
            eligibleQuestions.length > 0 ? eligibleQuestions : allQuestions.filter(q => q.bookId === 'book-ch1'),
            3
        );
        setPracticeQuestions(selected);
        setPracticeAnswers({});
        setPracticeResults(null);
        soundManager.playSelect();
    };

    const handleSelectPracticeAnswer = (qIndex: number, optIndex: number) =>
    {
        setPracticeAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
        soundManager.playSelect();
    };

    const handleSubmitDailyPractice = () =>
    {
        const answersPayload = practiceQuestions.map((q, idx) => ({
            questionId: q.id,
            isCorrect: practiceAnswers[idx] === q.correctIndex,
        }));

        const result = submitDailyPracticeUseCase(
            todayDate,
            answersPayload,
            entities.spacedRepetition,
            entities.wallet
        );

        setPracticeResults(result);
        if (result.success && result.correctCount > 0)
        {
            soundManager.playPowerUp();
            onCreditChanged?.(entities.wallet.balance);
        }
    };

    const canPracticeToday = entities.spacedRepetition.canPracticeToday(todayDate);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-indigo-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🏛️</span>
                        <div>
                            <h2 className="text-xl font-bold text-indigo-300">ສະຖາບັນຝຶກຝົນວິຊາການ (Academy)</h2>
                            <p className="text-xs text-slate-400">ສອບເສັງທົດສອບຄວາມຮູ້ເພື່ອຮັບ Credit ແລະ ປົດລັອກໂຮງຕີເຫຼັກ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 px-6 pt-3 border-b border-slate-700/60 bg-slate-900/40">
                    <button
                        onClick={() => { setActiveTab('exam'); soundManager.playSelect(); }}
                        className={`pb-2.5 font-bold text-sm transition flex items-center gap-2 border-b-2 ${
                            activeTab === 'exam'
                                ? 'border-indigo-400 text-indigo-300'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <span>📝</span>
                        <span>ສອບເສັງທ້າຍບົດ (Book Exam)</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('practice'); soundManager.playSelect(); }}
                        className={`pb-2.5 font-bold text-sm transition flex items-center gap-2 border-b-2 ${
                            activeTab === 'practice'
                                ? 'border-indigo-400 text-indigo-300'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <span>🧠</span>
                        <span>ຝຶກຝົນປະຈຳວັນ Spaced Repetition (Daily Practice)</span>
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-200">
                    {activeTab === 'exam' ? (
                        /* ================= EXAM TAB ================= */
                        <div>
                            {!examSession && !examResults ? (
                                <div className="space-y-6">
                                    {/* Book Selector */}
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {books.map(b =>
                                        {
                                            const bp = ensureBookProgress(b.id);
                                            const icon = bp.examPassed ? '⭐' : bp.isUnlocked ? '📖' : '🔒';
                                            return (
                                                <button
                                                    key={b.id}
                                                    onClick={() => setSelectedBookId(b.id)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition border flex items-center gap-1.5 ${
                                                        selectedBookId === b.id
                                                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    <span>{icon}</span>
                                                    <span>ບົດທີ {b.chapter}: {b.title}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {currentBook && bookProgress && (
                                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/60 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold text-white">{currentBook.title}</h3>
                                                    <p className="text-xs text-indigo-400 font-medium">{currentBook.titleEn}</p>
                                                </div>
                                                {bookProgress.examPassed ? (
                                                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                                                        ✓ ສອບຜ່ານແລ້ວ (ຄະແນນສູງສຸດ: {bookProgress.bestScore}/5)
                                                    </span>
                                                ) : !bookProgress.isUnlocked ? (
                                                    <span className="px-3 py-1 rounded-full bg-rose-950/40 text-rose-300 font-bold text-xs border border-rose-500/50">
                                                        🔒 ຍັງບໍ່ໄດ້ຊື້ປຶ້ມ
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">
                                                        📖 ອ່ານແລ້ວ {readProgress.readCount}/{readProgress.totalPages} ໜ້າ (ເກນສອບຜ່ານ: 4/5)
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-slate-300">{currentBook.description}</p>

                                            <div className="grid grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-sm">
                                                <div>
                                                    <span className="text-slate-400">ຈຳນວນຂໍ້ສອບ:</span>
                                                    <span className="font-bold text-white ml-2">5 ຂໍ້ (ສຸ່ມຈາກບົດຮຽນ)</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">ລາງວັນສອບຜ່ານຄັ້ງທຳອິດ:</span>
                                                    <span className="font-bold text-amber-400 ml-2">+50 🎓 Credit & ປົດລັອກສູດສ້າງ!</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">ລາງວັນສອບຊ້ຳ:</span>
                                                    <span className="font-bold text-amber-300 ml-2">+5 🎓 Credit (ໄດ້ 1 ຄັ້ງ/ມື້)</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-400">ຈຳນວນຄັ້ງທີ່ສອບ:</span>
                                                    <span className="font-bold text-white ml-2">{bookProgress.attempts} ຄັ້ງ</span>
                                                </div>
                                            </div>

                                            {/* Gate 1: Book Not Purchased */}
                                            {!bookProgress.isUnlocked ? (
                                                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-3 text-center">
                                                    <p className="text-sm font-bold text-rose-300">
                                                        🔒 ບໍ່ສາມາດເຂົ້າສອບເສັງໄດ້ — ທ່ານຍັງບໍ່ໄດ້ຊື້ປຶ້ມຕຳລາ "{currentBook.title}"
                                                    </p>
                                                    <p className="text-xs text-slate-300">
                                                        ກະລຸນາໄປຊື້ປຶ້ມຕຳລາທີ່ອາຄານ <strong>🏛️ ຫໍສະໝຸດ (Library)</strong> (ລາຄາ {currentBook.price} 🎓 Credit) ແລະ ເປີດອ່ານໃຫ້ຄົບທຸກໜ້າກ່ອນ.
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                        {
                                                            onClose();
                                                            if (onOpenLibraryStore) onOpenLibraryStore();
                                                            else EventBus.emit('open-library');
                                                        }}
                                                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-cyan-500 text-white font-bold text-sm shadow transition"
                                                    >
                                                        🏛️ ໄປຊື້ປຶ້ມທີ່ຫໍສະໝຸດ (Library)
                                                    </button>
                                                </div>
                                            ) : !canStartCurrentExam ? (
                                                /* Gate 2: Book Purchased, Not Fully Read Yet */
                                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-3 text-center">
                                                    <p className="text-sm font-bold text-amber-300">
                                                        📖 ກະລຸນາອ່ານປຶ້ມຕຳລາໃຫ້ຄົບທຸກໜ້າກ່ອນເຂົ້າສອບເສັງ ({readProgress.readCount}/{readProgress.totalPages} ໜ້າ)
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                        {
                                                            onClose();
                                                            if (onOpenReader) onOpenReader(currentBook.id);
                                                        }}
                                                        className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm shadow transition"
                                                    >
                                                        📖 ເປີດອ່ານປຶ້ມຕຳລາຕໍ່ ({readProgress.readCount}/{readProgress.totalPages})
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Unlocked & Fully Read -> Start Exam! */
                                                <button
                                                    onClick={handleStartExam}
                                                    className="w-full py-3 rounded-xl bg-indigo-500/20 border-2 border-indigo-500/50 hover:bg-cyan-500 text-white font-bold text-base shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
                                                >
                                                    <span>✍️</span>
                                                    <span>ເລີ່ມສອບເສັງ (Start Exam)</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : examResults ? (
                                /* Exam Results Screen */
                                <div className="space-y-6">
                                    <div className={`p-6 rounded-2xl border text-center space-y-3 ${
                                        examResults.passed
                                            ? 'bg-emerald-950/40 border-emerald-500/50'
                                            : 'bg-rose-950/40 border-rose-500/50'
                                    }`}>
                                        <span className="text-6xl">{examResults.passed ? '🎉' : '❌'}</span>
                                        <h3 className={`text-2xl font-black ${
                                            examResults.passed ? 'text-emerald-300' : 'text-rose-300'
                                        }`}>
                                            {examResults.passed ? 'ຍິນດີດ້ວຍ! ທ່ານສອບເສັງຜ່ານແລ້ວ' : 'ເສຍໃຈນຳ! ຄະແນນຍັງບໍ່ເຖິງເກນຜ່ານ'}
                                        </h3>
                                        <p className="text-lg font-bold text-white">
                                            ຄະແນນທີ່ໄດ້: {examResults.score} / {examResults.total}
                                        </p>
                                        {examResults.passed && (
                                            <p className="text-amber-400 font-bold text-base">
                                                {examResults.creditReward > 0
                                                    ? `+${examResults.creditReward} 🎓 Credit ໄດ້ຮັບແລ້ວ!`
                                                    : '✅ ວັນນີ້ຮັບລາງວັນສອບຊ້ຳແລ້ວ (ໄດ້ 1 ຄັ້ງຕໍ່ມື້)'}
                                                {examResults.forgeUnlocked && ' 🔨 ໂຮງຕີເຫຼັກ (Forge) ໄດ້ຮັບການປົດລັອກແລ້ວ!'}
                                            </p>
                                        )}
                                    </div>

                                    {examSession && examSession.getMissedResults().length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-amber-300">
                                                📝 ທົບທວນຂໍ້ທີ່ຍັງບໍ່ຖືກ ({examSession.getMissedResults().length} ຂໍ້)
                                            </h4>
                                            {examSession.getMissedResults().map((m) => (
                                                <div
                                                    key={m.questionId}
                                                    className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2"
                                                >
                                                    <p className="font-bold text-white flex gap-2">
                                                        <span className="text-indigo-400">ຂໍ້ {m.questionNumber}.</span>
                                                        <span>{m.question}</span>
                                                    </p>
                                                    <p className="text-sm text-rose-300">
                                                        {m.selectedOption >= 0
                                                            ? `ຄຳຕອບຂອງທ່ານ: ${m.options[m.selectedOption]}`
                                                            : 'ທ່ານບໍ່ໄດ້ຕອບຂໍ້ນີ້'}
                                                    </p>
                                                    <p className="text-sm text-emerald-300">
                                                        ຄຳຕອບທີ່ຖືກ: {m.options[m.correctOption]}
                                                    </p>
                                                    {m.explanation && (
                                                        <p className="text-sm text-slate-300">💡 {m.explanation}</p>
                                                    )}
                                                    {onOpenReader && currentBook && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onOpenReader(currentBook.id, m.pageNumber)}
                                                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-bold text-xs transition"
                                                        >
                                                            📖 ເປີດໜ້າ {m.pageNumber} ໃນປຶ້ມ
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setExamSession(null); setExamResults(null); }}
                                        className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-sm transition"
                                    >
                                        ກັບຄືນໜ້າສະຖາບັນ
                                    </button>
                                </div>
                            ) : (
                                /* Active Exam In Progress */
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                                        <span className="font-bold text-indigo-300">
                                            ການສອບເສັງ: {currentBook?.title}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            ຕອບແລ້ວ {examSession?.answeredCount || 0} / {examSession?.totalQuestions || 5} ຂໍ້
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        {examSession?.questions.map((q, idx) =>
                                        {
                                            const selectedOpt = examSession.getSelectedAnswer(idx);

                                            return (
                                                <div key={q.id} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                                                    <h4 className="font-bold text-white flex gap-2">
                                                        <span className="text-indigo-400">ຂໍ້ {idx + 1}.</span>
                                                        <span>{q.question}</span>
                                                    </h4>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {q.options.map((opt, oIdx) =>
                                                        {
                                                            const isChosen = selectedOpt === oIdx;

                                                            return (
                                                                <button
                                                                    key={oIdx}
                                                                    onClick={() => handleAnswerExamQuestion(idx, oIdx)}
                                                                    className={`p-3 rounded-xl text-left text-sm font-medium transition border ${
                                                                        isChosen
                                                                            ? 'bg-indigo-600/40 border-indigo-400 text-white font-bold'
                                                                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                                                                    }`}
                                                                >
                                                                    <span className="mr-2 text-indigo-400 font-bold">
                                                                        {String.fromCharCode(65 + oIdx)}.
                                                                    </span>
                                                                    <span>{opt}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={handleSubmitExam}
                                        disabled={!examSession?.isComplete}
                                        className={`w-full py-3 rounded-xl font-bold text-base shadow-lg transition ${
                                            examSession?.isComplete
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        }`}
                                    >
                                        ສົ່ງບົດສອບເສັງ (Submit Exam)
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ================= DAILY PRACTICE TAB ================= */
                        <div className="space-y-6">
                            {!practiceResults ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/60 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-bold text-white">ຝຶກຝົນປະຈຳວັນ (Spaced Repetition)</h3>
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                                canPracticeToday ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                                            }`}>
                                                {canPracticeToday ? 'ພ້ອມຝຶກຝົນວັນນີ້' : 'ຄົບໂຄຕ້າວັນນີ້ແລ້ວ'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-300">
                                            ລະບົບຈະຄັດເລືອກ 3 ຄຳຖາມໂດຍເນັ້ນໃສ່ຂໍ້ທີ່ທ່ານເຄີຍຕອບຜິດ ຫຼື ຂໍ້ທີ່ຍັງບໍ່ທັນຄຸ້ນເຄີຍ.
                                            ຕອບຖືກແຕ່ລະຂໍ້ຮັບທັນທີ <span className="text-amber-400 font-bold">+5 🎓 Credit</span>!
                                        </p>

                                        {!canAccessDailyPractice ? (
                                            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-center space-y-2">
                                                <p className="text-sm font-bold text-rose-300">
                                                    🔒 ກະລຸນາໄປຊື້ປຶ້ມຕຳລາທີ່ຫໍສະໝຸດ (Library) ຢ່າງໜ້ອຍ 1 ເຫຼັ້ມກ່ອນເລີ່ມຝຶກຝົນປະຈຳວັນ
                                                </p>
                                            </div>
                                        ) : practiceQuestions.length === 0 ? (
                                            <button
                                                onClick={handleStartDailyPractice}
                                                disabled={!canPracticeToday}
                                                className={`w-full py-3 rounded-xl font-bold transition shadow-lg ${
                                                    canPracticeToday
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                        : 'bg-slate-800 text-slate-500'
                                                }`}
                                            >
                                                ເລີ່ມຝຶກຝົນ 3 ຂໍ້ປະຈຳວັນ
                                            </button>
                                        ) : null}
                                    </div>

                                    {practiceQuestions.length > 0 && (
                                        <div className="space-y-4">
                                            {practiceQuestions.map((q, idx) =>
                                            {
                                                const selectedOpt = practiceAnswers[idx];

                                                return (
                                                    <div key={q.id} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
                                                        <h4 className="font-bold text-white flex gap-2">
                                                            <span className="text-indigo-400">ຂໍ້ {idx + 1}.</span>
                                                            <span>{q.question}</span>
                                                        </h4>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {q.options.map((opt, oIdx) =>
                                                            {
                                                                const isChosen = selectedOpt === oIdx;

                                                                return (
                                                                    <button
                                                                        key={oIdx}
                                                                        onClick={() => handleSelectPracticeAnswer(idx, oIdx)}
                                                                        className={`p-3 rounded-xl text-left text-sm font-medium transition border ${
                                                                            isChosen
                                                                                ? 'bg-indigo-600/40 border-indigo-400 text-white font-bold'
                                                                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                                                                        }`}
                                                                    >
                                                                        <span className="mr-2 text-indigo-400 font-bold">
                                                                            {String.fromCharCode(65 + oIdx)}.
                                                                        </span>
                                                                        <span>{opt}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <button
                                                onClick={handleSubmitDailyPractice}
                                                disabled={Object.keys(practiceAnswers).length < practiceQuestions.length}
                                                className={`w-full py-3 rounded-xl font-bold transition shadow-lg ${
                                                    Object.keys(practiceAnswers).length === practiceQuestions.length
                                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                }`}
                                            >
                                                ສົ່ງຄຳຕອບຝຶກຝົນ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 text-center p-6 bg-slate-800/60 rounded-2xl border border-slate-700">
                                    <span className="text-5xl">🌟</span>
                                    <h3 className="text-xl font-bold text-white">ຜົນການຝຶກຝົນປະຈຳວັນ</h3>
                                    <p className="text-slate-300">
                                        ຕອບຖືກ {practiceResults.correctCount} / {practiceResults.totalAnswered} ຂໍ້
                                    </p>
                                    <p className="text-amber-400 font-bold text-lg">
                                        +{practiceResults.creditReward} 🎓 Credit ໄດ້ຮັບແລ້ວ!
                                    </p>

                                    <button
                                        onClick={() => { setPracticeQuestions([]); setPracticeResults(null); }}
                                        className="px-6 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-sm transition"
                                    >
                                        ສຳເລັດ
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
