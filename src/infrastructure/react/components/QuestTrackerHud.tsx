import React, { useState, useEffect } from 'react';
import { entities } from '../../composition';
import { EventBus } from '../../EventBus';
import { soundManager } from '../../audio/SoundManager';
import { DomainEvents } from '../../../domain/DomainEvents';
import { QUEST_ACCEPTED_EVENT, QUEST_CLAIMED_EVENT, QUEST_COMPLETED_EVENT } from '../../../application/QuestUseCases';

const STORAGE_KEY = 'kq_quest_hud_collapsed';

interface QuestTrackerHudProps
{
    visible?: boolean;
}

export const QuestTrackerHud: React.FC<QuestTrackerHudProps> = ({ visible = true }) =>
{
    const [collapsed, setCollapsed] = useState<boolean>(() =>
    {
        try
        {
            return localStorage.getItem(STORAGE_KEY) === 'true';
        }
        catch
        {
            return false;
        }
    });

    const [, setRevision] = useState(0);

    useEffect(() =>
    {
        const update = () => setRevision(r => r + 1);

        DomainEvents.on(QUEST_ACCEPTED_EVENT, update);
        DomainEvents.on(QUEST_COMPLETED_EVENT, update);
        DomainEvents.on(QUEST_CLAIMED_EVENT, update);

        const timer = setInterval(update, 1000);

        return () =>
        {
            DomainEvents.off(QUEST_ACCEPTED_EVENT, update);
            DomainEvents.off(QUEST_COMPLETED_EVENT, update);
            DomainEvents.off(QUEST_CLAIMED_EVENT, update);
            clearInterval(timer);
        };
    }, []);

    if (!visible) return null;

    const questBoard = entities.questBoard;
    const activeQuests = questBoard.acceptedQuests;
    const claimableCount = questBoard.claimableCount;

    const toggleCollapse = () =>
    {
        setCollapsed(prev =>
        {
            const next = !prev;
            try
            {
                localStorage.setItem(STORAGE_KEY, String(next));
            }
            catch { /* storage may be blocked */ }
            soundManager.playCoin();
            return next;
        });
    };

    const handleOpenBoard = () =>
    {
        EventBus.emit('open-quest-board');
    };

    return (
        <div
            className="quest-tracker-hud"
            style={{
                position: 'fixed',
                top: '75px',
                right: '16px',
                zIndex: 40,
                fontFamily: '"Noto Sans Lao", system-ui, sans-serif',
                pointerEvents: 'auto',
                maxWidth: '260px',
                transition: 'all 0.25s ease',
            }}
        >
            {collapsed ? (
                /* Collapsed View: Compact Floating Button */
                <button
                    type="button"
                    onClick={toggleCollapse}
                    title="ກົດເພື່ອເບິ່ງລາຍການພາລະກິດ (Expand Quest Tracker)"
                    style={{
                        background: claimableCount > 0
                            ? 'linear-gradient(135deg, #ca8a04, #eab308)'
                            : 'rgba(15, 23, 42, 0.85)',
                        border: `1.5px solid ${claimableCount > 0 ? '#fef08a' : '#38bdf8'}`,
                        borderRadius: '20px',
                        padding: '6px 14px',
                        color: claimableCount > 0 ? '#0f172a' : '#f8fafc',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <span>📜</span>
                    <span>{claimableCount > 0 ? `✨ ຮັບ (${claimableCount})` : `(${activeQuests.length})`}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>👁️</span>
                </button>
            ) : (
                /* Expanded View: Transparent Clean Card */
                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.88)',
                        border: '1.5px solid #334155',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.45)',
                        color: '#f8fafc',
                    }}
                >
                    {/* Header with Title and Toggle Button */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #334155',
                        paddingBottom: '6px',
                        marginBottom: '8px',
                    }}>
                        <div
                            onClick={handleOpenBoard}
                            style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.88rem',
                                fontWeight: 'bold',
                                color: '#fef08a',
                            }}
                            title="ກົດເພື່ອເປີດກະດານພາລະກິດເຕັມ"
                        >
                            <span>📜</span>
                            <span>ພາລະກິດ ({activeQuests.length})</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                type="button"
                                onClick={handleOpenBoard}
                                title="ເປີດກະດານພາລະກິດ"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#38bdf8',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    padding: '2px 4px',
                                }}
                            >
                                ↗️
                            </button>
                            <button
                                type="button"
                                onClick={toggleCollapse}
                                title="ຫຍໍ້ເກັບໄວ້ (Minimize)"
                                style={{
                                    background: '#334155',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#cbd5e1',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    padding: '2px 6px',
                                    lineHeight: '1',
                                }}
                            >
                                ➖
                            </button>
                        </div>
                    </div>

                    {/* Claimable Notification */}
                    {claimableCount > 0 && (
                        <div
                            onClick={handleOpenBoard}
                            style={{
                                background: '#ca8a0425',
                                border: '1px solid #eab308',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                marginBottom: '8px',
                                fontSize: '0.75rem',
                                color: '#fef08a',
                                cursor: 'pointer',
                                fontWeight: 600,
                                textAlign: 'center',
                            }}
                        >
                            ✨ ມີ {claimableCount} ພາລະກິດພ້ອມຮັບລາງວັນ!
                        </div>
                    )}

                    {/* Quest List */}
                    {activeQuests.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', padding: '6px 0' }}>
                            ບໍ່ມີພາລະກິດທີ່ກຳລັງເຮັດ<br />
                            <span
                                onClick={handleOpenBoard}
                                style={{ color: '#38bdf8', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                ກົດຮັບຢູ່ກະດານພາລະກິດ
                            </span>
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                            {activeQuests.map(q =>
                            {
                                const percent = Math.min(100, Math.round((q.progress / q.requiredCount) * 100));
                                const isReady = q.progress >= q.requiredCount;

                                return (
                                    <div
                                        key={q.id}
                                        style={{
                                            background: '#0f172a80',
                                            borderRadius: '6px',
                                            padding: '6px 8px',
                                            border: `1px solid ${isReady ? '#facc15' : '#334155'}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                                {q.icon} {q.title}
                                            </span>
                                            <span style={{ color: isReady ? '#facc15' : '#94a3b8', fontWeight: 600 }}>
                                                {q.progress}/{q.requiredCount}
                                            </span>
                                        </div>
                                        {/* Progress bar */}
                                        <div style={{
                                            background: '#1e293b',
                                            borderRadius: '3px',
                                            height: '4px',
                                            overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                background: isReady ? '#facc15' : '#38bdf8',
                                                height: '100%',
                                                width: `${percent}%`,
                                                transition: 'width 0.3s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
