import { useEffect, useState } from 'react';
import { formatTime } from '../utils/formatTime';

export interface GameOverModalProps
{
    currentLevel: string;
    score: number;
    elapsedSeconds: number;
    highScore: number;
    onRestart: () => void;
}

const GAME_TIPS = [
    '💡 Tip: ກົດກະໂດດ 2 ຄັ້ງ (Double Jump) ເພື່ອໂດດຂ້າມອຸປະສັກທີ່ສູງ!',
    '💡 Tip: ໂດດຢຽບຫົວ Slime ເພື່ອກຳຈັດ ແລະ ໄດ້ຮັບຄະແນນພິເສດ!',
    '💡 Tip: ເກັບດາວ ⭐ ເພື່ອເປັນອຳມະຕະ ແລະ ວິ່ງຊົນສັດຕູທຸກໂຕໄດ້!',
    '💡 Tip: ເມື່ອ Boss ກິ້ງພຸ່ງຊົນ (Roll Dash), ໃຫ້ຕັ້ງຈັງຫວະໂດດຂ້າມ!',
    '💡 Tip: ໃຊ້ປຸ່ມ A/D ຫຼື ປຸ່ມລູກສອນ ⬅️ ➡️ ໃນການຄວບຄຸມ!',
];

function useAnimatedCount (targetValue: number, durationMs = 600)
{
    const [displayVal, setDisplayVal] = useState(0);

    useEffect(() =>
    {
        if (targetValue <= 0)
        {
            setDisplayVal(0);
            return;
        }

        let startTime: number | null = null;
        let animationFrameId: number;

        const step = (timestamp: number) =>
        {
            if (!startTime) startTime = timestamp;
            const progress = Math.min(1, (timestamp - startTime) / durationMs);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayVal(Math.round(eased * targetValue));

            if (progress < 1)
            {
                animationFrameId = requestAnimationFrame(step);
            }
        };

        animationFrameId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animationFrameId);
    }, [targetValue, durationMs]);

    return displayVal;
}

export function GameOverModal ({
    currentLevel,
    score,
    elapsedSeconds,
    highScore,
    onRestart,
}: GameOverModalProps)
{
    const animatedScore = useAnimatedCount(score);
    const [randomTip] = useState(() => GAME_TIPS[Math.floor(Math.random() * GAME_TIPS.length)]);

    useEffect(() =>
    {
        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === 'Enter' || e.key === ' ')
            {
                e.preventDefault();
                onRestart();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onRestart]);

    return (
        <div className="game-over-overlay">
            <div className="game-over-card">
                <div className="game-over-icon-wrap">
                    <span className="game-over-skull">💀</span>
                    <span className="game-over-broken-heart">💔</span>
                </div>

                <h2>Game Over</h2>
                <p className="overlay-subtitle">ຊີວິດໝົດແລ້ວ! (You ran out of lives!)</p>

                <div className="complete-stats">
                    <div className="stat-item">
                        <span className="stat-label">🚩 Reached:</span>
                        <strong className="stat-val">{currentLevel.toUpperCase()}</strong>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">⭐ Final Score:</span>
                        <strong className="stat-val">{animatedScore}</strong>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">⏱️ Time Elapsed:</span>
                        <strong className="stat-val">{formatTime(elapsedSeconds)}</strong>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">🏆 Best Score:</span>
                        <strong className="stat-val">{highScore}</strong>
                    </div>
                </div>

                {/* Helpful Game Tip */}
                <div className="game-over-tip-card">
                    {randomTip}
                </div>

                <div className="modal-actions">
                    <button
                        autoFocus
                        className="primary-button danger"
                        onClick={onRestart}
                        type="button"
                    >
                        🔄 ລອງໃໝ່ອີກຄັ້ງ (Try Again) [Space]
                    </button>
                </div>
            </div>
        </div>
    );
}
