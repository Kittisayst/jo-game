import { useEffect, useState } from 'react';
import { formatTime } from '../utils/formatTime';
import { calculateStarRating } from '../../../domain/utils/calculateStarRating';
import { soundManager } from '../../audio/SoundManager';

export interface LevelCompleteModalProps
{
    currentLevel: string;
    nextLevel: string | null;
    score: number;
    elapsedSeconds: number;
    bestTime: number | null;
    isNewHighScore: boolean;
    isNewBestTime: boolean;
    onNextLevel: () => void;
    onRestartLevel: () => void;
    onPlayAgainFromStart: () => void;
    onOpenWorldMap?: () => void;
}

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

export function LevelCompleteModal ({
    currentLevel,
    nextLevel,
    score,
    elapsedSeconds,
    bestTime,
    isNewHighScore,
    isNewBestTime,
    onNextLevel,
    onRestartLevel,
    onPlayAgainFromStart,
    onOpenWorldMap,
}: LevelCompleteModalProps)
{
    const animatedScore = useAnimatedCount(score);

    const rating = calculateStarRating({
        coinsCollected: 0,
        targetCoins: 0,
        elapsedSeconds,
        targetSeconds: 60,
        score,
    });

    const [revealedStars, setRevealedStars] = useState(0);

    useEffect(() =>
    {
        if (currentLevel === 'village') return;

        const t1 = setTimeout(() =>
        {
            setRevealedStars(1);
            soundManager.playSelect();
        }, 300);

        let t2: ReturnType<typeof setTimeout> | undefined;
        let t3: ReturnType<typeof setTimeout> | undefined;

        if (rating.stars >= 2)
        {
            t2 = setTimeout(() =>
            {
                setRevealedStars(2);
                soundManager.playSelect();
            }, 650);
        }

        if (rating.stars >= 3)
        {
            t3 = setTimeout(() =>
            {
                setRevealedStars(3);
                soundManager.playPowerUp();
            }, 1000);
        }

        return () =>
        {
            clearTimeout(t1);
            if (t2) clearTimeout(t2);
            if (t3) clearTimeout(t3);
        };
    }, [rating.stars, currentLevel]);

    const heading = currentLevel === 'village'
        ? '🚪 ຜ່ານປະຕູໝູ່ບ້ານແລ້ວ! (Village Gate Opened!)'
        : nextLevel
            ? '🎉 Level Complete!'
            : currentLevel === 'level-3'
                ? '👑 VICTORY! KING SLIME DEFEATED!'
                : '🏆 Game Completed!';

    return (
        <div className="level-complete-overlay">
            {/* Confetti particles */}
            <div aria-hidden="true" className="confetti-container">
                {Array.from({ length: 24 }).map((_, i) => (
                    <div
                        key={i}
                        className="confetti-piece"
                        style={{
                            left: `${(i * 4.2) % 100}%`,
                            animationDelay: `${(i * 0.15) % 3}s`,
                            backgroundColor: ['#ffd700', '#38bdf8', '#ef4444', '#10b981', '#f43f5e', '#a855f7'][i % 6],
                        }}
                    />
                ))}
            </div>

            <div className="level-complete-card">
                <div className="victory-crown-emblem">👑</div>
                <h2>{heading}</h2>

                {currentLevel !== 'village' && (
                    <div className="star-rating-section">
                        <div className="star-rating-container">
                            {[1, 2, 3].map(starIndex => (
                                <span
                                    key={starIndex}
                                    className={`rating-star ${revealedStars >= starIndex ? 'earned pop' : 'unearned'}`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <div className="rating-grade-badge">
                            {revealedStars === 3
                                ? rating.titleLao
                                : revealedStars === 2
                                    ? '⭐⭐ ຍອດຢ້ຽມ! (Great Run!)'
                                    : '⭐ ຜ່ານດ່ານແລ້ວ! (Stage Clear!)'}
                        </div>
                    </div>
                )}

                {currentLevel === 'village' ? (
                    <div className="complete-stats">
                        <div className="stat-item">
                            <span className="stat-label">🏡 ສະຖານທີ່:</span>
                            <strong className="stat-val">ໝູ່ບ້ານເລີ່ມຕົ້ນ (Village)</strong>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">🚪 ປະຕູສູ່ Level 1:</span>
                            <strong className="stat-val">ເປີດພ້ອມອອກຜະຈົນໄພແລ້ວ!</strong>
                        </div>
                    </div>
                ) : (
                    <div className="complete-stats">
                        <div className="stat-item">
                            <span className="stat-label">🚩 Stage:</span>
                            <strong className="stat-val">{currentLevel.toUpperCase()}</strong>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">⭐ Total Score:</span>
                            <strong className="stat-val">
                                {animatedScore}
                                {isNewHighScore && <span className="record-pill">🎉 Record!</span>}
                            </strong>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">⏱️ Speedrun Time:</span>
                            <strong className="stat-val">
                                {formatTime(elapsedSeconds)}
                                {isNewBestTime && <span className="record-pill">🔥 Best!</span>}
                            </strong>
                        </div>
                        {bestTime !== null && (
                            <div className="stat-item">
                                <span className="stat-label">🏆 Best Time:</span>
                                <strong className="stat-val">{formatTime(bestTime)}</strong>
                            </div>
                        )}
                    </div>
                )}

                <div className="modal-actions">
                    {nextLevel ? (
                        <>
                            <button
                                autoFocus
                                className="primary-button"
                                onClick={onNextLevel}
                                type="button"
                            >
                                {currentLevel === 'village' ? 'ເຂົ້າສູ່ Level 1 ➡️' : 'Next Level ➡️'}
                            </button>
                            <button
                                className="secondary-button"
                                onClick={onRestartLevel}
                                type="button"
                            >
                                Replay Level 🔄
                            </button>
                            {onOpenWorldMap && (
                                <button
                                    className="secondary-button"
                                    onClick={onOpenWorldMap}
                                    type="button"
                                >
                                    🗺️ ແຜນທີ່ດ່ານ (World Map)
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                autoFocus
                                className="primary-button"
                                onClick={onPlayAgainFromStart}
                                type="button"
                            >
                                Play Again from Start 🔄
                            </button>
                            {onOpenWorldMap && (
                                <button
                                    className="secondary-button"
                                    onClick={onOpenWorldMap}
                                    type="button"
                                >
                                    🗺️ ແຜນທີ່ດ່ານ (World Map)
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
