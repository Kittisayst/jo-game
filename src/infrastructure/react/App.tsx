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
import {
    POWERUP_COLLECTED_EVENT,
    PowerUpCollectedPayload,
} from '../../application/CollectPowerUpUseCase';
import {
    BOSS_DAMAGED_EVENT,
    BOSS_DEFEATED_EVENT,
    BossDamagedPayload,
    BossDefeatedPayload,
} from '../../application/DamageBossUseCase';
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
    const [starTimer, setStarTimer] = useState(0);
    const [springTimer, setSpringTimer] = useState(0);
    const [bossHp, setBossHp] = useState<number | null>(null);
    const [bossMaxHp, setBossMaxHp] = useState(5);
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

        const onPowerUpCollected = (payload: PowerUpCollectedPayload) =>
        {
            if (payload.type === 'heart' && typeof payload.currentLives === 'number')
            {
                setLives(payload.currentLives);
            }
            else if (payload.type === 'star')
            {
                setStarTimer(Math.floor((payload.durationMs || 8000) / 1000));
            }
            else if (payload.type === 'spring')
            {
                setSpringTimer(Math.floor((payload.durationMs || 10000) / 1000));
            }
        };

        const onBossDamaged = (payload: BossDamagedPayload) =>
        {
            setBossHp(payload.currentHp);
            setBossMaxHp(payload.maxHp);
        };

        const onBossDefeated = (payload: BossDefeatedPayload) =>
        {
            setBossHp(0);
            setScore(payload.totalScore);
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
        DomainEvents.on<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, onPowerUpCollected);
        DomainEvents.on<BossDamagedPayload>(BOSS_DAMAGED_EVENT, onBossDamaged);
        DomainEvents.on<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, onBossDefeated);
        window.addEventListener('keydown', handleKeyDown);

        return () =>
        {
            DomainEvents.off<LevelCompletePayload>(LEVEL_COMPLETE_EVENT, onLevelComplete);
            DomainEvents.off<CoinCollectedPayload>(COIN_COLLECTED_EVENT, onCoinCollected);
            DomainEvents.off<EnemyDefeatedPayload>(ENEMY_DEFEATED_EVENT, onEnemyDefeated);
            DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, onPlayerDamaged);
            DomainEvents.off(GAME_OVER_EVENT, onGameOver);
            DomainEvents.off<PowerUpCollectedPayload>(POWERUP_COLLECTED_EVENT, onPowerUpCollected);
            DomainEvents.off<BossDamagedPayload>(BOSS_DAMAGED_EVENT, onBossDamaged);
            DomainEvents.off<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, onBossDefeated);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Countdown interval for power-up timers
    useEffect(() =>
    {
        if (starTimer <= 0 && springTimer <= 0) return;

        const interval = setInterval(() =>
        {
            setStarTimer(prev => Math.max(0, prev - 1));
            setSpringTimer(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [starTimer, springTimer]);

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
        setStarTimer(0);
        setSpringTimer(0);
        setBossHp(null);

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
        setStarTimer(0);
        setSpringTimer(0);
        setBossHp(null);

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
                        {currentLevel === 'level-1' ? 'Level 1' : currentLevel === 'level-2' ? 'Level 2' : 'Level 3 (👑 Boss)'}
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

                {starTimer > 0 && (
                    <div className="hud-badge star-power-badge">
                        <span className="badge-icon">⭐</span>
                        <span className="badge-label">Star</span>
                        <span className="badge-value">{starTimer}s</span>
                    </div>
                )}

                {springTimer > 0 && (
                    <div className="hud-badge spring-power-badge">
                        <span className="badge-icon">⚡</span>
                        <span className="badge-label">Jump+</span>
                        <span className="badge-value">{springTimer}s</span>
                    </div>
                )}

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

            {(currentLevel === 'level-3' || bossHp !== null) && (
                <div className="boss-hud-container">
                    <div className="boss-hud-header">
                        <span className="boss-title">👑 KING SLIME</span>
                        <span className="boss-hp-number">{(bossHp ?? 5)} / {bossMaxHp} HP</span>
                    </div>
                    <div className="boss-hp-bar">
                        <div
                            className="boss-hp-fill"
                            style={{ width: `${Math.max(0, ((bossHp ?? 5) / bossMaxHp) * 100)}%` }}
                        />
                    </div>
                </div>
            )}

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
                        <h2>{nextLevel ? '🎉 Level Complete!' : (currentLevel === 'level-3' ? '👑 VICTORY! KING SLIME DEFEATED!' : '🏆 Game Completed!')}</h2>
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
