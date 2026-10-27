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
import { recordGameResultUseCase } from '../../application/SaveGameStatsUseCase';
import { AVAILABLE_SKINS } from '../../domain/entities/Skin';
import { selectSkinUseCase } from '../../application/SelectSkinUseCase';
import { toggleSoundUseCase, toggleMusicUseCase } from '../../application/UpdateSettingsUseCase';
import { resetSaveDataUseCase } from '../../application/ResetSaveDataUseCase';
import { soundManager } from '../audio/SoundManager';
import {
    GAME_PAUSED_EVENT,
    GAME_RESUMED_EVENT,
    pauseGameUseCase,
    resumeGameUseCase,
    togglePauseUseCase,
} from '../../application/TogglePauseUseCase';
import {
    POWERUP_EXPIRED_EVENT,
    PowerUpExpiredPayload,
    SESSION_TICK_EVENT,
    SessionTickPayload,
} from '../../application/TickSessionUseCase';
import { entities, repositories } from '../composition';
import { Hud } from './components/Hud';
import { GameOverModal } from './components/GameOverModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { PauseMenuModal } from './components/PauseMenuModal';
import { SkinModal } from './components/SkinModal';
import { MainMenuModal } from './components/MainMenuModal';
import { SettingsModal } from './components/SettingsModal';
import { StageSelectModal } from './components/StageSelectModal';

function App ()
{
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [levelComplete, setLevelComplete] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [currentLevel, setCurrentLevel] = useState('village');
    const [nextLevel, setNextLevel] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [coinsCount, setCoinsCount] = useState(0);
    const [lives, setLives] = useState(3);
    const [gameStats] = useState(() => entities.gameStats);
    const [skinManager] = useState(() => entities.skinManager);
    const [settings] = useState(() => entities.settings);
    const [pauseState] = useState(() => entities.pauseState);
    const [isMuted, setIsMuted] = useState(entities.settings.isSoundMuted);
    const [isMusicMuted, setIsMusicMuted] = useState(entities.settings.isMusicMuted);
    const [starTimer, setStarTimer] = useState(0);
    const [springTimer, setSpringTimer] = useState(0);
    const [bossHp, setBossHp] = useState<number | null>(null);
    const [bossMaxHp, setBossMaxHp] = useState(5);
    const [activeSkinId, setActiveSkinId] = useState(entities.skinManager.activeSkinId);
    const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
    const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStageSelectOpen, setIsStageSelectOpen] = useState(false);
    const [isGamePaused, setIsGamePaused] = useState(false);
    const [highScore, setHighScore] = useState(gameStats.highScore);
    const [bestTime, setBestTime] = useState<number | null>(gameStats.bestTimeSeconds);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [isNewBestTime, setIsNewBestTime] = useState(false);
    const maxLives = 3;

    const scoreRef = useRef(score);
    scoreRef.current = score;
    const elapsedSecondsRef = useRef(elapsedSeconds);
    elapsedSecondsRef.current = elapsedSeconds;
    const gameStatsRef = useRef(gameStats);
    gameStatsRef.current = gameStats;
    const pauseStateRef = useRef(pauseState);
    pauseStateRef.current = pauseState;
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
                repositories.gameStats,
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
                repositories.gameStats,
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

        const onSessionTick = (payload: SessionTickPayload) =>
        {
            setElapsedSeconds(payload.elapsedSeconds);
            setStarTimer(payload.starTimer);
            setSpringTimer(payload.springTimer);
        };

        const onPowerUpExpired = (payload: PowerUpExpiredPayload) =>
        {
            if (payload.type === 'star') setStarTimer(0);
            if (payload.type === 'spring') setSpringTimer(0);
        };

        const handleKeyDown = (e: KeyboardEvent) =>
        {
            if (e.key === 'm' || e.key === 'M')
            {
                setIsMuted(toggleSoundUseCase(entities.settings, repositories.settings).soundMuted);
            }
            else if (e.key === 'b' || e.key === 'B')
            {
                setIsMusicMuted(toggleMusicUseCase(entities.settings, repositories.settings).musicMuted);
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
        DomainEvents.on<SessionTickPayload>(SESSION_TICK_EVENT, onSessionTick);
        DomainEvents.on<PowerUpExpiredPayload>(POWERUP_EXPIRED_EVENT, onPowerUpExpired);
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
            DomainEvents.off<SessionTickPayload>(SESSION_TICK_EVENT, onSessionTick);
            DomainEvents.off<PowerUpExpiredPayload>(POWERUP_EXPIRED_EVENT, onPowerUpExpired);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleToggleMute = () =>
    {
        const payload = toggleSoundUseCase(settings, repositories.settings);
        setIsMuted(payload.soundMuted);
    };

    const handleToggleMusic = () =>
    {
        const payload = toggleMusicUseCase(settings, repositories.settings);
        setIsMusicMuted(payload.musicMuted);
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

    const handleTogglePause = () =>
    {
        if (isGamePaused)
        {
            handleResumeGame();
        }
        else
        {
            handlePauseGame();
        }
    };

    const handleStartGame = (stageKey = 'village') =>
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
            coins: 0,
            elapsedMs: 0,
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
            resetSaveDataUseCase(
                { gameStats, skinManager, settings },
                repositories
            );
            setHighScore(0);
            setBestTime(null);
            setActiveSkinId('cyber-blue');
            setIsMuted(settings.isSoundMuted);
            setIsMusicMuted(settings.isMusicMuted);
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

        const isFromVillage = currentLevel === 'village';
        const nextElapsedMs = isFromVillage ? 0 : Math.round(elapsedSeconds * 1000);
        if (isFromVillage)
        {
            setElapsedSeconds(0);
        }

        phaserRef.current?.scene?.scene.restart({
            levelKey: target,
            score,
            lives,
            skinId: activeSkinId,
            coins: coinsCount,
            elapsedMs: nextElapsedMs,
        });
    };

    const handleRestart = (resetToStart = false) =>
    {
        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
        const target = resetToStart ? 'village' : currentLevel;

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
            coins: resetToStart ? 0 : coinsCount,
            elapsedMs: resetToStart ? 0 : Math.round(elapsedSeconds * 1000),
        });
    };

    const handleEquipSkin = (skinId: string) =>
    {
        const success = selectSkinUseCase(skinManager, skinId, score, highScore, repositories.skin);
        if (success)
        {
            setActiveSkinId(skinId);
        }
    };

    const activeSkinName =
        AVAILABLE_SKINS.find(s => s.id === activeSkinId)?.name.split(' ')[0] || 'Cyber';

    return (
        <div id="app">
            {!isMainMenuOpen && (
                <Hud
                    bossHp={bossHp}
                    bossMaxHp={bossMaxHp}
                    coinsCount={coinsCount}
                    currentLevel={currentLevel}
                    elapsedSeconds={elapsedSeconds}
                    highScore={highScore}
                    isGamePaused={isGamePaused}
                    lives={lives}
                    maxLives={maxLives}
                    onTogglePause={handleTogglePause}
                    score={score}
                    springTimer={springTimer}
                    starTimer={starTimer}
                />
            )}

            <PhaserGame ref={phaserRef} />

            {gameOver && (
                <GameOverModal
                    coinsCount={coinsCount}
                    currentLevel={currentLevel}
                    elapsedSeconds={elapsedSeconds}
                    highScore={highScore}
                    onRestart={() => handleRestart(true)}
                    score={score}
                />
            )}

            {levelComplete && (
                <LevelCompleteModal
                    bestTime={bestTime}
                    coinsCount={coinsCount}
                    currentLevel={currentLevel}
                    elapsedSeconds={elapsedSeconds}
                    isNewBestTime={isNewBestTime}
                    isNewHighScore={isNewHighScore}
                    nextLevel={nextLevel}
                    onNextLevel={handleNextLevel}
                    onPlayAgainFromStart={() => handleRestart(true)}
                    onRestartLevel={() => handleRestart(false)}
                    score={score}
                />
            )}

            {isGamePaused && !isMainMenuOpen && !levelComplete && !gameOver && (
                <PauseMenuModal
                    activeSkinName={activeSkinName}
                    coinsCount={coinsCount}
                    currentLevel={currentLevel}
                    elapsedSeconds={elapsedSeconds}
                    isMusicMuted={isMusicMuted}
                    isMuted={isMuted}
                    onExitToMainMenu={handleOpenMainMenu}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenSkinModal={() => setIsSkinModalOpen(true)}
                    onRestartLevel={() => handleRestart(false)}
                    onResume={handleResumeGame}
                    onToggleMusic={handleToggleMusic}
                    onToggleMute={handleToggleMute}
                    score={score}
                />
            )}

            {isSkinModalOpen && (
                <SkinModal
                    activeSkinId={activeSkinId}
                    highScore={highScore}
                    onClose={() => setIsSkinModalOpen(false)}
                    onEquipSkin={handleEquipSkin}
                    score={score}
                    skinManager={skinManager}
                />
            )}

            {isMainMenuOpen && (
                <MainMenuModal
                    activeSkinName={activeSkinName}
                    bestTime={bestTime}
                    highScore={highScore}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenSkinModal={() => setIsSkinModalOpen(true)}
                    onOpenStageSelect={() => setIsStageSelectOpen(true)}
                    onStartGame={handleStartGame}
                />
            )}

            {isSettingsOpen && (
                <SettingsModal
                    isMusicMuted={isMusicMuted}
                    isMuted={isMuted}
                    onClearAllData={handleClearAllData}
                    onClose={() => setIsSettingsOpen(false)}
                    onToggleMusic={handleToggleMusic}
                    onToggleMute={handleToggleMute}
                />
            )}

            {isStageSelectOpen && (
                <StageSelectModal
                    currentLevel={currentLevel}
                    onClose={() => setIsStageSelectOpen(false)}
                    onSelectStage={handleStartGame}
                />
            )}
        </div>
    );
}

export default App;
