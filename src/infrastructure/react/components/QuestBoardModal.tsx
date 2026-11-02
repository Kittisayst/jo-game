import React, { useState } from 'react';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { claimQuestRewardUseCase, acceptQuestUseCase, abandonQuestUseCase } from '../../../application/QuestUseCases';
import { autoSaveGame } from '../../saveSnapshot';
import { ItemIcon } from './ItemIcon';
import type { QuestCategory, QuestData, QuestRewardItem } from '../../../domain/entities/Quest';

interface QuestBoardModalProps
{
    isOpen: boolean;
    onClose: () => void;
}

export const QuestBoardModal: React.FC<QuestBoardModalProps> = ({ isOpen, onClose }) =>
{
    const [selectedTab, setSelectedTab] = useState<QuestCategory>('story');
    const [, setRevision] = useState(0);

    if (!isOpen) return null;

    const questBoard = entities.questBoard;
    const quests = questBoard.getByCategory(selectedTab);
    const claimableCount = questBoard.claimableCount;

    const handleAccept = (questId: string) =>
    {
        const success = acceptQuestUseCase(questBoard, questId);
        if (success)
        {
            soundManager.playPowerUp();
            setRevision(r => r + 1);
            autoSaveGame();
        }
    };

    const handleAbandon = (questId: string) =>
    {
        const success = abandonQuestUseCase(questBoard, questId);
        if (success)
        {
            soundManager.playHurt();
            setRevision(r => r + 1);
            autoSaveGame();
        }
    };

    const handleClaim = (questId: string) =>
    {
        const result = claimQuestRewardUseCase(
            questBoard,
            questId,
            entities.wallet,
            entities.backpack,
            entities.pendingRewards
        );

        if (result.success)
        {
            soundManager.playQuestClaim();
            setRevision(r => r + 1);
            autoSaveGame();
        }
    };

    const storyClaimable = questBoard.getByCategory('story').filter(q => q.completed && !q.claimed).length;
    const dailyClaimable = questBoard.getByCategory('daily').filter(q => q.completed && !q.claimed).length;
    const outsideClaimable = questBoard.getByCategory('outside').filter(q => q.completed && !q.claimed).length;

    return (
        <div className="gw-overlay modal-backdrop" onClick={onClose} style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
        }}>
            <div
                className="gw-window modal-container quest-board-modal"
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#1e293b',
                    border: '2px solid #38bdf8',
                    borderRadius: '12px',
                    width: '90%',
                    maxWidth: '720px',
                    maxHeight: '88vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.2)',
                    overflow: 'hidden',
                    color: '#f8fafc',
                    fontFamily: '"Noto Sans Lao", system-ui, sans-serif',
                }}
            >
                {/* Header */}
                <div className="gw-header" style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#0f172a',
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fef08a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📜</span> ກະດານພາລະກິດແຫ່ງປັນຍາ (Quest Board)
                        </h2>
                        <p className="gw-subtitle" style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                            ຮັບພາລະກິດເພື່ອຮັບ Credit ແລະ ນ້ຳຢາເສີມພະລັງ
                            {claimableCount > 0 && (
                                <span style={{ marginLeft: '8px', color: '#38bdf8', fontWeight: 'bold' }}>
                                    ✨ ພ້ອມຮັບ {claimableCount} ລາງວັນ!
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        className="gw-close"
                        onClick={onClose}
                        style={{
                            background: '#334155',
                            border: 'none',
                            color: '#cbd5e1',
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* 3 Category Tabs: Story, Daily, Outside */}
                <div className="gw-tabs" style={{
                    display: 'flex',
                    background: '#0f172a',
                    padding: '0 20px',
                    borderBottom: '1px solid #334155',
                    gap: '8px',
                }}>
                    <button
                        type="button"
                        onClick={() => setSelectedTab('story')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: selectedTab === 'story' ? '3px solid #38bdf8' : '3px solid transparent',
                            color: selectedTab === 'story' ? '#38bdf8' : '#94a3b8',
                            padding: '12px 14px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <span>📖 ເນື້ອເລື່ອງ (Story)</span>
                        {storyClaimable > 0 && (
                            <span style={{ background: '#eab308', color: '#0f172a', borderRadius: '10px', padding: '1px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {storyClaimable}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedTab('daily')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: selectedTab === 'daily' ? '3px solid #eab308' : '3px solid transparent',
                            color: selectedTab === 'daily' ? '#fef08a' : '#94a3b8',
                            padding: '12px 14px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <span>📅 ປະຈຳວັນ (Daily)</span>
                        {dailyClaimable > 0 && (
                            <span style={{ background: '#eab308', color: '#0f172a', borderRadius: '10px', padding: '1px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {dailyClaimable}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setSelectedTab('outside')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: selectedTab === 'outside' ? '3px solid #22c55e' : '3px solid transparent',
                            color: selectedTab === 'outside' ? '#86efac' : '#94a3b8',
                            padding: '12px 14px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <span>🌲 ພາລະກິດນອກ (Outside)</span>
                        {outsideClaimable > 0 && (
                            <span style={{ background: '#eab308', color: '#0f172a', borderRadius: '10px', padding: '1px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {outsideClaimable}
                            </span>
                        )}
                    </button>
                </div>

                {/* Quest List */}
                <div className="gw-body" style={{
                    padding: '16px 20px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flex: 1,
                }}>
                    {quests.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
                            ບໍ່ມີພາລະກິດໃນໝວດນີ້
                        </p>
                    ) : (
                        quests.map((quest: QuestData) =>
                        {
                            const percent = Math.min(100, Math.round((quest.progress / quest.requiredCount) * 100));

                            return (
                                <div
                                    key={quest.id}
                                    style={{
                                        background: quest.claimed ? '#0f172a80' : '#0f172a',
                                        border: `1px solid ${quest.completed && !quest.claimed ? '#facc15' : quest.accepted ? '#38bdf840' : '#334155'}`,
                                        borderRadius: '8px',
                                        padding: '14px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '16px',
                                        opacity: quest.claimed ? 0.6 : 1,
                                        transition: 'all 0.2s ease',
                                        boxShadow: quest.completed && !quest.claimed ? '0 0 10px rgba(250, 204, 21, 0.15)' : 'none',
                                    }}
                                >
                                    {/* Left icon & description */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                        <div style={{
                                            fontSize: '1.8rem',
                                            width: '44px',
                                            height: '44px',
                                            background: '#1e293b',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid #475569',
                                            flexShrink: 0,
                                        }}>
                                            {quest.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc' }}>
                                                    {quest.title}
                                                </span>
                                                {quest.completed && !quest.claimed && (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        background: '#eab30825',
                                                        color: '#facc15',
                                                        border: '1px solid #facc15',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 600,
                                                    }}>
                                                        ສຳເລັດ!
                                                    </span>
                                                )}
                                                {quest.accepted && !quest.completed && (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        background: '#0284c725',
                                                        color: '#38bdf8',
                                                        border: '1px solid #38bdf8',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 600,
                                                    }}>
                                                        ກຳລັງເຮັດ
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ margin: '2px 0 6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                {quest.description}
                                            </p>

                                            {/* Progress bar (only if accepted) */}
                                            {quest.accepted ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        flex: 1,
                                                        background: '#1e293b',
                                                        borderRadius: '4px',
                                                        height: '6px',
                                                        overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            background: quest.completed ? '#22c55e' : '#38bdf8',
                                                            height: '100%',
                                                            width: `${percent}%`,
                                                            transition: 'width 0.3s ease',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500, minWidth: '40px', textAlign: 'right' }}>
                                                        {quest.progress}/{quest.requiredCount}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: '#eab308', fontStyle: 'italic' }}>
                                                    ⚠️ ຕ້ອງກົດຮັບພາລະກິດກ່ອນ ຈຶ່ງເລີ່ມນັບຄວາມຄືບໜ້າ
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right side: Rewards & Action buttons */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                                        {/* Rewards Preview */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: '#1e293b',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid #334155',
                                        }}>
                                            <span style={{ fontSize: '0.85rem', color: '#fef08a', fontWeight: 'bold' }}>
                                                🪙 {quest.reward.credit}
                                            </span>
                                            {quest.reward.items?.map((item: QuestRewardItem, i: number) => {
                                                const itemDef = entities.itemCatalog.get(item.itemId);
                                                return (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title={`${itemDef?.name ?? item.itemId} x${item.count}`}>
                                                        <ItemIcon iconImage={itemDef?.iconImage} icon={itemDef?.icon ?? '🎁'} size={18} />
                                                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>x{item.count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            {!quest.accepted ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAccept(quest.id)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        color: '#ffffff',
                                                        padding: '6px 14px',
                                                        fontWeight: 600,
                                                        fontSize: '0.82rem',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    📥 ຮັບພາລະກິດ
                                                </button>
                                            ) : quest.completed && !quest.claimed ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleClaim(quest.id)}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        color: '#0f172a',
                                                        padding: '6px 14px',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.82rem',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 0 10px rgba(234, 179, 8, 0.4)',
                                                    }}
                                                >
                                                    ✨ ຮັບລາງວັນ
                                                </button>
                                            ) : quest.claimed ? (
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    color: '#64748b',
                                                    fontWeight: 600,
                                                    padding: '4px 8px',
                                                }}>
                                                    ✅ ສຳເລັດແລ້ວ
                                                </span>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 500 }}>
                                                        ⏳ ກຳລັງເຮັດ...
                                                    </span>
                                                    {quest.category !== 'story' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAbandon(quest.id)}
                                                            title="ຍົກເລີກພາລະກິດນີ້"
                                                            style={{
                                                                background: '#334155',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                color: '#94a3b8',
                                                                padding: '4px 6px',
                                                                fontSize: '0.75rem',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
