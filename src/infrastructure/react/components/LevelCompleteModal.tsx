import { formatTime } from '../utils/formatTime';

export interface LevelCompleteModalProps
{
    currentLevel: string;
    nextLevel: string | null;
    coinsCount: number;
    score: number;
    elapsedSeconds: number;
    bestTime: number | null;
    isNewHighScore: boolean;
    isNewBestTime: boolean;
    onNextLevel: () => void;
    onRestartLevel: () => void;
    onPlayAgainFromStart: () => void;
}

export function LevelCompleteModal ({
    currentLevel,
    nextLevel,
    coinsCount,
    score,
    elapsedSeconds,
    bestTime,
    isNewHighScore,
    isNewBestTime,
    onNextLevel,
    onRestartLevel,
    onPlayAgainFromStart,
}: LevelCompleteModalProps)
{
    const heading = nextLevel
        ? '🎉 Level Complete!'
        : currentLevel === 'level-3'
            ? '👑 VICTORY! KING SLIME DEFEATED!'
            : '🏆 Game Completed!';

    return (
        <div className="level-complete-overlay">
            <div className="level-complete-card">
                <h2>{heading}</h2>
                <div className="complete-stats">
                    <div className="stat-item">
                        <span className="stat-label">🚩 Stage:</span>
                        <strong className="stat-val">{currentLevel.toUpperCase()}</strong>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">🪙 Coins:</span>
                        <strong className="stat-val">{coinsCount}</strong>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">⭐ Total Score:</span>
                        <strong className="stat-val">
                            {score}
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

                <div className="modal-actions">
                    {nextLevel ? (
                        <>
                            <button
                                className="primary-button"
                                onClick={onNextLevel}
                                type="button"
                            >
                                Next Level ➡️
                            </button>
                            <button
                                className="secondary-button"
                                onClick={onRestartLevel}
                                type="button"
                            >
                                Replay Level 🔄
                            </button>
                        </>
                    ) : (
                        <button
                            className="primary-button"
                            onClick={onPlayAgainFromStart}
                            type="button"
                        >
                            Play Again from Start 🔄
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
