import React, { useEffect, useState } from 'react';
import { QuestionData } from '../../../domain/entities/Quiz';
import { loadQuestionsData } from '../../dataLoader';
import { entities } from '../../composition';
import { repairBrokenGateUseCase, RepairGateResult } from '../../../application/RepairBrokenGateUseCase';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';

interface GateRepairModalProps
{
    isOpen: boolean;
    onClose: () => void;
    gateId?: string;
    onGateRepaired?: () => void;
}

export const GateRepairModal: React.FC<GateRepairModalProps> = ({
    isOpen,
    onClose,
    gateId = 'gate-ch1',
    onGateRepaired,
}) =>
{
    const [questions, setQuestions] = useState<QuestionData[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [result, setResult] = useState<RepairGateResult | null>(null);

    useEffect(() =>
    {
        loadQuestionsData().then(qs =>
        {
            const ch1Questions = qs.filter(q => q.bookId === 'book-ch1');
            setQuestions(ch1Questions);
            if (ch1Questions.length > 0)
            {
                const rand = ch1Questions[Math.floor(Math.random() * ch1Questions.length)];
                setCurrentQuestion(rand);
            }
        }).catch(console.error);
    }, [isOpen]);

    if (!isOpen) return null;

    const hasHammer = entities.backpack.getAllSlots().some(s => s && s.itemId.startsWith('hammer'));
    const hasRepairKit = entities.backpack.getItemCount('repair-kit') >= 1;
    const canAttempt = hasHammer && hasRepairKit && currentQuestion !== null;

    const handleRepair = () =>
    {
        if (!currentQuestion || selectedOption === null) return;

        const res = repairBrokenGateUseCase(
            gateId,
            entities.repairedGates,
            entities.backpack,
            currentQuestion,
            selectedOption
        );

        setResult(res);

        if (res.success)
        {
            soundManager.playPowerUp();
            if (onGateRepaired) onGateRepaired();
            EventBus.emit('gate-repaired', gateId);
        }
        else
        {
            soundManager.playHurt();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/50 shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/30 bg-slate-900/80">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🚪</span>
                        <div>
                            <h2 className="text-lg font-bold text-amber-300">ສ້ອມແປງປະຕູໃຫຍ່ທີ່ຫັກພັງ (Broken Gate)</h2>
                            <p className="text-xs text-slate-400">ຕ້ອງໃຊ້ອຸປະກອນຊ່າງ ແລະ ຕອບຄຳຖາມຄວາມຮູ້ 1 ຂໍ້</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Requirements checklist */}
                    <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <span className="font-bold text-slate-300 block mb-1">ເງື່ອນໄຂການສ້ອມແປງ:</span>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <span>🔨</span>
                                <span>ຄ້ອນສ້ອມແປງ (Repair Hammer T1)</span>
                            </span>
                            <span className={hasHammer ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {hasHammer ? '✓ ມີແລ້ວ' : '✗ ຂາດຄ້ອນ (ສ້າງທີ່ໂຮງຊ່າງ)'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <span>🧰</span>
                                <span>ຊຸດສ້ອມແປງ (Repair Kit)</span>
                            </span>
                            <span className={hasRepairKit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {hasRepairKit ? `✓ ມີແລ້ວ (${entities.backpack.getItemCount('repair-kit')})` : '✗ ຂາດຊຸດສ້ອມແປງ (ສ້າງທີ່ໂຮງຊ່າງ)'}
                            </span>
                        </div>
                    </div>

                    {!result ? (
                        currentQuestion && canAttempt ? (
                            <div className="space-y-3 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                                <h4 className="font-bold text-white text-sm">
                                    💡 ຄຳຖາມປົດລັອກປະຕູ: {currentQuestion.question}
                                </h4>

                                <div className="space-y-2">
                                    {currentQuestion.options.map((opt, idx) =>
                                    {
                                        const isChosen = selectedOption === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => { setSelectedOption(idx); soundManager.playSelect(); }}
                                                className={`w-full p-2.5 rounded-lg text-left text-xs font-medium border transition ${
                                                    isChosen
                                                        ? 'bg-amber-500/30 border-amber-400 text-white font-bold'
                                                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                                                }`}
                                            >
                                                <span className="mr-2 text-amber-400 font-bold">{String.fromCharCode(65 + idx)}.</span>
                                                <span>{opt}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleRepair}
                                    disabled={selectedOption === null}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm transition shadow-lg mt-2 ${
                                        selectedOption !== null
                                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    ຢືນຢັນການສ້ອມແປງ
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-slate-400 text-xs">
                                {!hasHammer || !hasRepairKit ? (
                                    <p>ກະລຸນາກັບໄປທີ່ ໂຮງຊ່າງ (Workshop) ໃນໝູ່ບ້ານ ເພື່ອສ້າງຄ້ອນ ແລະ ຊຸດສ້ອມແປງກ່ອນ.</p>
                                ) : (
                                    <p>ກຳລັງໂຫຼດຄຳຖາມ...</p>
                                )}
                            </div>
                        )
                    ) : result.success ? (
                        <div className="text-center py-6 space-y-3">
                            <span className="text-5xl">🎉</span>
                            <h3 className="text-lg font-bold text-emerald-300">ປະຕູໃຫຍ່ໄດ້ຮັບການສ້ອມແປງສຳເລັດແລ້ວ!</h3>
                            <p className="text-xs text-slate-300">
                                ທາງເຂົ້າສູ່ລານປະລອງບອສ (Zone C) ເປີດອອກແລ້ວ!
                            </p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                            >
                                ຍ່າງຜ່ານປະຕູ
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-4 space-y-3">
                            <span className="text-4xl">❌</span>
                            <h3 className="text-base font-bold text-rose-300">ຄຳຕອບຍັງບໍ່ຖືກຕ້ອງ!</h3>
                            <p className="text-xs text-slate-300">
                                ໂຊກດີທີ່ຊຸດສ້ອມແປງບໍ່ໄດ້ສູນເສຍ. ທ່ານສາມາດທົດລອງໃໝ່ໄດ້.
                            </p>
                            {currentQuestion && (
                                <div className="text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1 text-left">
                                    <p className="text-emerald-300">ຄຳຕອບທີ່ຖືກ: {currentQuestion.options[currentQuestion.correctIndex]}</p>
                                    <p className="text-slate-300">💡 {currentQuestion.explanation}</p>
                                    <p className="text-indigo-300">📖 ອ່ານທົບທວນໄດ້ທີ່ໜ້າ {currentQuestion.pageNumber} ຂອງຕຳລາບົດທີ 1</p>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setSelectedOption(null);
                                    if (questions.length > 0)
                                    {
                                        const rand = questions[Math.floor(Math.random() * questions.length)];
                                        setCurrentQuestion(rand);
                                    }
                                }}
                                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
                            >
                                ລອງໃໝ່ອີກຄັ້ງ
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
