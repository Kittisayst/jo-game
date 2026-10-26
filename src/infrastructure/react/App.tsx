import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { DomainEvents } from '../../domain/DomainEvents';
import {
    LEVEL_COMPLETE_EVENT,
    LevelCompletePayload,
} from '../../application/CompleteLevelUseCase';
import {
    COIN_COLLECTED_EVENT,
    CoinCollectedPayload,
} from '../../application/CollectCoinUseCase';
import {
    ENEMY_DEFEATED_EVENT,
    EnemyDefeatedPayload,
} from '../../application/DefeatEnemyUseCase';
import {
    PLAYER_DAMAGED_EVENT,
    GAME_OVER_EVENT,
    PlayerDamagedPayload,
} from '../../application/PlayerTakeDamageUseCase';
import { soundManager } from '../audio/SoundManager';

function App()
{
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [levelComplete, setLevelComplete] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [currentLevel, setCurrentLevel] = useState('level-1');
    const [nextLevel, setNextLevel] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [coinsCount, setCoinsCount] = useState(0);
    const [lives, setLives] = useState(3);
    const [isMuted, setIsMuted] = useState(soundManager.isMuted);
    const maxLives = 3;

    useEffect(() =>
    {
        const onLevelComplete = (payload: LevelCompletePayload) =>
        {
            setLevelComplete(true);
            setNextLevel(payload.nextLevel);
        };

        const onCoinCollected = (payload: CoinCollectedPayload) =>
        {
            setScore(payload.score);
            setCoinsCount(prev => prev + 1);
        };

        const onEnemyDefeated = (payload: EnemyDefeatedPayload) =>
        {
            setScore(payload.totalScore);
        };

        const onPlayerDamaged = (payload: PlayerDamagedPayload) =>
        {
            setLives(payload.currentLives);
        };

        const onGameOver = () =>
        {
            setGameOver(true);
        };

        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === 'm' || e.key === 'M')
            {
                setIsMuted(soundManager.toggleMute());
            }
        };

        DomainEvents.on<LevelCompletePayload>(LEVEL_COMPLETE_EVENT, onLevelComplete);
        DomainEvents.on<CoinCollectedPayload>(COIN_COLLECTED_EVENT, onCoinCollected);
        DomainEvents.on<EnemyDefeatedPayload>(ENEMY_DEFEATED_EVENT, onEnemyDefeated);
        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, onPlayerDamaged);
        DomainEvents.on(GAME_OVER_EVENT, onGameOver);
        window.addEventListener('keydown', handleKeyDown);

        return () =>
        {
            DomainEvents.off<LevelCompletePayload>(LEVEL_COMPLETE_EVENT, onLevelComplete);
            DomainEvents.off<CoinCollectedPayload>(COIN_COLLECTED_EVENT, onCoinCollected);
            DomainEvents.off<EnemyDefeatedPayload>(ENEMY_DEFEATED_EVENT, onEnemyDefeated);
            DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, onPlayerDamaged);
            DomainEvents.off(GAME_OVER_EVENT, onGameOver);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleToggleMute = () =>
    {
        setIsMuted(soundManager.toggleMute());
    };

    const handleNextLevel = () =>
    {
        if (!nextLevel) return;

        const target = nextLevel;
        setCurrentLevel(target);
        setLevelComplete(false);
        setNextLevel(null);

        phaserRef.current?.scene?.scene.restart({
            levelKey: target,
            score,
            lives,
        });
    };

    const handleRestart = (resetToStart = false) =>
    {
        const target = resetToStart ? 'level-1' : currentLevel;

        if (resetToStart)
        {
            setScore(0);
            setCoinsCount(0);
            setLives(maxLives);
        }

        setCurrentLevel(target);
        setLevelComplete(false);
        setGameOver(false);
        setNextLevel(null);

        phaserRef.current?.scene?.scene.restart({
            levelKey: target,
            score: resetToStart ? 0 : score,
            lives: resetToStart ? maxLives : lives,
        });
    };

    return (
        <div id="app">
            <div className="game-hud">
                <div className="hud-badge level-badge">
                    <span className="badge-icon">🚩</span>
                    <span className="badge-label">
                        {currentLevel === 'level-1' ? 'Level 1' : 'Level 2'}
                    </span>
                </div>
                <div className="hud-badge lives-badge">
                    <span className="badge-icon">
                        {'❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, maxLives - lives))}
                    </span>
                </div>
                <div className="hud-badge coin-badge">
                    <span className="badge-icon">🪙</span>
                    <span className="badge-label">Coins</span>
                    <span className="badge-value">{coinsCount}</span>
                </div>
                <div className="hud-badge score-badge">
                    <span className="badge-icon">⭐</span>
                    <span className="badge-label">Score</span>
                    <span className="badge-value">{score}</span>
                </div>
                <button
                    className={`hud-badge sound-toggle-btn ${isMuted ? 'muted' : ''}`}
                    onClick={handleToggleMute}
                    title="Toggle Sound (M)"
                    type="button"
                >
                    <span className="badge-icon">{isMuted ? '🔇' : '🔊'}</span>
                    <span className="badge-label">{isMuted ? 'Muted' : 'Sound'}</span>
                </button>
            </div>

            <PhaserGame ref={phaserRef} />

            {gameOver && (
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
                        </div>

                        <div className="modal-actions">
                            <button className="primary-button danger" onClick={() => handleRestart(true)}>
                                🔄 Try Again
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {levelComplete && (
                <div className="level-complete-overlay">
                    <div className="level-complete-card">
                        <h2>{nextLevel ? '🎉 Level Complete!' : '🏆 Game Completed!'}</h2>
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
                                <strong className="stat-val">{score}</strong>
                            </div>
                        </div>

                        <div className="modal-actions">
                            {nextLevel ? (
                                <>
                                    <button className="primary-button" onClick={handleNextLevel}>
                                        Next Level ➡️
                                    </button>
                                    <button className="secondary-button" onClick={() => handleRestart(false)}>
                                        Replay Level 🔄
                                    </button>
                                </>
                            ) : (
                                <button className="primary-button" onClick={() => handleRestart(true)}>
                                    Play Again from Start 🔄
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
