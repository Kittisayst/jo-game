import { useState } from 'react';
import {
    AchievementCategory,
    AchievementManager,
} from '../../../domain/entities/Achievement';
import { Wallet } from '../../../domain/entities/Wallet';
import { claimAchievementRewardUseCase } from '../../../application/ClaimAchievementRewardUseCase';
import { soundManager } from '../../audio/SoundManager';

export interface AchievementModalProps
{
    achievementManager: AchievementManager;
    wallet: Wallet;
    onClose: () => void;
    onRewardClaimed: (newBalance: number) => void;
}

const CATEGORY_TABS: Array<{ id: 'all' | AchievementCategory; label: string; icon: string }> = [
    { id: 'all', label: 'ທັງໝົດ', icon: '🌟' },
    { id: 'combat', label: 'ຕໍ່ສູ້', icon: '⚔️' },
    { id: 'progression', label: 'ດ່ານ', icon: '🚩' },
    { id: 'mastery', label: 'ຄວາມຊຳນານ', icon: '⭐' },
    { id: 'economy', label: 'ເສດຖະກິດ', icon: '💰' },
];

export function AchievementModal ({
    achievementManager,
    wallet,
    onClose,
    onRewardClaimed,
}: AchievementModalProps)
{
    const [selectedCategory, setSelectedCategory] = useState<'all' | AchievementCategory>('all');
    const [, setRevision] = useState(0);

    const achievements = achievementManager.getAllAchievements();
    const totalCount = achievements.length;
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const unclaimedCount = achievementManager.unclaimedCount;

    const filtered = selectedCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === selectedCategory);

    const handleClaim = (id: string) =>
    {
        const result = claimAchievementRewardUseCase(achievementManager, wallet, id);
        if (result.success)
        {
            soundManager.playBuy();
            onRewardClaimed(result.newBalance);
            setRevision(r => r + 1);
        }
    };

    return (
        <div className="achievement-modal-overlay" onClick={onClose}>
            <div className="achievement-modal-card" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="achievement-modal-header">
                    <div className="achievement-title-group">
                        <span className="achievement-header-trophy">🏆</span>
                        <div>
                            <h2>ຜົນສຳເລັດ & ພາລະກິດ (Achievements)</h2>
                            <p className="achievement-subtitle">
                                ປົດລັອກຄວາມສຳເລັດໃນການຜະຈົນໄພ ແລະ ຮັບຫຼຽນລາງວັນໄຊເບີພິເສດ!
                            </p>
                        </div>
                    </div>
                    <button
                        aria-label="Close"
                        className="achievement-close-btn"
                        onClick={onClose}
                        type="button"
                    >
                        ✕
                    </button>
                </div>

                {/* Progress Overview Bar */}
                <div className="achievement-overview-bar">
                    <div className="overview-metric">
                        <span className="overview-label">ປົດລັອກແລ້ວ</span>
                        <span className="overview-value">{unlockedCount} / {totalCount}</span>
                    </div>
                    <div className="overview-metric">
                        <span className="overview-label">ຄວາມຄືບໜ້າລວມ</span>
                        <span className="overview-value">{Math.round((unlockedCount / totalCount) * 100)}%</span>
                    </div>
                    {unclaimedCount > 0 && (
                        <div className="overview-unclaimed-alert">
                            <span>🎁 ມີ {unclaimedCount} ລາງວັນພ້ອມຮັບ!</span>
                        </div>
                    )}
                </div>

                {/* Category Filter Tabs */}
                <div className="achievement-tabs-bar">
                    {CATEGORY_TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`achievement-tab-btn ${selectedCategory === tab.id ? 'active-tab' : ''}`}
                            onClick={() => setSelectedCategory(tab.id)}
                            type="button"
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Achievements List */}
                <div className="achievement-cards-grid">
                    {filtered.map(ach =>
                    {
                        const progressPct = Math.min(100, Math.round((ach.progress / ach.targetCount) * 100));
                        const isReadyToClaim = ach.unlocked && !ach.claimed;

                        return (
                            <div
                                key={ach.id}
                                className={`achievement-card ${ach.unlocked ? 'card-unlocked' : 'card-locked'} ${isReadyToClaim ? 'card-claimable' : ''} ${ach.claimed ? 'card-claimed' : ''}`}
                            >
                                <div className="ach-card-left">
                                    <span className="ach-icon">{ach.icon}</span>
                                </div>

                                <div className="ach-card-center">
                                    <div className="ach-title">{ach.title}</div>
                                    <div className="ach-desc">{ach.description}</div>

                                    {/* Progress bar */}
                                    <div className="ach-progress-container">
                                        <div
                                            className="ach-progress-fill"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <div className="ach-progress-text">
                                        <span>ຄວາມຄືບໜ້າ: {ach.progress} / {ach.targetCount}</span>
                                        <span>{progressPct}%</span>
                                    </div>
                                </div>

                                <div className="ach-card-right">
                                    <div className="ach-reward-tag">+{ach.rewardCoins} 💰</div>
                                    {ach.claimed ? (
                                        <span className="ach-claimed-badge">✓ ຮັບແລ້ວ</span>
                                    ) : isReadyToClaim ? (
                                        <button
                                            className="ach-claim-btn"
                                            onClick={() => handleClaim(ach.id)}
                                            type="button"
                                        >
                                            🎁 ຮັບລາງວັນ
                                        </button>
                                    ) : (
                                        <span className="ach-locked-badge">🔒 ລັອກຢູ່</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
