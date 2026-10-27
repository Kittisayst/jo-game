import { formatTime } from '../utils/formatTime';

export interface GameOverModalProps
{
    currentLevel: string;
    coinsCount: number;
    score: number;
    elapsedSeconds: number;
    highScore: number;
    onRestart: () => void;
}

export function GameOverModal ({
    currentLevel,
    coinsCount,
    score,
    elapsedSeconds,
    highScore,
    onRestart,
}: GameOverModalProps)
{
    return (
        <div className="game-over-overlay">
            <div className="game-over-card">
                <h2>💀 Game Over</h2>
                <p className="overlay-subtitle">You ran out of lives!</p>
                <div className="complete-stats">
                    <div className="stat-item">
                        <span className="stat-label">🚩 Reached:</span>
                        <strong className="stat-val">{currentLevel.toUpperCase()}</strong>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">🪙 Coins:</span>
                        <strong className="stat-val">{coinsCount}</strong>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">⭐ Final Score:</span>
                        <strong className="stat-val">{score}</strong>
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

                <div className="modal-actions">
                    <button
                        className="primary-button danger"
                        onClick={onRestart}
                        type="button"
                    >
                        🔄 Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}
