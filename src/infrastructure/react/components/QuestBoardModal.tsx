import React, { useState } from 'react';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { claimQuestRewardUseCase, acceptQuestUseCase, abandonQuestUseCase } from '../../../application/QuestUseCases';
import { autoSaveGame } from '../../saveSnapshot';
import { ItemIcon } from './ItemIcon';
import type { QuestCategory, QuestData, QuestRewardItem } from '../../../domain/entities/Quest';
import { BookFrame, BookTabItem } from './book/BookFrame';

interface QuestBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuestBoardModal: React.FC<QuestBoardModalProps> = ({ isOpen, onClose }) => {
    const [selectedTab, setSelectedTab] = useState<QuestCategory>('story');
    const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
    const [, setRevision] = useState(0);

    if (!isOpen) return null;

    const questBoard = entities.questBoard;
    const quests = questBoard.getByCategory(selectedTab);
    const claimableCount = questBoard.claimableCount;

    const activeQuest = quests.find(q => q.id === selectedQuestId) || quests[0] || null;

    const handleAccept = (questId: string) => {
        const success = acceptQuestUseCase(questBoard, questId);
        if (success) {
            soundManager.playPowerUp();
            setRevision(r => r + 1);
            autoSaveGame();
        }
    };

    const handleAbandon = (questId: string) => {
        const success = abandonQuestUseCase(questBoard, questId);
        if (success) {
            soundManager.playHurt();
            setRevision(r => r + 1);
            autoSaveGame();
        }
    };

    const handleClaim = (questId: string) => {
        const result = claimQuestRewardUseCase(
            questBoard,
            questId,
            entities.wallet,
            entities.backpack,
            entities.pendingRewards
        );

        if (result.success) {
            soundManager.playQuestClaim();
            setRevision(r => r + 1);
            autoSaveGame();
        }
    };

    const storyClaimable = questBoard.getByCategory('story').filter(q => q.completed && !q.claimed).length;
    const dailyClaimable = questBoard.getByCategory('daily').filter(q => q.completed && !q.claimed).length;
    const outsideClaimable = questBoard.getByCategory('outside').filter(q => q.completed && !q.claimed).length;

    const tabs: BookTabItem[] = [
        {
            id: 'story',
            label: '📖 ເນື້ອເລື່ອງ',
            badge: storyClaimable > 0 ? storyClaimable : undefined,
        },
        {
            id: 'daily',
            label: '📅 ປະຈຳວັນ',
            badge: dailyClaimable > 0 ? dailyClaimable : undefined,
        },
        {
            id: 'outside',
            label: '🌲 ພາລະກິດນອກ',
            badge: outsideClaimable > 0 ? outsideClaimable : undefined,
        },
    ];

    // Left Page: Quests List
    const leftPage = (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-[#d6c7a7]">
                <span className="book-subheading text-xs uppercase tracking-wider">
                    📜 ລາຍການພາລະກິດ ({quests.length})
                </span>
                <span className="text-[11px] text-[#78350f]">ກົດເພື່ອເບິ່ງລາຍລະອຽດ</span>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {quests.length === 0 ? (
                    <p className="text-center book-text-muted text-xs p-6">
                        ບໍ່ມີພາລະກິດໃນໝວດນີ້
                    </p>
                ) : (
                    quests.map((quest: QuestData) => {
                        const percent = Math.min(100, Math.round((quest.progress / quest.requiredCount) * 100));
                        const isSelected = activeQuest?.id === quest.id;

                        return (
                            <div
                                key={quest.id}
                                onClick={() => {
                                    soundManager.playSelect();
                                    setSelectedQuestId(quest.id);
                                }}
                                className={`book-card cursor-pointer flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition ${
                                    isSelected ? 'book-card-selected' : ''
                                } ${quest.claimed ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="text-2xl p-1.5 rounded-lg bg-amber-950/20 border border-amber-900/30 flex items-center justify-center flex-shrink-0">
                                        {quest.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <h4 className="book-heading text-sm font-bold truncate">
                                                {quest.title}
                                            </h4>
                                            {quest.completed && !quest.claimed && (
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold border border-amber-400">
                                                    ✨ ສຳເລັດ!
                                                </span>
                                            )}
                                            {quest.accepted && !quest.completed && (
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-200 text-sky-900 font-bold border border-sky-400">
                                                    ກຳລັງເຮັດ ({percent}%)
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] book-text-muted truncate">
                                            {quest.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Reward Preview & Quick Action */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded border border-amber-300">
                                        🪙 {quest.reward.credit}
                                    </span>

                                    {!quest.accepted ? (
                                        <button
                                            type="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleAccept(quest.id);
                                            }}
                                            className="min-h-[44px] text-xs px-3 py-1.5 rounded-lg font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition active:scale-95 flex items-center justify-center"
                                        >
                                            ຮັບ
                                        </button>
                                    ) : quest.completed && !quest.claimed ? (
                                        <button
                                            type="button"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleClaim(quest.id);
                                            }}
                                            className="min-h-[44px] text-xs px-3 py-1.5 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-sm transition active:scale-95 flex items-center justify-center animate-pulse"
                                        >
                                            ຮັບລາງວັນ
                                        </button>
                                    ) : quest.claimed ? (
                                        <span className="text-[11px] text-stone-500 font-bold px-2 py-1">
                                            ✓ ຮັບແລ້ວ
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-mono font-bold text-[#78350f] px-1">
                                            {quest.progress}/{quest.requiredCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    // Right Page: Bounty Details & Rewards
    const activePercent = activeQuest
        ? Math.min(100, Math.round((activeQuest.progress / activeQuest.requiredCount) * 100))
        : 0;

    const rightPage = activeQuest ? (
        <div className="h-full flex flex-col justify-between space-y-3">
            <div className="space-y-3">
                {/* Quest Header */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/10 border border-[#d6c7a7]">
                    <div className="text-3xl p-2 rounded-xl bg-[#2b1810] border-2 border-[#ca8a04] shadow flex items-center justify-center flex-shrink-0">
                        {activeQuest.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="book-heading text-base font-bold truncate">
                                {activeQuest.title}
                            </h3>
                            {activeQuest.completed && !activeQuest.claimed && (
                                <span className="book-badge">✨ ພ້ອມຮັບລາງວັນ</span>
                            )}
                            {activeQuest.claimed && (
                                <span className="book-badge">✓ ສຳເລັດແລ້ວ</span>
                            )}
                        </div>
                        <p className="text-xs book-subheading">ໝວດ: {activeQuest.category.toUpperCase()}</p>
                    </div>
                </div>

                {/* Lore / Description */}
                <p className="book-text text-xs italic bg-white/40 p-2.5 rounded-xl border border-[#d6c7a7]/60">
                    "{activeQuest.description}"
                </p>

                <div className="book-filigree-divider" />

                {/* Objective Checklist */}
                <div className="space-y-1.5">
                    <span className="book-subheading text-xs uppercase tracking-wide block">
                        🎯 ເປົ້າໝາຍພາລະກິດ (Objectives):
                    </span>
                    <div className="p-3 rounded-xl bg-white/50 border border-[#d6c7a7] space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold book-heading">
                            <span>ຄວາມຄືບໜ້າ:</span>
                            <span className="font-mono">
                                {activeQuest.progress} / {activeQuest.requiredCount} ({activePercent}%)
                            </span>
                        </div>
                        <div className="w-full bg-[#2b1810] rounded-full h-2.5 overflow-hidden border border-[#78350f]">
                            <div
                                style={{
                                    width: `${activePercent}%`,
                                    height: '100%',
                                    transition: 'width 0.3s',
                                    backgroundColor: activeQuest.completed ? '#16a34a' : '#d97706',
                                }}
                            />
                        </div>
                        {!activeQuest.accepted && (
                            <p className="text-[11px] text-amber-800 italic">
                                ⚠️ ຕ້ອງກົດຮັບພາລະກິດກ່ອນ ຈຶ່ງເລີ່ມນັບຄວາມຄືບໜ້າ
                            </p>
                        )}
                    </div>
                </div>

                {/* Rewards Checklist */}
                <div className="space-y-1.5">
                    <span className="book-subheading text-xs uppercase tracking-wide block">
                        🎁 ລາງວັນຕອບແທນ (Rewards):
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="book-ingredient-row book-ingredient-ok font-bold text-xs">
                            🪙 {activeQuest.reward.credit} Credit
                        </span>
                        {activeQuest.reward.items?.map((item: QuestRewardItem, i: number) => {
                            const itemDef = entities.itemCatalog.get(item.itemId);
                            return (
                                <span key={i} className="book-ingredient-row book-ingredient-ok text-xs">
                                    <ItemIcon iconImage={itemDef?.iconImage} icon={itemDef?.icon ?? '🎁'} size={18} />
                                    <span>{itemDef?.name ?? item.itemId} x{item.count}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Giant Action Button */}
            <div className="pt-2">
                {!activeQuest.accepted ? (
                    <button
                        type="button"
                        onClick={() => handleAccept(activeQuest.id)}
                        className="book-btn-craft w-full"
                    >
                        <span>📥</span>
                        <span>ຮັບພາລະກິດນີ້ (Accept Quest)</span>
                    </button>
                ) : activeQuest.completed && !activeQuest.claimed ? (
                    <button
                        type="button"
                        onClick={() => handleClaim(activeQuest.id)}
                        className="book-btn-craft w-full"
                    >
                        <span>✨</span>
                        <span>ຮັບລາງວັນ (Claim Reward)</span>
                    </button>
                ) : activeQuest.claimed ? (
                    <button
                        type="button"
                        disabled
                        className="book-btn-craft w-full"
                    >
                        <span>✓</span>
                        <span>ພາລະກິດສຳເລັດແລ້ວ (Claimed)</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled
                            className="book-btn-craft flex-1"
                        >
                            <span>⏳</span>
                            <span>ກຳລັງດຳເນີນການ ({activePercent}%)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleAbandon(activeQuest.id)}
                            className="min-h-[44px] px-3 py-2 text-xs rounded-xl bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-800 border border-stone-300 font-bold transition"
                            title="ຍົກເລີກພາລະກິດ"
                        >
                            ຍົກເລີກ
                        </button>
                    </div>
                )}
            </div>
        </div>
    ) : (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center book-text-muted">
            <span className="text-4xl mb-2">📜</span>
            <p className="text-sm font-bold">ເລືອກພາລະກິດຈາກໜ້າຊ້າຍ</p>
        </div>
    );

    return (
        <BookFrame
            isOpen={isOpen}
            dataTestId="quest-board-modal"
            onClose={onClose}
            title="ກະດານພາລະກິດ (Quest Board)"
            icon="📜"
            subtitle="ຮັບພາລະກິດເພື່ອຮັບ Credit, ວັດຖຸດິບ ແລະ ນ້ຳຢາເສີມພະລັງ"
            tabs={tabs}
            activeTab={selectedTab}
            onTabChange={t => setSelectedTab(t as QuestCategory)}
            leftPage={leftPage}
            rightPage={rightPage}
            className="quest-board-modal"
            tabExtra={
                <span className="font-bold font-mono text-xs text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                    {claimableCount > 0 && <span className="text-amber-200">✨{claimableCount} · </span>}
                    🎓 {entities.wallet.balance} Credit
                </span>
            }
        />
    );
};
