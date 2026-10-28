import { useEffect, useState } from 'react';
import { DomainEvents } from '../../../domain/DomainEvents';
import {
    ACHIEVEMENT_UNLOCKED_EVENT,
    AchievementUnlockedPayload,
} from '../../../domain/entities/Achievement';

export function AchievementToast ()
{
    const [currentToast, setCurrentToast] = useState<AchievementUnlockedPayload | null>(null);

    useEffect(() =>
    {
        const handleUnlocked = (payload: AchievementUnlockedPayload) =>
        {
            setCurrentToast(payload);
            const timer = setTimeout(() =>
            {
                setCurrentToast(null);
            }, 4500);

            return () => clearTimeout(timer);
        };

        DomainEvents.on<AchievementUnlockedPayload>(ACHIEVEMENT_UNLOCKED_EVENT, handleUnlocked);

        return () =>
        {
            DomainEvents.off(ACHIEVEMENT_UNLOCKED_EVENT, handleUnlocked);
        };
    }, []);

    if (!currentToast) return null;

    return (
        <aside
            aria-live="polite"
            className="achievement-toast-container"
            onClick={() => setCurrentToast(null)}
            role="status"
        >
            <div className="achievement-toast-card">
                <div className="toast-icon-wrapper">
                    <span className="toast-large-icon">{currentToast.icon}</span>
                </div>
                <div className="toast-content">
                    <div className="toast-badge-header">
                        <span className="toast-trophy">🏆</span>
                        <span className="toast-unlocked-tag">ຜົນສຳເລັດປົດລັອກ!</span>
                    </div>
                    <div className="toast-title">{currentToast.title}</div>
                    <div className="toast-desc">{currentToast.description}</div>
                    <div className="toast-reward">
                        <span>ລາງວັນ:</span>
                        <span className="toast-coin-badge">+{currentToast.rewardCoins} 💰 ຫຼຽນ</span>
                    </div>
                </div>
                <button
                    aria-label="Close notification"
                    className="toast-close-btn"
                    onClick={(e) =>
                    {
                        e.stopPropagation();
                        setCurrentToast(null);
                    }}
                    type="button"
                >
                    ✕
                </button>
            </div>
        </aside>
    );
}
