import React, { useState } from 'react';
import type { StageQuestionResult } from '../../../application/AnswerStageQuestionUseCase';
import type { QuestionData } from '../../../domain/entities/Quiz';
import { soundManager } from '../../audio/SoundManager';

interface StageQuestionModalProps
{
    /** Stage number shown in the heading. */
    stageNumber: number;
    question: QuestionData;
    /** Marks the answer (the rules and the Credit are in the use case) and returns what happened. */
    onAnswer: (selectedIndex: number) => StageQuestionResult;
    /** Clears the Stage and goes home; the answer never blocks that. */
    onContinue: () => void;
}

/** The one question asked when the hero walks out of a Stage, drawn from that Stage's lessons. */
export const StageQuestionModal: React.FC<StageQuestionModalProps> = ({ stageNumber, question, onAnswer, onContinue }) =>
{
    const [selected, setSelected] = useState<number | null>(null);
    const [result, setResult] = useState<StageQuestionResult | null>(null);

    const submit = () =>
    {
        if (selected === null || result) return;
        const marked = onAnswer(selected);
        setResult(marked);
        if (marked.correct) soundManager.playPowerUp(); else soundManager.playHurt();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in" data-testid="stage-question">
            <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-2 border-emerald-500 shadow-2xl p-6 space-y-5 text-center">
                <span className="text-5xl">🎓</span>
                <div>
                    <h3 className="text-xl font-black text-emerald-300">ຄຳຖາມທ້າຍດ່ານ {stageNumber}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        ຕອບຖືກໄດ້ Credit (ຄັ້ງທຳອິດຂອງດ່ານນີ້). ຕອບຜິດກໍ່ຜ່ານດ່ານໄດ້ ແຕ່ບໍ່ໄດ້ Credit.
                    </p>
                </div>

                {!result ? (
                    <div className="space-y-4 text-left">
                        <div data-testid="stage-question-text" className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/40 text-sm font-bold text-white">
                            {question.question}
                        </div>

                        <div className="space-y-2">
                            {question.options.map((option, index) => (
                                <button
                                    key={index}
                                    data-testid="stage-question-option"
                                    type="button"
                                    onClick={() => { setSelected(index); soundManager.playSelect(); }}
                                    className={`w-full p-3 rounded-xl text-left text-xs font-semibold border transition ${
                                        selected === index
                                            ? 'bg-emerald-600/40 border-emerald-400 text-white font-bold'
                                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                                    }`}
                                >
                                    <span className="mr-2 text-emerald-400 font-bold">{String.fromCharCode(65 + index)}.</span>
                                    <span>{option}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            data-testid="stage-question-submit"
                            onClick={submit}
                            disabled={selected === null}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition shadow-lg ${
                                selected !== null
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            ຢືນຢັນຄຳຕອບ
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <span className="text-5xl">{result.correct ? '🏆' : '📖'}</span>
                        <h4 className={`text-xl font-bold ${result.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {result.correct
                                ? (result.creditReward > 0 ? `ຕອບຖືກ! +${result.creditReward} 🎓 Credit` : 'ຕອບຖືກ! (ດ່ານນີ້ໄດ້ Credit ໄປແລ້ວ)')
                                : 'ຕອບຜິດ ແຕ່ຜ່ານດ່ານໄດ້'}
                        </h4>
                        <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                            {result.explanation}
                        </p>
                        {!result.correct && (
                            <p className="text-xs text-indigo-300">
                                📖 ອ່ານທົບທວນບົດ {question.lesson} ໃນຕຳລາ (ຫໍສະໝຸດໃນໝູ່ບ້ານ) ແລ້ວກັບມາຕອບໃໝ່ເມື່ອຫຼິ້ນດ່ານນີ້ອີກ
                            </p>
                        )}
                        <button
                            type="button"
                            data-testid="stage-question-continue"
                            onClick={onContinue}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                        >
                            ກັບໝູ່ບ້ານ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
