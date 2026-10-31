import React, { useState } from 'react';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { claimQuestRewardUseCase } from '../../../application/QuestUseCases';
import { autoSaveGame } from '../../saveSnapshot';
import { ItemIcon } from './ItemIcon';
import type { QuestData, QuestRewardItem } from '../../../domain/entities/Quest';

interface QuestBoardModalProps
{
    isOpen: boolean;
    onClose: () => void;
}

export const QuestBoardModal: React.FC<QuestBoardModalProps> = ({ isOpen, onClose }) =>
{
    const [, setRevision] = useState(0);

    if (!isOpen) return null;

    const quests = entities.questBoard.quests;
    const claimableCount = entities.questBoard.claimableCount;

    const handleClaim = (questId: string) =>
    {
        const result = claimQuestRewardUseCase(
            entities.questBoard,
            questId,
            entities.wallet,
            entities.backpack,
            entities.pendingRewards
        );

        if (result.success)
        {
            soundManager.playPowerUp();
            setRevision(r => r + 1);
            autoSaveGame();
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{
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
                className="modal-container quest-board-modal"
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#1e293b',
                    border: '2px solid #38bdf8',
                    borderRadius: '12px',
                    width: '90%',
                    maxWidth: '680px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.2)',
                    overflow: 'hidden',
                    color: '#f8fafc',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
            >
                {/* Header */}
                <div style={{
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
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                            ເຮັດພາລະກິດເພື່ອຮັບ Credit ແລະ ນ້ຳຢາເສີມພະລັງ
                            {claimableCount > 0 && (
                                <span style={{ marginLeft: '8px', color: '#38bdf8', fontWeight: 'bold' }}>
                                    ✨ ພ້ອມຮັບ {claimableCount} ລາງວັນ!
                                </span>
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
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

                {/* Quest List */}
                <div style={{
                    padding: '16px 20px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flex: 1,
                }}>
                    {quests.map((quest: QuestData) =>
                    {
                        const percent = Math.min(100, Math.round((quest.progress / quest.requiredCount) * 100));

                        return (
                            <div
                                key={quest.id}
                                style={{
                                    background: quest.claimed ? '#0f172a80' : '#0f172a',
                                    border: `1px solid ${quest.completed && !quest.claimed ? '#facc15' : '#334155'}`,
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
                                                    fontSize: '0.7rem',
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
                                        </div>
                                        <p style={{ margin: '2px 0 6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                            {quest.description}
                                        </p>

                                        {/* Progress Bar */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                flex: 1,
                                                height: '7px',
                                                background: '#334155',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                maxWidth: '220px',
                                            }}>
                                                <div style={{
                                                    width: `${percent}%`,
                                                    height: '100%',
                                                    background: quest.completed ? '#22c55e' : '#38bdf8',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.3s ease',
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 500 }}>
                                                {quest.progress} / {quest.requiredCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Rewards & Action button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>
                                            ລາງວັນ
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                color: '#fef08a',
                                                fontWeight: 600,
                                                background: '#ca8a0420',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                            }}>
                                                🎓 +{quest.reward.credit}
                                            </span>
                                            {quest.reward.items?.map((it: QuestRewardItem) => {
                                                const def = entities.itemCatalog.get(it.itemId);
                                                return (
                                                    <div key={it.itemId} title={`${def?.name ?? it.itemId} x${it.count}`} style={{ display: 'inline-flex' }}>
                                                        <ItemIcon iconImage={def?.iconImage} icon={def?.icon} size={22} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Claim / Status Button */}
                                    {quest.claimed ? (
                                        <button
                                            disabled
                                            style={{
                                                background: '#334155',
                                                color: '#64748b',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px 14px',
                                                fontSize: '0.85rem',
                                                cursor: 'default',
                                            }}
                                        >
                                            ✓ ຮັບແລ້ວ
                                        </button>
                                    ) : quest.completed ? (
                                        <button
                                            type="button"
                                            onClick={() => handleClaim(quest.id)}
                                            style={{
                                                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                                                color: '#0f172a',
                                                fontWeight: 'bold',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px 16px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 0 12px rgba(234, 179, 8, 0.4)',
                                                transition: 'transform 0.1s ease',
                                            }}
                                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            🎁 ຮັບລາງວັນ
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            style={{
                                                background: '#1e293b',
                                                color: '#64748b',
                                                border: '1px solid #334155',
                                                borderRadius: '6px',
                                                padding: '8px 14px',
                                                fontSize: '0.85rem',
                                                cursor: 'default',
                                            }}
                                        >
                                            ກຳລັງເຮັດ
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
