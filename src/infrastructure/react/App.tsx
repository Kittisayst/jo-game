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
import { GameStats } from '../../domain/entities/GameStats';
import { recordGameResultUseCase } from '../../application/SaveGameStatsUseCase';
import { localStorageGameStatsRepository } from '../storage/LocalStorageGameStatsRepository';
import { SkinManager, AVAILABLE_SKINS } from '../../domain/entities/Skin';
import { selectSkinUseCase } from '../../application/SelectSkinUseCase';
import { Settings } from '../../domain/entities/Settings';
import { soundManager } from '../audio/SoundManager';
import { GamePauseState } from '../../domain/entities/GamePauseState';
import {
    GAME_PAUSED_EVENT,
    GAME_RESUMED_EVENT,
    pauseGameUseCase,
    resumeGameUseCase,
    togglePauseUseCase,
} from '../../application/TogglePauseUseCase';

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
    const [isMusicMuted, setIsMusicMuted] = useState(soundManager.isMusicMuted);
    const [starTimer, setStarTimer] = useState(0);
    const [springTimer, setSpringTimer] = useState(0);
    const [bossHp, setBossHp] = useState<number | null>(null);
    const [bossMaxHp, setBossMaxHp] = useState(5);
    const [gameStats] = useState(() =>
    {
        const data = localStorageGameStatsRepository.load();
        return new GameStats(data.highScore, data.bestTimeSeconds);
    });
    const [skinManager] = useState(() =>
    {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('jo_active_skin') : null;
        return new SkinManager(saved || 'cyber-blue');
    });
    const [activeSkinId, setActiveSkinId] = useState(skinManager.activeSkinId);
    const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
    const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStageSelectOpen, setIsStageSelectOpen] = useState(false);
    const [pauseState] = useState(() => new GamePauseState(false));
    const [isGamePaused, setIsGamePaused] = useState(false);
    const [highScore, setHighScore] = useState(gameStats.highScore);
    const [bestTime, setBestTime] = useState<number | null>(gameStats.bestTimeSeconds);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [isNewBestTime, setIsNewBestTime] = useState(false);
    const maxLives = 3;

    const [settings] = useState(() => new Settings(soundManager.isMuted, soundManager.isMusicMuted));

    const scoreRef = useRef(score);
    scoreRef.current = score;
    const elapsedSecondsRef = useRef(elapsedSeconds);
    elapsedSecondsRef.current = elapsedSeconds;
    const gameStatsRef = useRef(gameStats);
    gameStatsRef.current = gameStats;
    const pauseStateRef = useRef(pauseState);
    pauseStateRef.current = pauseState;
    const isGamePausedRef = useRef(isGamePaused);
    isGamePausedRef.current = isGamePaused;
    const isMainMenuOpenRef = useRef(isMainMenuOpen);
    isMainMenuOpenRef.current = isMainMenuOpen;
    const levelCompleteRef = useRef(levelComplete);
    levelCompleteRef.current = levelComplete;
    const gameOverRef = useRef(gameOver);
    gameOverRef.current = gameOver;
    const isSkinModalOpenRef = useRef(isSkinModalOpen);
    isSkinModalOpenRef.current = isSkinModalOpen;
    const isSettingsOpenRef = useRef(isSettingsOpen);
    isSettingsOpenRef.current = isSettingsOpen;
    const isStageSelectOpenRef = useRef(isStageSelectOpen);
    isStageSelectOpenRef.current = isStageSelectOpen;

    useEffect(() =>
    {
        const onLevelComplete = (payload: LevelCompletePayload) =>
        {
            setLevelComplete(true);
            setNextLevel(payload.nextLevel);

            const result = recordGameResultUseCase(
                gameStatsRef.current,
                localStorageGameStatsRepository,
                scoreRef.current,
                !payload.nextLevel ? elapsedSecondsRef.current : undefined
            );

            setHighScore(result.highScore);
            if (result.bestTimeSeconds !== null)
            {
                setBestTime(result.bestTimeSeconds);
            }
            setIsNewHighScore(result.isNewHighScore);
            setIsNewBestTime(result.isNewBestTime);
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
            const result = recordGameResultUseCase(
                gameStatsRef.current,
                localStorageGameStatsRepository,
                scoreRef.current
            );
            setHighScore(result.highScore);
            setIsNewHighScore(result.isNewHighScore);
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

        const onGamePaused = () =>
        {
            setIsGamePaused(true);
        };

        const onGameResumed = () =>
        {
            setIsGamePaused(false);
        };

        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === 'm' || e.key === 'M')
            {
                setIsMuted(soundManager.toggleMute());
            }
            else if (e.key === 'b' || e.key === 'B')
            {
                setIsMusicMuted(soundManager.toggleMusicMute());
            }
            else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P')
            {
                if (isMainMenuOpenRef.current || levelCompleteRef.current || gameOverRef.current) return;

                if (isSkinModalOpenRef.current)
                {
                    setIsSkinModalOpen(false);
                    return;
                }
                if (isSettingsOpenRef.current)
                {
                    setIsSettingsOpen(false);
                    return;
                }
                if (isStageSelectOpenRef.current)
                {
                    setIsStageSelectOpen(false);
                    return;
                }

                togglePauseUseCase(pauseStateRef.current);
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
        DomainEvents.on(GAME_PAUSED_EVENT, onGamePaused);
        DomainEvents.on(GAME_RESUMED_EVENT, onGameResumed);
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
            DomainEvents.off(GAME_PAUSED_EVENT, onGamePaused);
            DomainEvents.off(GAME_RESUMED_EVENT, onGameResumed);
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

    // Speedrun elapsed timer (pauses when game is paused)
    useEffect(() =>
    {
        if (isMainMenuOpen || levelComplete || gameOver || isGamePaused) return;

        const timer = setInterval(() =>
        {
            setElapsedSeconds(prev => +(prev + 0.1).toFixed(1));
        }, 100);

        return () => clearInterval(timer);
    }, [isMainMenuOpen, levelComplete, gameOver, isGamePaused]);

    const formatTime = (seconds: number | null): string =>
    {
        if (seconds === null || seconds <= 0) return '--:--.-';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const tenths = Math.floor((seconds * 10) % 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${tenths}`;
    };

    const handleToggleMute = () =>
    {
        const muted = soundManager.toggleMute();
        settings.setSoundMuted(muted);
        setIsMuted(muted);
    };

    const handleToggleMusic = () =>
    {
        const musicMuted = soundManager.toggleMusicMute();
        settings.setMusicMuted(musicMuted);
        setIsMusicMuted(musicMuted);
    };

    const handlePauseGame = () =>
    {
        if (isMainMenuOpen || levelComplete || gameOver) return;
        pauseGameUseCase(pauseState);
        setIsGamePaused(true);
    };

    const handleResumeGame = () =>
    {
        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
    };

    const handleStartGame = (stageKey = 'level-1') =>
    {
        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
        setIsMainMenuOpen(false);
        setIsStageSelectOpen(false);
        setIsSettingsOpen(false);
        setLevelComplete(false);
        setGameOver(false);
        setScore(0);
        setCoinsCount(0);
        setLives(maxLives);
        setElapsedSeconds(0);
        setCurrentLevel(stageKey);
        setNextLevel(null);
        setStarTimer(0);
        setSpringTimer(0);
        setBossHp(null);
        setIsNewHighScore(false);
        setIsNewBestTime(false);

        phaserRef.current?.scene?.scene.restart({
            levelKey: stageKey,
            score: 0,
            lives: maxLives,
            skinId: activeSkinId,
        });
    };

    const handleOpenMainMenu = () =>
    {
        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
        setIsMainMenuOpen(true);
        setIsSettingsOpen(false);
        setIsSkinModalOpen(false);
        setIsStageSelectOpen(false);
        soundManager.stopBgm();
    };

    const handleClearAllData = () =>
    {
        if (typeof window !== 'undefined' && window.confirm('Are you sure you want to reset all High Scores and saved data?'))
        {
            localStorage.clear();
            gameStats.reset();
            skinManager.forceEquip('cyber-blue');
            setHighScore(0);
            setBestTime(null);
            setActiveSkinId('cyber-blue');
            setIsNewHighScore(false);
            setIsNewBestTime(false);
            soundManager.playCoin();
        }
    };

    const handleNextLevel = () =>
    {
        if (!nextLevel) return;

        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
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
            skinId: activeSkinId,
        });
    };

    const handleRestart = (resetToStart = false) =>
    {
        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
        const target = resetToStart ? 'level-1' : currentLevel;

        if (resetToStart)
        {
            setScore(0);
            setCoinsCount(0);
            setLives(maxLives);
            setElapsedSeconds(0);
            setIsNewHighScore(false);
            setIsNewBestTime(false);
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
            skinId: activeSkinId,
        });
    };

    const handleEquipSkin = (skinId: string) =>
    {
        const playerBestScore = Math.max(score, highScore);
        const success = selectSkinUseCase(skinManager, skinId, playerBestScore);
        if (success)
        {
            setActiveSkinId(skinId);
            if (typeof window !== 'undefined')
            {
                localStorage.setItem('jo_active_skin', skinId);
            }
        }
    };

    return (
        <div id="app">
            {!isMainMenuOpen && (
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
                    <div className="hud-badge timer-badge">
                        <span className="badge-icon">⏱️</span>
                        <span className="badge-value">{formatTime(elapsedSeconds)}</span>
                    </div>
                    <div className="hud-badge high-score-badge">
                        <span className="badge-icon">🏆</span>
                        <span className="badge-label">Best</span>
                        <span className="badge-value">{highScore}</span>
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
                        id="hud-menu-btn"
                        className={`hud-badge hud-menu-btn ${isGamePaused ? 'paused-active' : ''}`}
                        onClick={(e) =>
                        {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isGamePaused)
                            {
                                handleResumeGame();
                            }
                            else
                            {
                                handlePauseGame();
                            }
                        }}
                        title="In-Game Menu & Pause (Esc / P)"
                        type="button"
                    >
                        <span className="badge-icon">{isGamePaused ? '▶️' : '⏸️'}</span>
                        <span className="badge-label">{isGamePaused ? 'ສືບຕໍ່' : 'ເມນູ (Menu)'}</span>
                    </button>
                </div>
            )}

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

            {/* Dedicated In-Game Pause Menu */}
            {isGamePaused && !isMainMenuOpen && !levelComplete && !gameOver && (
                <div className="pause-menu-overlay" onClick={handleResumeGame}>
                    <div className="pause-menu-card" onClick={e => e.stopPropagation()}>
                        <div className="pause-header">
                            <div>
                                <h2 className="pause-title">⏸️ ຢຸດເກມຊົ່ວຄາວ</h2>
                                <span className="pause-subtitle">PAUSE MENU • ກົດ Esc / P ເພື່ອສືບຕໍ່</span>
                            </div>
                            <button
                                className="skin-close-btn"
                                onClick={handleResumeGame}
                                title="Close & Resume Game (Esc)"
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="pause-stats-banner">
                            <div className="pause-stat-item">
                                <span className="pause-stat-label">🚩 ດ່ານ</span>
                                <span className="pause-stat-val">
                                    {currentLevel === 'level-1' ? 'Level 1' : currentLevel === 'level-2' ? 'Level 2' : 'Level 3 👑'}
                                </span>
                            </div>
                            <div className="pause-stat-item">
                                <span className="pause-stat-label">⭐ ຄະແນນ</span>
                                <span className="pause-stat-val">{score}</span>
                            </div>
                            <div className="pause-stat-item">
                                <span className="pause-stat-label">🪙 ຫຼຽນ</span>
                                <span className="pause-stat-val">{coinsCount}</span>
                            </div>
                            <div className="pause-stat-item">
                                <span className="pause-stat-label">⏱️ ເວລາ</span>
                                <span className="pause-stat-val">{formatTime(elapsedSeconds)}</span>
                            </div>
                        </div>

                        {/* Quick Sound & Music Settings inside Pause Menu */}
                        <div className="pause-audio-box">
                            <div className="pause-audio-row">
                                <div className="pause-audio-info">
                                    <span className="pause-audio-icon">{isMuted ? '🔇' : '🔊'}</span>
                                    <span className="pause-audio-name">ສຽງ Effect (SFX)</span>
                                </div>
                                <button
                                    className={`settings-switch-btn ${isMuted ? 'off' : 'on'}`}
                                    onClick={handleToggleMute}
                                    type="button"
                                >
                                    {isMuted ? 'OFF' : 'ON'}
                                </button>
                            </div>

                            <div className="pause-audio-row">
                                <div className="pause-audio-info">
                                    <span className="pause-audio-icon">{isMusicMuted ? '🔇' : '🎵'}</span>
                                    <span className="pause-audio-name">ເພງ BGM Chiptune</span>
                                </div>
                                <button
                                    className={`settings-switch-btn ${isMusicMuted ? 'off' : 'on'}`}
                                    onClick={handleToggleMusic}
                                    type="button"
                                >
                                    {isMusicMuted ? 'OFF' : 'ON'}
                                </button>
                            </div>
                        </div>

                        {/* Menu Actions */}
                        <div className="pause-buttons-list">
                            <button
                                className="menu-action-btn primary pulse"
                                onClick={handleResumeGame}
                                type="button"
                            >
                                ▶️ ສືບຕໍ່ຫຼິ້ນ (Resume Game)
                            </button>

                            <button
                                className="menu-action-btn secondary"
                                onClick={() => setIsSkinModalOpen(true)}
                                type="button"
                            >
                                🥋 ປ່ຽນຊຸດຕົວລະຄອນ ({AVAILABLE_SKINS.find(s => s.id === activeSkinId)?.name.split(' ')[0]})
                            </button>

                            <button
                                className="menu-action-btn secondary"
                                onClick={() => setIsSettingsOpen(true)}
                                type="button"
                            >
                                ⚙️ ຕັ້ງຄ່າ & ຄູ່ມືບັງຄັບ (Settings & Guide)
                            </button>

                            <button
                                className="menu-action-btn secondary"
                                onClick={() => handleRestart(false)}
                                type="button"
                            >
                                🔄 ເລີ່ມດ່ານນີ້ໃໝ່ (Restart Level)
                            </button>

                            <button
                                className="menu-action-btn danger"
                                onClick={handleOpenMainMenu}
                                type="button"
                            >
                                🏠 ກັບໄປໜ້າຫຼັກ (Exit to Main Menu)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSkinModalOpen && (
                <div className="skin-modal-overlay" onClick={() => setIsSkinModalOpen(false)}>
                    <div className="skin-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="skin-modal-header">
                            <h2>🥋 Character Skins & Costumes</h2>
                            <button
                                className="skin-close-btn"
                                onClick={() => setIsSkinModalOpen(false)}
                                type="button"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="skin-grid">
                            {AVAILABLE_SKINS.map(skin => {
                                const playerBestScore = Math.max(score, highScore);
                                const isUnlocked = skinManager.isSkinUnlocked(skin.id, playerBestScore);
                                const isEquipped = activeSkinId === skin.id;

                                return (
                                    <div
                                        key={skin.id}
                                        className={`skin-card ${isEquipped ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
                                    >
                                        <div className="skin-card-header">
                                            <div
                                                className="skin-swatch"
                                                style={{ background: skin.colorHex }}
                                            />
                                            <div className="skin-title-wrap">
                                                <span className="skin-name">{skin.name}</span>
                                                <span className="skin-desc">{skin.description}</span>
                                            </div>
                                        </div>
                                        <div className="skin-footer">
                                            <span className={`skin-unlock-info ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                                {isUnlocked ? '✅ Unlocked' : `🔒 Needs ${skin.unlockScore} pts`}
                                            </span>
                                            {isEquipped ? (
                                                <button className="skin-btn equipped" disabled type="button">
                                                    Equipped
                                                </button>
                                            ) : isUnlocked ? (
                                                <button
                                                    className="skin-btn equip"
                                                    onClick={() => handleEquipSkin(skin.id)}
                                                    type="button"
                                                >
                                                    Equip
                                                </button>
                                            ) : (
                                                <button className="skin-btn locked" disabled type="button">
                                                    Locked
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Menu Screen */}
            {isMainMenuOpen && (
                <div className="main-menu-overlay">
                    <div className="main-menu-card">
                        <h1 className="main-menu-title">⚡ JO RUNNER ⚡</h1>
                        <p className="main-menu-subtitle">Cyberpunk Slime Invasion</p>

                        <div className="menu-stats-bar">
                            <div className="menu-stat">
                                <span className="menu-stat-label">🏆 High Score</span>
                                <span className="menu-stat-val">{highScore}</span>
                            </div>
                            <div className="menu-stat">
                                <span className="menu-stat-label">⏱️ Best Time</span>
                                <span className="menu-stat-val">{formatTime(bestTime)}</span>
                            </div>
                            <div className="menu-stat">
                                <span className="menu-stat-label">🥋 Skin</span>
                                <span className="menu-stat-val">
                                    {AVAILABLE_SKINS.find(s => s.id === activeSkinId)?.name.split(' ')[0] || 'Cyber'}
                                </span>
                            </div>
                        </div>

                        <div className="menu-buttons-list">
                            <button
                                className="menu-action-btn primary"
                                onClick={() => handleStartGame('level-1')}
                                type="button"
                            >
                                ▶️ ເຂົ້າເກມ (Play Game)
                            </button>
                            <button
                                className="menu-action-btn secondary"
                                onClick={() => setIsStageSelectOpen(true)}
                                type="button"
                            >
                                🚩 ເລືອກດ່ານ (Select Stage)
                            </button>
                            <button
                                className="menu-action-btn secondary"
                                onClick={() => setIsSkinModalOpen(true)}
                                type="button"
                            >
                                🥋 ເລືອກຊຸດ (Skins & Costumes)
                            </button>
                            <button
                                className="menu-action-btn secondary"
                                onClick={() => setIsSettingsOpen(true)}
                                type="button"
                            >
                                ⚙️ ຕັ້ງຄ່າ (Settings)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="skin-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
                    <div className="settings-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="skin-modal-header">
                            <h2>⚙️ ຕັ້ງຄ່າ (Game Settings)</h2>
                            <button
                                className="skin-close-btn"
                                onClick={() => setIsSettingsOpen(false)}
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="settings-section">
                            <div className="settings-section-title">🔊 Audio Preferences</div>
                            <div className="settings-toggle-row">
                                <span className="settings-row-label">
                                    {isMuted ? '🔇' : '🔊'} Master Sound (SFX)
                                </span>
                                <button
                                    className={`settings-switch-btn ${isMuted ? 'off' : 'on'}`}
                                    onClick={handleToggleMute}
                                    type="button"
                                >
                                    {isMuted ? 'OFF' : 'ON'}
                                </button>
                            </div>
                            <div className="settings-toggle-row">
                                <span className="settings-row-label">
                                    {isMusicMuted ? '🔇' : '🎵'} 8-Bit Chiptune Music (BGM)
                                </span>
                                <button
                                    className={`settings-switch-btn ${isMusicMuted ? 'off' : 'on'}`}
                                    onClick={handleToggleMusic}
                                    type="button"
                                >
                                    {isMusicMuted ? 'OFF' : 'ON'}
                                </button>
                            </div>
                        </div>

                        <div className="settings-section">
                            <div className="settings-section-title">🎮 Controls Guide</div>
                            <div className="controls-guide-grid">
                                <div className="control-item">
                                    <span className="control-key">⬅️ ➡️ / A D</span>
                                    <span>Move Left/Right</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">⬆️ / W / Space</span>
                                    <span>Jump / Double Jump</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">M</span>
                                    <span>Mute Audio</span>
                                </div>
                                <div className="control-item">
                                    <span className="control-key">B</span>
                                    <span>Toggle BGM</span>
                                </div>
                            </div>
                        </div>

                        <div className="settings-section">
                            <div className="settings-section-title">⚠️ Data Management</div>
                            <button
                                className="menu-action-btn secondary"
                                onClick={handleClearAllData}
                                style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                                type="button"
                            >
                                🗑️ ລ້າງຄະແນນ & ຂໍ້ມູນທັງໝົດ (Reset Saved Data)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stage Select Modal */}
            {isStageSelectOpen && (
                <div className="skin-modal-overlay" onClick={() => setIsStageSelectOpen(false)}>
                    <div className="settings-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="skin-modal-header">
                            <h2>🚩 ເລືອກດ່ານ (Select Stage)</h2>
                            <button
                                className="skin-close-btn"
                                onClick={() => setIsStageSelectOpen(false)}
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="stage-select-grid">
                            <div
                                className={`stage-select-card ${currentLevel === 'level-1' ? 'active-stage' : ''}`}
                                onClick={() => handleStartGame('level-1')}
                            >
                                <div>
                                    <strong>ດ່ານ 1: Green Plains</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        ທົ່ງຫຍ້າຂຽວ, ເກັບຫຼຽນ, ຢຽບ Slime
                                    </div>
                                </div>
                                <span>▶️ ຫຼິ້ນ</span>
                            </div>

                            <div
                                className={`stage-select-card ${currentLevel === 'level-2' ? 'active-stage' : ''}`}
                                onClick={() => handleStartGame('level-2')}
                            >
                                <div>
                                    <strong>ດ່ານ 2: Sky Islands</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        ພື້ນເລື່ອນ Hover, ດົງໜາມ Spikes, Power-ups
                                    </div>
                                </div>
                                <span>▶️ ຫຼິ້ນ</span>
                            </div>

                            <div
                                className={`stage-select-card ${currentLevel === 'level-3' ? 'active-stage' : ''}`}
                                onClick={() => handleStartGame('level-3')}
                            >
                                <div>
                                    <strong>ດ່ານ 3: King Slime Boss Arena 👑</strong>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                                        ສູ້ Boss ຍັກ King Slime, ແຖບເລືອດ Boss HP
                                    </div>
                                </div>
                                <span>▶️ ຫຼິ້ນ</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
