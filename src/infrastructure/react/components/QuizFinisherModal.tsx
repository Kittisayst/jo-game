import React, { useEffect, useState } from 'react';
import { QuestionData } from '../../../domain/entities/Quiz';
import { getGameContent } from '../../content/ContentCatalog';
import { soundManager } from '../../audio/SoundManager';

interface QuizFinisherModalProps
{
    isOpen: boolean;
    onClose: () => void;
    onPass: () => void;
    onFail: () => void;
}

export const QuizFinisherModal: React.FC<QuizFinisherModalProps> = ({
    isOpen,
    onClose,
    onPass,
    onFail,
}) =>
{
    const [question, setQuestion] = useState<QuestionData | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() =>
    {
        if (isOpen)
        {
            const ch1Questions = getGameContent().questions.filter(q => q.bookId === 'book-ch1');
            if (ch1Questions.length > 0)
            {
                const rand = ch1Questions[Math.floor(Math.random() * ch1Questions.length)];
                setQuestion(rand);
                setSelectedOption(null);
                setIsAnswered(false);
            }
        }
    }, [isOpen]);

    if (!isOpen || !question) return null;

    const handleSubmit = () =>
    {
        if (selectedOption === null) return;
        const correct = selectedOption === question.correctIndex;
        setIsAnswered(true);
        setIsCorrect(correct);

        if (correct)
        {
            soundManager.playPowerUp();
        }
        else
        {
            soundManager.playHurt();
        }
    };

    const handleContinue = () =>
    {
        onClose();
        if (isCorrect)
        {
            onPass();
        }
        else
        {
            onFail();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
            <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 border-2 border-purple-500 shadow-2xl p-6 space-y-5 text-center">
                <span className="text-5xl animate-pulse">⚡</span>
                <div>
                    <h3 className="text-xl font-black text-purple-300">ທ່າໄມ້ຕາຍປິດສາກ (Knowledge Finisher!)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        ບອສກຳລັງຈະໝົດພະລັງ! ຕອບຄຳຖາມຄວາມຮູ້ໃຫ້ຖືກຕ້ອງເພື່ອປິດສາກການຕໍ່ສູ້!
                    </p>
                </div>

                {!isAnswered ? (
                    <div className="space-y-4 text-left">
                        <div className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/40 text-sm font-bold text-white">
                            {question.question}
                        </div>

                        <div className="space-y-2">
                            {question.options.map((opt, idx) =>
                            {
                                const isChosen = selectedOption === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => { setSelectedOption(idx); soundManager.playSelect(); }}
                                        className={`w-full p-3 rounded-xl text-left text-xs font-semibold border transition ${
                                            isChosen
                                                ? 'bg-purple-600/40 border-purple-400 text-white font-bold'
                                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className="mr-2 text-purple-400 font-bold">{String.fromCharCode(65 + idx)}.</span>
                                        <span>{opt}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={selectedOption === null}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition shadow-lg ${
                                selectedOption !== null
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            ປ່ອຍພະລັງໂຈມຕີປິດສາກ! 💥
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <span className="text-5xl">{isCorrect ? '🏆' : '⚠️'}</span>
                        <h4 className={`text-xl font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isCorrect ? 'ຕອບຖືກຕ້ອງ! ບອສຖືກປາບລົງແລ້ວ!' : 'ຕອບຜິດ! ບອສຟື້ນຟູພະລັງ 15%!'}
                        </h4>
                        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                            {question.explanation}
                        </p>
                        {!isCorrect && (
                            <p className="text-xs text-indigo-300">
                                📖 ອ່ານທົບທວນໄດ້ທີ່ໜ້າ {question.pageNumber} ຂອງຕຳລາບົດທີ 1 (ເປີດຈາກກະເປົາ ຫຼື ຫໍສະໝຸດໃນໝູ່ບ້ານ)
                            </p>
                        )}
                        <button
                            onClick={handleContinue}
                            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                        >
                            ດຳເນີນການຕໍ່
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
