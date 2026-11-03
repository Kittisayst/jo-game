import React, { useEffect, useState } from 'react';
import { BookDefinition, BookProgress } from '../../../domain/entities/Book';
import { QuestionData, QuizExamSession } from '../../../domain/entities/Quiz';
import { getGameContent } from '../../content/ContentCatalog';
import { entities } from '../../composition';
import { submitBookExamUseCase, SubmitBookExamResult } from '../../../application/SubmitBookExamUseCase';
import {
    canAccessDailyPractice as canAccessDailyPracticeRule,
    submitDailyPracticeUseCase,
    SubmitDailyPracticeResult,
} from '../../../application/SubmitDailyPracticeUseCase';
import { SkillsPanel } from './SkillsPanel';
import { syncSkills } from '../../skills';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { BookFrame, BookTabItem } from './book/BookFrame';

interface AcademyModalProps {
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
}) => {
    const [activeTab, setActiveTab] = useState<'exam' | 'practice' | 'skills'>('exam');
    const [learnedSkillNames, setLearnedSkillNames] = useState<string[]>([]);
    const [books] = useState<BookDefinition[]>(() => getGameContent().books);
    const [allQuestions] = useState<QuestionData[]>(() => getGameContent().questions);
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

    useEffect(() => {
        if (initialBookId) {
            setSelectedBookId(initialBookId);
        }
    }, [initialBookId]);

    if (!isOpen) return null;

    const ensureBookProgress = (bookId: string): BookProgress => {
        let bp = entities.books[bookId];
        if (!bp) {
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
    const canAccessDailyPractice = canAccessDailyPracticeRule(
        books.filter(b => entities.books[b.id]?.isUnlocked).length,
        entities.wallet.balance
    );

    // --- Start Exam ---
    const handleStartExam = () => {
        if (!currentBook || !bookProgress || !bookProgress.canTakeExam(currentBook.pages.length)) {
            soundManager.playHurt();
            return;
        }
        const bookQuestions = allQuestions.filter(q => q.bookId === currentBook.id);
        if (bookQuestions.length === 0) return;

        const shuffled = [...bookQuestions].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(5, shuffled.length));

        const session = new QuizExamSession(selected);
        setExamSession(session);
        setExamResults(null);
        soundManager.playSelect();
    };

    const handleAnswerExamQuestion = (qIndex: number, optIndex: number) => {
        if (!examSession) return;
        examSession.answerQuestion(qIndex, optIndex);
        soundManager.playSelect();
        setExamRevision(r => r + 1);
    };

    const handleSubmitExam = () => {
        if (!examSession || !bookProgress || !currentBook) return;
        const result = submitBookExamUseCase(
            examSession,
            bookProgress,
            entities.wallet,
            currentBook.pages.length
        );
        setExamResults(result);

        if (result.passed) {
            soundManager.playPowerUp();
            onCreditChanged?.(entities.wallet.balance);
            const learned = syncSkills();
            setLearnedSkillNames(learned.map(id => getGameContent().skills.active.find(s => s.id === id)?.name ?? id));
            if (onExamPassed) onExamPassed(bookProgress.bookId);
            EventBus.emit('book-exam-passed', bookProgress.bookId);
        } else {
            soundManager.playHurt();
        }
    };

    // --- Daily Practice ---
    const handleStartDailyPractice = () => {
        if (!canAccessDailyPractice) {
            soundManager.playHurt();
            return;
        }
        const eligibleQuestions = allQuestions.filter(q => {
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

    const handleSelectPracticeAnswer = (qIndex: number, optIndex: number) => {
        setPracticeAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
        soundManager.playSelect();
    };

    const handleSubmitDailyPractice = () => {
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
        if (result.success && result.correctCount > 0) {
            soundManager.playPowerUp();
            onCreditChanged?.(entities.wallet.balance);
        }
    };

    const canPracticeToday = entities.spacedRepetition.canPracticeToday(todayDate);

    const ribbonTabs: BookTabItem[] = [
        { id: 'exam', label: 'ສອບເສັງ (Exam)', icon: '📝' },
        { id: 'practice', label: 'ຝຶກຝົນ (Practice)', icon: '🧠' },
        { id: 'skills', label: 'ທັກສະ (Skills)', icon: '✨', testId: 'academy-tab-skills' },
    ];

    return (
        <BookFrame
            isOpen={isOpen}
            onClose={onClose}
            title="ສະຖາບັນຝຶກຝົນວິຊາການ (Academy)"
            icon="🏛️"
            subtitle="ສອບເສັງທົດສອບຄວາມຮູ້ເພື່ອຮັບ Credit ແລະ ປົດລັອກໂຮງຕີເຫຼັກ"
            tabs={ribbonTabs}
            activeTab={activeTab}
            onTabChange={t => setActiveTab(t as 'exam' | 'practice' | 'skills')}
            maxWidth="max-w-4xl"
            className="academy-modal"
            leftPage={
                <div className="space-y-3 book-page-turn">
                    {activeTab === 'exam' && (
                        <>
                            <div className="pb-1.5 border-b border-[#d4c5a9]">
                                <h3 className="font-bold text-amber-950 text-xs sm:text-sm">
                                    📖 ປຶ້ມຕຳລາສອບເສັງ ({books.length})
                                </h3>
                                <p className="text-[11px] text-amber-800">ເລືອກບົດຮຽນເພື່ອເຂົ້າສອບເສັງ</p>
                            </div>

                            <div className="space-y-2">
                                {books.map(b => {
                                    const bp = ensureBookProgress(b.id);
                                    const icon = bp.examPassed ? '⭐' : bp.isUnlocked ? '📖' : '🔒';
                                    const isSelected = selectedBookId === b.id;

                                    return (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedBookId(b.id);
                                                soundManager.playSelect();
                                            }}
                                            className={`min-h-[44px] w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${isSelected
                                                ? 'bg-amber-100/90 border-amber-600 shadow-sm'
                                                : 'bg-[#fffdfa]/60 border-[#d4c5a9] hover:bg-amber-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-xl">{icon}</span>
                                                <div className="min-w-0">
                                                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-1.5 py-0.2 rounded">
                                                        ບົດທີ {b.chapter}
                                                    </span>
                                                    <h4 className="font-bold text-xs sm:text-sm text-amber-950 truncate">
                                                        {b.title}
                                                    </h4>
                                                </div>
                                            </div>
                                            {bp.examPassed ? (
                                                <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                                    {bp.bestScore}/5 ⭐
                                                </span>
                                            ) : bp.isUnlocked ? (
                                                <span className="text-[11px] text-amber-800 font-semibold bg-amber-200/50 px-2 py-0.5 rounded-full">
                                                    ພ້ອມສອບ
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-amber-900/40">🔒 ຍັງບໍ່ຊື້</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {currentBook && bookProgress && (
                                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-300 text-xs text-amber-950 space-y-1.5 mt-2">
                                    <div className="font-bold flex items-center gap-1.5 text-amber-900">
                                        <span>📜</span> ກະຕິກາການສອບເສັງ:
                                    </div>
                                    <p>• ຂໍ້ສອບ 5 ຂໍ້ (ສຸ່ມຈາກບົດຮຽນ ຜ່ານເກນ: 4/5 ຂໍ້)</p>
                                    <p className="font-bold text-emerald-800">• ສອບຜ່ານຄັ້ງທຳອິດ: +50 🎓 Credit & ປົດລັອກສູດສ້າງ!</p>
                                    <p>• ສອບຊ້ຳ: +5 🎓 Credit (ໄດ້ 1 ຄັ້ງຕໍ່ມື້)</p>
                                    <p className="text-[11px] text-amber-800/80">ຈຳນວນຄັ້ງທີ່ສອບ: {bookProgress.attempts} ຄັ້ງ</p>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'practice' && (
                        <div className="space-y-3">
                            <div className="pb-1.5 border-b border-[#d4c5a9]">
                                <h3 className="font-bold text-amber-950 text-xs sm:text-sm">
                                    🧠 ຝຶກຝົນປະຈຳວັນ (Spaced Repetition)
                                </h3>
                                <p className="text-[11px] text-amber-800">ທົບທວນຄວາມຮູ້ເພື່ອບໍ່ໃຫ້ລືມ</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-300 text-xs text-amber-950 space-y-2">
                                <p>
                                    ລະບົບຈະຄັດເລືອກ 3 ຄຳຖາມ ໂດຍເນັ້ນໃສ່ຂໍ້ທີ່ທ່ານເຄີຍຕອບຜິດ ຫຼື ຂໍ້ທີ່ຍັງບໍ່ທັນຄຸ້ນເຄີຍ.
                                </p>
                                <p className="font-bold text-emerald-800">
                                    ຕອບຖືກແຕ່ລະຂໍ້ຮັບທັນທີ +5 🎓 Credit!
                                </p>
                                <span className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                                    canPracticeToday ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-200/60 text-amber-900'
                                }`}>
                                    {canPracticeToday ? '✓ ພ້ອມຝຶກຝົນວັນນີ້' : '🔒 ຄົບໂຄຕ້າວັນນີ້ແລ້ວ'}
                                </span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'skills' && (
                        <div className="space-y-3">
                            <div className="pb-1.5 border-b border-[#d4c5a9]">
                                <h3 className="font-bold text-amber-950 text-xs sm:text-sm">
                                    ✨ ຄັງທັກສະ (Skills Library)
                                </h3>
                                <p className="text-[11px] text-amber-800">ທັກສະທີ່ໄດ້ຈາກການສອບເສັງ</p>
                            </div>
                            <p className="text-xs text-amber-900 leading-relaxed bg-[#fffdfa]/60 p-2.5 rounded-xl border border-[#d4c5a9]">
                                ເມື່ອສອບເສັງຜ່ານແຕ່ລະບົດຮຽນ ທ່ານຈະໄດ້ຮັບທັກສະໃໝ່ (Active Skill) ທີ່ສາມາດໃຊ້ໃນການຕໍ່ສູ້ໄດ້ (ກົດ K ຫຼື L).
                            </p>
                        </div>
                    )}
                </div>
            }
            rightPage={
                <div className="flex flex-col h-full space-y-3 book-page-turn text-amber-950">
                    {activeTab === 'exam' ? (
                        !examSession && !examResults ? (
                            <div className="space-y-4">
                                <div className="p-3 rounded-xl bg-[#fffdfa]/70 border border-[#d4c5a9] space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-base text-amber-950">{currentBook.title}</h3>
                                            <p className="text-xs text-amber-800/80">{currentBook.titleEn}</p>
                                        </div>
                                        {bookProgress?.examPassed ? (
                                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                                ⭐ ສອບຜ່ານແລ້ວ ({bookProgress.bestScore}/5)
                                            </span>
                                        ) : !bookProgress?.isUnlocked ? (
                                            <span className="text-xs font-bold text-amber-900/60 bg-amber-200/50 px-2 py-0.5 rounded-full">
                                                🔒 ຍັງບໍ່ໄດ້ຊື້ປຶ້ມ
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                                                📖 ອ່ານ {readProgress.readCount}/{readProgress.totalPages} ໜ້າ
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-amber-900 leading-relaxed">{currentBook.description}</p>
                                </div>

                                {/* Gate 1: Book Not Purchased */}
                                {!bookProgress?.isUnlocked ? (
                                    <div className="p-4 rounded-xl bg-amber-100/70 border border-amber-300 text-center space-y-3">
                                        <p className="text-xs sm:text-sm font-bold text-amber-950">
                                            🔒 ບໍ່ສາມາດເຂົ້າສອບເສັງໄດ້ — ທ່ານຍັງບໍ່ໄດ້ຊື້ປຶ້ມຕຳລາ "{currentBook.title}"
                                        </p>
                                        <p className="text-xs text-amber-900/80">
                                            ກະລຸນາໄປຊື້ປຶ້ມຕຳລາທີ່ <strong>ຫໍສະໝຸດ (Library)</strong> ລາຄາ {currentBook.price} 🎓 Credit
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                if (onOpenLibraryStore) onOpenLibraryStore();
                                                else EventBus.emit('open-library');
                                            }}
                                            className="min-h-[44px] book-btn-craft"
                                        >
                                            🏛️ ໄປຊື້ປຶ້ມທີ່ຫໍສະໝຸດ (Library)
                                        </button>
                                    </div>
                                ) : !canStartCurrentExam ? (
                                    /* Gate 2: Book Purchased, Not Fully Read */
                                    <div className="p-4 rounded-xl bg-amber-100/70 border border-amber-300 text-center space-y-3">
                                        <p className="text-xs sm:text-sm font-bold text-amber-950">
                                            📖 ກະລຸນາອ່ານປຶ້ມຕຳລາໃຫ້ຄົບທຸກໜ້າກ່ອນເຂົ້າສອບເສັງ ({readProgress.readCount}/{readProgress.totalPages} ໜ້າ)
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose();
                                                if (onOpenReader) onOpenReader(currentBook.id);
                                            }}
                                            className="min-h-[44px] book-btn-craft"
                                        >
                                            📖 ເປີດອ່ານປຶ້ມຕຳລາຕໍ່ ({readProgress.readCount}/{readProgress.totalPages})
                                        </button>
                                    </div>
                                ) : (
                                    /* Ready to start exam */
                                    <button
                                        type="button"
                                        onClick={handleStartExam}
                                        className="min-h-[44px] book-btn-craft w-full"
                                    >
                                        ✍️ ເລີ່ມສອບເສັງ (Start Exam)
                                    </button>
                                )}
                            </div>
                        ) : examResults ? (
                            /* Exam Results Screen */
                            <div className="space-y-4">
                                <div className={`p-4 rounded-xl border text-center space-y-2 ${examResults.passed
                                    ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                                    : 'bg-rose-100/70 border-rose-300 text-rose-950'
                                    }`}>
                                    <span className="text-4xl">{examResults.passed ? '🎉' : '❌'}</span>
                                    <h3 className="text-base sm:text-lg font-bold">
                                        {examResults.passed ? 'ຍິນດີດ້ວຍ! ທ່ານສອບເສັງຜ່ານແລ້ວ' : 'ເສຍໃຈນຳ! ຄະແນນຍັງບໍ່ເຖິງເກນຜ່ານ'}
                                    </h3>
                                    <p className="text-sm font-bold">
                                        ຄະແນນທີ່ໄດ້: {examResults.score} / {examResults.total}
                                    </p>
                                    {examResults.passed && (
                                        <p className="text-xs font-bold text-amber-800">
                                            {examResults.creditReward > 0
                                                ? `+${examResults.creditReward} 🎓 Credit ໄດ້ຮັບແລ້ວ!`
                                                : '✅ ວັນນີ້ຮັບລາງວັນສອບຊ້ຳແລ້ວ (ໄດ້ 1 ຄັ້ງຕໍ່ມື້)'}
                                            {examResults.forgeUnlocked && ' 🔨 ໂຮງຕີເຫຼັກ (Forge) ປົດລັອກແລ້ວ!'}
                                        </p>
                                    )}
                                    {examResults.passed && learnedSkillNames.length > 0 && (
                                        <p className="text-xs text-sky-800 font-bold" data-testid="skill-learned">
                                            ✨ ໄດ້ສະກິວໃໝ່: {learnedSkillNames.join(', ')} (ກົດ K ຫຼື L)
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setExamSession(null); setExamResults(null); }}
                                    className="min-h-[44px] w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-700 text-amber-100 font-bold text-xs sm:text-sm shadow"
                                >
                                    ກັບຄືນໜ້າສະຖາບັນ
                                </button>
                            </div>
                        ) : (
                            /* Active Exam In Progress */
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-[#fffdfa]/70 p-2.5 rounded-xl border border-[#d4c5a9]">
                                    <span className="font-bold text-xs sm:text-sm text-amber-950">
                                        ການສອບເສັງ: {currentBook?.title}
                                    </span>
                                    <span className="text-xs font-bold text-amber-800">
                                        ຕອບແລ້ວ {examSession?.answeredCount || 0} / {examSession?.totalQuestions || 5} ຂໍ້
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                                    {examSession?.questions.map((q, idx) => {
                                        const selectedOpt = examSession.getSelectedAnswer(idx);
                                        return (
                                            <div key={q.id} className="bg-[#fffdfa]/60 p-3 rounded-xl border border-[#d4c5a9] space-y-2">
                                                <h4 className="font-bold text-xs sm:text-sm text-amber-950 flex gap-1.5">
                                                    <span className="text-amber-800">ຂໍ້ {idx + 1}.</span>
                                                    <span>{q.question}</span>
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                    {q.options.map((opt, oIdx) => {
                                                        const isChosen = selectedOpt === oIdx;
                                                        return (
                                                            <button
                                                                key={oIdx}
                                                                type="button"
                                                                onClick={() => handleAnswerExamQuestion(idx, oIdx)}
                                                                className={`min-h-[44px] p-2 rounded-lg text-left text-xs font-medium border transition ${isChosen
                                                                    ? 'bg-amber-200 border-amber-600 text-amber-950 font-bold shadow-inner'
                                                                    : 'bg-[#ede0c8] border-[#c49a6c] text-amber-900 hover:bg-[#e4d4b8]'
                                                                    }`}
                                                            >
                                                                <span className="font-bold mr-1.5 text-amber-800">{String.fromCharCode(65 + oIdx)}.</span>
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
                                    type="button"
                                    onClick={handleSubmitExam}
                                    disabled={!examSession?.isComplete}
                                    className={`min-h-[44px] w-full py-2.5 rounded-xl font-bold text-sm shadow transition ${examSession?.isComplete
                                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                                        : 'bg-amber-200/50 text-amber-900/40 cursor-not-allowed border border-amber-300'
                                        }`}
                                >
                                    ສົ່ງບົດສອບເສັງ (Submit Exam)
                                </button>
                            </div>
                        )
                    ) : activeTab === 'skills' ? (
                        <div className="overflow-y-auto flex-1">
                            <SkillsPanel onChanged={() => onCreditChanged?.(entities.wallet.balance)} />
                        </div>
                    ) : (
                        /* Daily Practice */
                        <div className="space-y-4">
                            {!practiceResults ? (
                                practiceQuestions.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-[#fffdfa]/70 border border-[#d4c5a9] text-center space-y-3">
                                        <h4 className="font-bold text-sm text-amber-950">ພ້ອມເລີ່ມຝຶກຝົນປະຈຳວັນແລ້ວບໍ່?</h4>
                                        <p className="text-xs text-amber-900/80">3 ຂໍ້ສອບ ສຸ່ມຕາມລະບົບ Spaced Repetition</p>
                                        <button
                                            type="button"
                                            onClick={handleStartDailyPractice}
                                            disabled={!canPracticeToday}
                                            className={`min-h-[44px] book-btn-craft ${!canPracticeToday ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {canPracticeToday ? '🧠 ເລີ່ມຝຶກຝົນວັນນີ້' : '🔒 ຄົບໂຄຕ້າວັນນີ້ແລ້ວ'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {practiceQuestions.map((q, idx) => (
                                            <div key={q.id} className="bg-[#fffdfa]/60 p-3 rounded-xl border border-[#d4c5a9] space-y-2">
                                                <h4 className="font-bold text-xs sm:text-sm text-amber-950">
                                                    ຂໍ້ {idx + 1}. {q.question}
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                                    {q.options.map((opt, oIdx) => (
                                                        <button
                                                            key={oIdx}
                                                            type="button"
                                                            onClick={() => handleSelectPracticeAnswer(idx, oIdx)}
                                                            className={`min-h-[44px] p-2 rounded-lg text-left text-xs border ${practiceAnswers[idx] === oIdx
                                                                ? 'bg-amber-200 border-amber-600 font-bold'
                                                                : 'bg-[#ede0c8] border-[#c49a6c]'
                                                                }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleSubmitDailyPractice}
                                            className="min-h-[44px] book-btn-craft w-full"
                                        >
                                            ສົ່ງຄຳຕອບຝຶກຝົນ
                                        </button>
                                    </div>
                                )
                            ) : (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-center space-y-3">
                                    <h4 className="font-bold text-sm text-amber-950">ຜົນການຝຶກຝົນ</h4>
                                    <p className="text-xs font-bold text-emerald-800">
                                        ຕອບຖືກ {practiceResults.correctCount} / 3 ຂໍ້ (+{practiceResults.creditReward} Credit)
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => { setPracticeQuestions([]); setPracticeResults(null); }}
                                        className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-800 text-amber-100 font-bold text-xs shadow"
                                    >
                                        ກັບຄືນ
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            }
            tabExtra={
                <span className="font-bold font-mono text-xs text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                    🎓 {entities.wallet.balance} Credit
                </span>
            }
        />
    );
};
