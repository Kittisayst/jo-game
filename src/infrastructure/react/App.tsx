import { useEffect, useMemo, useRef, useState } from 'react';
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
import { toggleSoundUseCase, toggleMusicUseCase, applySettingsUseCase } from '../../application/UpdateSettingsUseCase';
import { resetSaveDataUseCase } from '../../application/ResetSaveDataUseCase';
import { soundManager } from '../audio/SoundManager';
import { CURRENT_SAVE_VERSION, SaveGameSnapshot } from '../../domain/entities/SaveData';
import { saveManager, SaveSlotId } from '../storage/SaveManager';
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
import { EventBus } from '../EventBus';
import { entities, repositories } from '../composition';
import { Hud } from './components/Hud';
import { GameOverModal } from './components/GameOverModal';
import { LevelCompleteModal } from './components/LevelCompleteModal';
import { PauseMenuModal } from './components/PauseMenuModal';
import { SkinModal } from './components/SkinModal';
import { MainMenuModal } from './components/MainMenuModal';
import { SettingsModal } from './components/SettingsModal';
import { StageMapModal } from './components/StageMapModal';
import { ShopModal } from './components/ShopModal';
import { AchievementModal } from './components/AchievementModal';
import { AchievementToast } from './components/AchievementToast';
import { ACHIEVEMENT_UNLOCKED_EVENT } from '../../domain/entities/Achievement';
import { DialogueChoice, DialogueNode } from '../../domain/entities/Dialogue';
import { DialogueModal } from './components/DialogueModal';
import { VirtualTouchControls } from './components/VirtualTouchControls';
import { VILLAGE_ELDER_DIALOGUE } from '../dialogue/villageElderDialogue';
import { MERCHANT_DIALOGUE } from '../dialogue/merchantDialogue';
import type { Game } from '../phaser/scenes/Game';
import {
    advanceDialogueUseCase,
    closeDialogueUseCase,
    selectDialogueChoiceUseCase,
    startDialogueUseCase,
} from '../../application/AdvanceDialogueUseCase';
import { completeStageUseCase } from '../../application/CompleteStageUseCase';
import { selectStageUseCase } from '../../application/SelectStageUseCase';
import { useItemUseCase as executeUseItemUseCase } from '../../application/UseItemUseCase';
import { WEAPON_CONFIGS } from '../../domain/entities/EquipmentState';
import { cycleEquippedWeaponUseCase } from '../../application/CycleEquippedWeaponUseCase';
import { TextbookModal, TextbookModalMode } from './components/TextbookModal';
import { AcademyModal } from './components/AcademyModal';
import { WorkshopModal } from './components/WorkshopModal';
import { ForgeModal } from './components/ForgeModal';
import { BackpackModal } from './components/BackpackModal';
import { GateRepairModal } from './components/GateRepairModal';
import { WaypointModal } from './components/WaypointModal';
import { QuizFinisherModal } from './components/QuizFinisherModal';
import { returnToVillageUseCase } from '../../application/ReturnToVillageUseCase';
import { BookProgress } from '../../domain/entities/Book';
import { EquipmentState } from '../../domain/entities/EquipmentState';
import { SpacedRepetitionSystem } from '../../domain/entities/Quiz';
import {
    ACTIVE_SESSION_STORAGE_KEY,
    readString,
    writeString,
    removeKey,
} from '../storage/safeStorage';

function App ()
{
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const initialSession = readString(ACTIVE_SESSION_STORAGE_KEY);
    const shouldResumeInGame = initialSession !== null && initialSession !== 'title';

    const [levelComplete, setLevelComplete] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [currentLevel, setCurrentLevel] = useState(() => (shouldResumeInGame ? initialSession : 'village'));
    const [nextLevel, setNextLevel] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [coinsCount, setCoinsCount] = useState(0);
    const [lives, setLives] = useState(3);
    const [walletBalance, setWalletBalance] = useState(() => entities.wallet.balance);
    const [equippedWeaponId, setEquippedWeaponId] = useState(() => entities.equipment.equippedWeaponId);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
    const [unclaimedAchievementsCount, setUnclaimedAchievementsCount] = useState(() => entities.achievementManager.unclaimedCount);
    const [inventoryRevision, setInventoryRevision] = useState(0);
    const [gameStats] = useState(() => entities.gameStats);
    const [skinManager] = useState(() => entities.skinManager);
    const [settings] = useState(() => entities.settings);
    const [stageProgression] = useState(() => entities.stageProgression);
    const [pauseState] = useState(() => entities.pauseState);
    const [isMuted, setIsMuted] = useState(entities.settings.isSoundMuted);
    const [isMusicMuted, setIsMusicMuted] = useState(entities.settings.isMusicMuted);
    const [starTimer, setStarTimer] = useState(0);
    const [springTimer, setSpringTimer] = useState(0);
    const [bossHp, setBossHp] = useState<number | null>(null);
    const [bossMaxHp, setBossMaxHp] = useState(5);
    const [activeSkinId, setActiveSkinId] = useState(entities.skinManager.activeSkinId);
    const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
    const [isMainMenuOpen, setIsMainMenuOpen] = useState(!shouldResumeInGame);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStageSelectOpen, setIsStageSelectOpen] = useState(false);
    const [isStageMapOpen, setIsStageMapOpen] = useState(false);
    const [isGamePaused, setIsGamePaused] = useState(false);
    const [highScore, setHighScore] = useState(gameStats.highScore);
    const [bestTime, setBestTime] = useState<number | null>(gameStats.bestTimeSeconds);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [isNewBestTime, setIsNewBestTime] = useState(false);
    const [villageWelcomeToast, setVillageWelcomeToast] = useState<string | null>(() =>
        shouldResumeInGame && initialSession === 'village'
            ? '🏡 ຍິນດີຕ້ອນຮັບສູ່ ໝູ່ບ້ານ Cyber Village! (ລົມກັບຫົວໜ້າໝູ່ບ້ານ ແລະ NPC Mina)'
            : null
    );
    const maxLives = 3;

    useEffect(() =>
    {
        if (villageWelcomeToast)
        {
            const timer = setTimeout(() => setVillageWelcomeToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [villageWelcomeToast]);

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
    const coinsCountRef = useRef(coinsCount);
    coinsCountRef.current = coinsCount;
    const [isDialogueOpen, setIsDialogueOpen] = useState(false);
    const [currentDialogueNode, setCurrentDialogueNode] = useState<DialogueNode | null>(null);
    const [dialogueChoices, setDialogueChoices] = useState<DialogueChoice[]>([]);
    const isDialogueOpenRef = useRef(isDialogueOpen);
    isDialogueOpenRef.current = isDialogueOpen;
    const isShopOpenRef = useRef(isShopOpen);
    isShopOpenRef.current = isShopOpen;
    const isSkinModalOpenRef = useRef(isSkinModalOpen);
    isSkinModalOpenRef.current = isSkinModalOpen;
    const isSettingsOpenRef = useRef(isSettingsOpen);
    isSettingsOpenRef.current = isSettingsOpen;
    const isStageSelectOpenRef = useRef(isStageSelectOpen);
    isStageSelectOpenRef.current = isStageSelectOpen;
    const isStageMapOpenRef = useRef(isStageMapOpen);
    isStageMapOpenRef.current = isStageMapOpen;
    const stageProgressionRef = useRef(stageProgression);
    stageProgressionRef.current = stageProgression;
    const skinManagerRef = useRef(skinManager);
    skinManagerRef.current = skinManager;
    const settingsRef = useRef(settings);
    settingsRef.current = settings;

    // Knowledge Quest v5 States
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [textbookModalMode, setTextbookModalMode] = useState<TextbookModalMode>('reader');
    const [activeReaderBookId, setActiveReaderBookId] = useState<string | undefined>(undefined);
    const [activeReaderPageNumber, setActiveReaderPageNumber] = useState<number | undefined>(undefined);
    const [booksRevision, setBooksRevision] = useState(0);
    const [isAcademyOpen, setIsAcademyOpen] = useState(false);
    const [isWorkshopOpen, setIsWorkshopOpen] = useState(false);
    const [isForgeOpen, setIsForgeOpen] = useState(false);
    const [isBackpackOpen, setIsBackpackOpen] = useState(false);
    const [isGateRepairOpen, setIsGateRepairOpen] = useState(false);
    const [activeGateId, setActiveGateId] = useState('gate-ch1');
    const [isWaypointOpen, setIsWaypointOpen] = useState(false);
    const [waypointName, setWaypointName] = useState('ຈຸດວາບປອດໄພ');
    const [isQuizFinisherOpen, setIsQuizFinisherOpen] = useState(false);
    const [activeExamBookId, setActiveExamBookId] = useState('book-ch1');
    const [backpackRevision, setBackpackRevision] = useState(0);

    const isLibraryOpenRef = useRef(isLibraryOpen);
    isLibraryOpenRef.current = isLibraryOpen;
    const isAcademyOpenRef = useRef(isAcademyOpen);
    isAcademyOpenRef.current = isAcademyOpen;
    const isWorkshopOpenRef = useRef(isWorkshopOpen);
    isWorkshopOpenRef.current = isWorkshopOpen;
    const isForgeOpenRef = useRef(isForgeOpen);
    isForgeOpenRef.current = isForgeOpen;
    const isBackpackOpenRef = useRef(isBackpackOpen);
    isBackpackOpenRef.current = isBackpackOpen;
    const isGateRepairOpenRef = useRef(isGateRepairOpen);
    isGateRepairOpenRef.current = isGateRepairOpen;
    const isWaypointOpenRef = useRef(isWaypointOpen);
    isWaypointOpenRef.current = isWaypointOpen;
    const isQuizFinisherOpenRef = useRef(isQuizFinisherOpen);
    isQuizFinisherOpenRef.current = isQuizFinisherOpen;
    const currentLevelRef = useRef(currentLevel);
    currentLevelRef.current = currentLevel;

    useEffect(() =>
    {
        // Ensure legacy local storage keys are migrated into active save slot on startup
        saveManager.load();
    }, []);

    useEffect(() =>
    {
        const handleUnlock = () =>
        {
            setUnclaimedAchievementsCount(entities.achievementManager.unclaimedCount);
        };
        DomainEvents.on(ACHIEVEMENT_UNLOCKED_EVENT, handleUnlock);
        return () =>
        {
            DomainEvents.off(ACHIEVEMENT_UNLOCKED_EVENT, handleUnlock);
        };
    }, []);

    useEffect(() =>
    {
        const onLevelComplete = (payload: LevelCompletePayload) =>
        {
            if (payload.levelId === 'stage-ch1')
            {
                // Beating the Chapter 1 Boss sends the player home to learn and craft, not to a score screen
                completeStageUseCase(
                    stageProgressionRef.current,
                    repositories.stageProgression,
                    payload.levelId,
                    payload.nextLevel
                );
                saveManager.autoSave(getCurrentSnapshot());
                EventBus.emit('change-level', 'village');
                setTimeout(() => setVillageWelcomeToast('🏆 ຊະນະ Boss ບົດທີ 1! ກັບມາໝູ່ບ້ານເພື່ອຮຽນ ແລະ ສ້າງອາວຸດຕໍ່ໄປ'), 300);
                return;
            }

            levelCompleteRef.current = true;
            setLevelComplete(true);
            setNextLevel(payload.nextLevel);

            completeStageUseCase(
                stageProgressionRef.current,
                repositories.stageProgression,
                payload.levelId,
                payload.nextLevel
            );

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

            // Earn all stage coins permanently in wallet
            entities.wallet.earn(coinsCountRef.current);
            setWalletBalance(entities.wallet.balance);

            saveManager.autoSave(getCurrentSnapshot());
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
            gameOverRef.current = true;
            setGameOver(true);
            const result = recordGameResultUseCase(
                gameStatsRef.current,
                repositories.gameStats,
                scoreRef.current
            );
            setHighScore(result.highScore);
            setIsNewHighScore(result.isNewHighScore);

            // 50% material retreat penalty when falling in non-village stages
            if (currentLevelRef.current !== 'village')
            {
                returnToVillageUseCase('death', entities.backpack);
                setBackpackRevision(r => r + 1);
            }

            // Retain 50% of coins earned this run
            const earnedCoins = Math.floor(coinsCountRef.current / 2);
            if (earnedCoins > 0)
            {
                entities.wallet.earn(earnedCoins);
                setWalletBalance(entities.wallet.balance);
            }

            saveManager.autoSave(getCurrentSnapshot());
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
            if (levelCompleteRef.current || gameOverRef.current) return;
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

                if (isShopOpenRef.current)
                {
                    setIsShopOpen(false);
                    return;
                }

                if (isDialogueOpenRef.current)
                {
                    handleCloseDialogue();
                    return;
                }

                if (isLibraryOpenRef.current)
                {
                    setIsLibraryOpen(false);
                    return;
                }
                if (isAcademyOpenRef.current)
                {
                    setIsAcademyOpen(false);
                    return;
                }
                if (isWorkshopOpenRef.current)
                {
                    setIsWorkshopOpen(false);
                    return;
                }
                if (isForgeOpenRef.current)
                {
                    setIsForgeOpen(false);
                    return;
                }
                if (isBackpackOpenRef.current)
                {
                    setIsBackpackOpen(false);
                    return;
                }
                if (isGateRepairOpenRef.current)
                {
                    setIsGateRepairOpen(false);
                    return;
                }
                if (isWaypointOpenRef.current)
                {
                    setIsWaypointOpen(false);
                    return;
                }
                if (isQuizFinisherOpenRef.current)
                {
                    setIsQuizFinisherOpen(false);
                    return;
                }

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
                if (isStageMapOpenRef.current)
                {
                    setIsStageMapOpen(false);
                    return;
                }

                togglePauseUseCase(pauseStateRef.current);
            }
            else if (e.key === 'i' || e.key === 'I')
            {
                if (!isMainMenuOpenRef.current && !levelCompleteRef.current && !gameOverRef.current)
                {
                    setIsBackpackOpen(prev => !prev);
                }
            }
            else if (e.key === '1')
            {
                handleUseItem('heal-potion');
            }
            else if (e.key === '2')
            {
                handleUseItem('bubble-shield');
            }
            else if (e.key === '3')
            {
                handleUseItem('slime-bomb');
            }
            else if (e.key === 'q' || e.key === 'Q')
            {
                if (!isMainMenuOpenRef.current && !levelCompleteRef.current && !gameOverRef.current)
                {
                    handleCycleWeapon();
                }
            }
        };

        const onStartDialogue = (graphId: string) =>
        {
            if (graphId === 'village_elder')
            {
                startDialogueUseCase(entities.dialogueState, VILLAGE_ELDER_DIALOGUE);
                setCurrentDialogueNode(entities.dialogueState.getCurrentNode());
                setDialogueChoices(entities.dialogueState.getAvailableChoices());
                setIsDialogueOpen(true);
                EventBus.emit('dialogue-open-state', true);
            }
            else if (graphId === 'cyber_merchant')
            {
                startDialogueUseCase(entities.dialogueState, MERCHANT_DIALOGUE);
                setCurrentDialogueNode(entities.dialogueState.getCurrentNode());
                setDialogueChoices(entities.dialogueState.getAvailableChoices());
                setIsDialogueOpen(true);
                EventBus.emit('dialogue-open-state', true);
            }
        };

        const onOpenStageMap = () =>
        {
            setIsStageMapOpen(true);
        };

        const onWeaponChanged = (weaponId: string) =>
        {
            setEquippedWeaponId(weaponId);
        };

        // Knowledge Quest Event Handlers (Village Library building opens Bookstore mode)
        const onOpenLibrary = (bookId?: string) =>
        {
            setActiveReaderBookId(bookId);
            setActiveReaderPageNumber(undefined);
            setTextbookModalMode('library-store');
            setIsLibraryOpen(true);
        };
        const onOpenAcademy = (bookId?: string) =>
        {
            if (bookId) setActiveExamBookId(bookId);
            setIsAcademyOpen(true);
        };
        const onOpenWorkshop = () => setIsWorkshopOpen(true);
        const onOpenForge = () => setIsForgeOpen(true);
        const onOpenBackpack = () => setIsBackpackOpen(true);
        const onOpenGateRepair = (gateId?: string) =>
        {
            if (gateId) setActiveGateId(gateId);
            setIsGateRepairOpen(true);
        };
        const onOpenWaypoint = (name?: string) =>
        {
            if (name) setWaypointName(name);
            setIsWaypointOpen(true);
        };
        const onOpenQuizFinisher = () => setIsQuizFinisherOpen(true);
        const onChangeLevel = (levelKey: string) => handleStartGame(levelKey);
        const onBookExamPassed = () =>
        {
            setWalletBalance(entities.wallet.balance);
            setBackpackRevision(r => r + 1);
            saveManager.autoSave(getCurrentSnapshot());
        };
        const onDailyPracticeCompleted = () =>
        {
            setWalletBalance(entities.wallet.balance);
            saveManager.autoSave(getCurrentSnapshot());
        };
        const onBackpackItemUsed = () =>
        {
            setBackpackRevision(r => r + 1);
            saveManager.autoSave(getCurrentSnapshot());
        };
        const onBackpackChanged = () => setBackpackRevision(r => r + 1);

        EventBus.on('start-dialogue', onStartDialogue);
        EventBus.on('open-stage-map', onOpenStageMap);
        EventBus.on('weapon-changed', onWeaponChanged);
        EventBus.on('open-library', onOpenLibrary);
        EventBus.on('open-academy', onOpenAcademy);
        EventBus.on('open-workshop', onOpenWorkshop);
        EventBus.on('open-forge', onOpenForge);
        EventBus.on('open-backpack', onOpenBackpack);
        EventBus.on('open-gate-repair', onOpenGateRepair);
        EventBus.on('open-waypoint', onOpenWaypoint);
        EventBus.on('open-quiz-finisher', onOpenQuizFinisher);
        EventBus.on('change-level', onChangeLevel);
        EventBus.on('book-exam-passed', onBookExamPassed);
        EventBus.on('daily-practice-completed', onDailyPracticeCompleted);
        EventBus.on('backpack-item-used', onBackpackItemUsed);
        EventBus.on('backpack-changed', onBackpackChanged);
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
            EventBus.removeListener('start-dialogue', onStartDialogue);
            EventBus.removeListener('open-stage-map', onOpenStageMap);
            EventBus.removeListener('weapon-changed', onWeaponChanged);
            EventBus.removeListener('open-library', onOpenLibrary);
            EventBus.removeListener('open-academy', onOpenAcademy);
            EventBus.removeListener('open-workshop', onOpenWorkshop);
            EventBus.removeListener('open-forge', onOpenForge);
            EventBus.removeListener('open-backpack', onOpenBackpack);
            EventBus.removeListener('open-gate-repair', onOpenGateRepair);
            EventBus.removeListener('open-waypoint', onOpenWaypoint);
            EventBus.removeListener('open-quiz-finisher', onOpenQuizFinisher);
            EventBus.removeListener('change-level', onChangeLevel);
            EventBus.removeListener('book-exam-passed', onBookExamPassed);
            EventBus.removeListener('daily-practice-completed', onDailyPracticeCompleted);
            EventBus.removeListener('backpack-item-used', onBackpackItemUsed);
            EventBus.removeListener('backpack-changed', onBackpackChanged);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAdvanceDialogue = () =>
    {
        advanceDialogueUseCase(entities.dialogueState);
        const node = entities.dialogueState.getCurrentNode();
        if (node?.id === 'open_shop_node')
        {
            setIsShopOpen(true);
            handleCloseDialogue();
            return;
        }
        setCurrentDialogueNode(node);
        setDialogueChoices(entities.dialogueState.getAvailableChoices());
        if (!entities.dialogueState.isOpen)
        {
            setIsDialogueOpen(false);
            EventBus.emit('dialogue-open-state', false);
        }
    };

    const handleSelectDialogueChoice = (choiceIndex: number) =>
    {
        selectDialogueChoiceUseCase(entities.dialogueState, choiceIndex);
        const node = entities.dialogueState.getCurrentNode();
        if (node?.id === 'open_shop_node')
        {
            setIsShopOpen(true);
            handleCloseDialogue();
            return;
        }
        setCurrentDialogueNode(node);
        setDialogueChoices(entities.dialogueState.getAvailableChoices());
        if (!entities.dialogueState.isOpen)
        {
            setIsDialogueOpen(false);
            EventBus.emit('dialogue-open-state', false);
        }
    };

    const handleCloseDialogue = () =>
    {
        closeDialogueUseCase(entities.dialogueState);
        setIsDialogueOpen(false);
        setCurrentDialogueNode(null);
        setDialogueChoices([]);
        EventBus.emit('dialogue-open-state', false);
    };

    const handleCycleWeapon = () =>
    {
        const nextId = cycleEquippedWeaponUseCase(entities.equipment, entities.backpack);
        soundManager.playSelect();
        setEquippedWeaponId(nextId);
        saveManager.autoSave(getCurrentSnapshot());
    };

    const handleUseItem = (itemId: string) =>
    {
        if (isMainMenuOpen || levelComplete || gameOver || isGamePaused) return;

        const result = executeUseItemUseCase(entities.inventory, itemId);
        if (!result.success) return;

        setInventoryRevision(r => r + 1);
        soundManager.playUseItem();

        const gameScene = phaserRef.current?.scene as Game | null;

        if (itemId === 'heal-potion')
        {
            setLives(prev => Math.min(maxLives, prev + 1));
        }
        else if (itemId === 'bubble-shield')
        {
            gameScene?.player?.activateStar(8000);
            setStarTimer(8);
        }
        else if (itemId === 'star-candy')
        {
            gameScene?.player?.activateStar(6000);
            setStarTimer(6);
        }
        else if (itemId === 'slime-bomb')
        {
            EventBus.emit('trigger-bomb');
        }

        saveManager.autoSave(getCurrentSnapshot());
    };

    const getCurrentSnapshot = (slotId?: SaveSlotId): SaveGameSnapshot =>
    {
        const bookSnapshots: Record<string, any> = {};
        for (const [key, val] of Object.entries(entities.books))
        {
            bookSnapshots[key] = val.toSnapshot();
        }

        return {
            version: CURRENT_SAVE_VERSION,
            timestamp: Date.now(),
            slotId: slotId ?? saveManager.getActiveSlot(),
            gameStats: {
                highScore: gameStats.highScore,
                bestTimeSeconds: gameStats.bestTimeSeconds,
            },
            activeSkinId: skinManager.activeSkinId,
            settings: {
                soundMuted: settings.isSoundMuted,
                musicMuted: settings.isMusicMuted,
            },
            stageProgression: {
                unlockedStages: stageProgression.unlockedStages,
                completedStages: stageProgression.completedStages,
            },
            wallet: {
                balance: entities.wallet.balance,
            },
            weapons: entities.weaponLoadout.serialize(),
            upgrades: entities.upgradeTree.serialize(),
            inventory: entities.inventory.serialize(),
            achievements: entities.achievementManager.serialize(),

            // Version 4 Knowledge Quest fields
            books: bookSnapshots,
            backpack: entities.backpack.toSnapshot(),
            equipment: entities.equipment.toSnapshot(),
            practiceStats: entities.spacedRepetition.toSnapshot(),
            repairedGates: Array.from(entities.repairedGates),
            forgeUnlocked: entities.forgeUnlocked,
        };
    };

    const applyLoadedSnapshot = (snap: SaveGameSnapshot) =>
    {
        gameStats.loadFrom(snap.gameStats.highScore, snap.gameStats.bestTimeSeconds);
        repositories.gameStats.save(gameStats);
        setHighScore(gameStats.highScore);
        setBestTime(gameStats.bestTimeSeconds);

        skinManager.setActiveSkin(snap.activeSkinId);
        repositories.skin.saveActiveSkinId(snap.activeSkinId);
        setActiveSkinId(snap.activeSkinId);

        settings.setSoundMuted(snap.settings.soundMuted);
        settings.setMusicMuted(snap.settings.musicMuted);
        repositories.settings.save({ soundMuted: snap.settings.soundMuted, musicMuted: snap.settings.musicMuted });
        applySettingsUseCase(settings);
        setIsMuted(settings.isSoundMuted);
        setIsMusicMuted(settings.isMusicMuted);

        stageProgression.loadFrom(snap.stageProgression.unlockedStages, snap.stageProgression.completedStages);
        repositories.stageProgression.save(stageProgression);

        if (snap.wallet)
        {
            entities.wallet.setBalance(snap.wallet.balance);
            setWalletBalance(snap.wallet.balance);
        }
        if (snap.upgrades)
        {
            entities.upgradeTree.loadFrom(snap.upgrades);
        }
        if (snap.inventory)
        {
            entities.inventory.loadFrom(snap.inventory);
            setInventoryRevision(r => r + 1);
        }
        if (snap.achievements)
        {
            entities.achievementManager.loadFrom(snap.achievements);
            setUnclaimedAchievementsCount(entities.achievementManager.unclaimedCount);
        }

        // Version 5 Knowledge Quest fields restoration
        for (const existingKey of Object.keys(entities.books))
        {
            delete entities.books[existingKey];
        }
        if (snap.books)
        {
            for (const [key, val] of Object.entries(snap.books))
            {
                entities.books[key] = BookProgress.fromSnapshot(val);
            }
        }
        if (!entities.books['book-ch1'])
        {
            entities.books['book-ch1'] = new BookProgress('book-ch1', false);
        }
        setBooksRevision(r => r + 1);
        if (snap.backpack)
        {
            entities.backpack.loadFromSnapshot(snap.backpack);
            setBackpackRevision(r => r + 1);
        }
        if (snap.equipment)
        {
            entities.equipment = EquipmentState.fromSnapshot(snap.equipment);
            setEquippedWeaponId(entities.equipment.equippedWeaponId);
        }
        if (snap.practiceStats)
        {
            entities.spacedRepetition = SpacedRepetitionSystem.fromSnapshot(snap.practiceStats);
        }
        if (snap.repairedGates)
        {
            entities.repairedGates = new Set(snap.repairedGates);
        }
        if (typeof snap.forgeUnlocked === 'boolean')
        {
            entities.forgeUnlocked = snap.forgeUnlocked;
        }

        soundManager.playPowerUp();
    };

    const handleSaveGame = (slotId: SaveSlotId) =>
    {
        const snapshot = getCurrentSnapshot(slotId);
        saveManager.save(snapshot, slotId);
        saveManager.setActiveSlot(slotId);
        soundManager.playCoin();
    };

    const handleLoadGame = (slotId: SaveSlotId) =>
    {
        const snapshot = saveManager.load(slotId);
        saveManager.setActiveSlot(slotId);
        applyLoadedSnapshot(snapshot);

        if (phaserRef.current?.scene?.scene)
        {
            phaserRef.current.scene.scene.restart({
                levelKey: currentLevel,
                score: 0,
                lives: maxLives,
                skinId: snapshot.activeSkinId,
                coins: 0,
                elapsedMs: 0,
            });
        }
    };

    const handleImportGame = (saveString: string, targetSlot: SaveSlotId) =>
    {
        const success = saveManager.importSlotFromString(saveString, targetSlot);
        if (success)
        {
            const snapshot = saveManager.load(targetSlot);
            saveManager.setActiveSlot(targetSlot);
            applyLoadedSnapshot(snapshot);
            return true;
        }
        return false;
    };

    const handleToggleMute = () =>
    {
        const payload = toggleSoundUseCase(settings, repositories.settings);
        setIsMuted(payload.soundMuted);
        saveManager.autoSave(getCurrentSnapshot());
    };

    const handleToggleMusic = () =>
    {
        const payload = toggleMusicUseCase(settings, repositories.settings);
        setIsMusicMuted(payload.musicMuted);
        saveManager.autoSave(getCurrentSnapshot());
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
        const success = selectStageUseCase(stageProgression, stageKey);
        if (!success) return;

        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
        setIsMainMenuOpen(false);
        setIsStageSelectOpen(false);
        setIsStageMapOpen(false);
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

        writeString(ACTIVE_SESSION_STORAGE_KEY, stageKey);

        if (stageKey === 'village')
        {
            setVillageWelcomeToast('🏡 ຍິນດີຕ້ອນຮັບສູ່ ໝູ່ບ້ານ Cyber Village! (ລົມກັບຫົວໜ້າໝູ່ບ້ານ ແລະ NPC Mina)');
            setTimeout(() => setVillageWelcomeToast(null), 5000);
        }

        const game = phaserRef.current?.game;
        const isTitleActive = game ? game.scene.isActive('Title') : (phaserRef.current?.scene?.scene.key === 'Title');

        if (isTitleActive)
        {
            EventBus.emit('start-game', { levelKey: stageKey, skinId: activeSkinId });
        }
        else
        {
            soundManager.playGameStart();
            const startData = {
                levelKey: stageKey,
                score: 0,
                lives: maxLives,
                skinId: activeSkinId,
                coins: 0,
                elapsedMs: 0,
            };
            if (game)
            {
                game.scene.start('Game', startData);
            }
            else
            {
                phaserRef.current?.scene?.scene.start('Game', startData);
            }
        }
    };

    const handleOpenMainMenu = () =>
    {
        writeString(ACTIVE_SESSION_STORAGE_KEY, 'title');
        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
        setIsMainMenuOpen(true);
        setIsSettingsOpen(false);
        setIsSkinModalOpen(false);
        setIsStageSelectOpen(false);
        setIsStageMapOpen(false);
        setIsAchievementsOpen(false);
        setVillageWelcomeToast(null);
        soundManager.stopBgm();

        const game = phaserRef.current?.game;
        if (game)
        {
            if (game.scene.isActive('Game'))
            {
                game.scene.stop('Game');
            }
            game.scene.start('Title');
        }
        else
        {
            phaserRef.current?.scene?.scene.start('Title');
        }
    };

    const handleOpenAchievements = () =>
    {
        setIsAchievementsOpen(true);
    };

    const handleCloseAchievements = () =>
    {
        setIsAchievementsOpen(false);
    };

    const handleRewardClaimed = (newBalance: number) =>
    {
        setWalletBalance(newBalance);
        setUnclaimedAchievementsCount(entities.achievementManager.unclaimedCount);
        saveManager.autoSave(getCurrentSnapshot());
    };

    const handleClearAllData = () =>
    {
        if (typeof window !== 'undefined' && window.confirm('Are you sure you want to reset all High Scores and saved data?'))
        {
            resetSaveDataUseCase(
                { gameStats, skinManager, settings, stageProgression },
                repositories
            );
            saveManager.clearSlot(saveManager.getActiveSlot());
            entities.achievementManager.reset();
            entities.wallet.setBalance(50);
            for (const existingKey of Object.keys(entities.books))
            {
                delete entities.books[existingKey];
            }
            entities.books['book-ch1'] = new BookProgress('book-ch1', false);
            entities.backpack.loadFromSnapshot([]);
            entities.repairedGates.clear();
            entities.forgeUnlocked = false;
            setWalletBalance(50);
            setBooksRevision(r => r + 1);
            setBackpackRevision(r => r + 1);
            setUnclaimedAchievementsCount(0);
            setHighScore(0);
            setBestTime(null);
            setActiveSkinId('cyber-blue');
            setIsMuted(settings.isSoundMuted);
            setIsMusicMuted(settings.isMusicMuted);
            setIsNewHighScore(false);
            setIsNewBestTime(false);
            removeKey(ACTIVE_SESSION_STORAGE_KEY);
            soundManager.playCoin();
        }
    };

    const handleNextLevel = () =>
    {
        if (!nextLevel) return;

        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
        const target = nextLevel;
        writeString(ACTIVE_SESSION_STORAGE_KEY, target);
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
        writeString(ACTIVE_SESSION_STORAGE_KEY, target);

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
            saveManager.autoSave(getCurrentSnapshot());
        }
    };

    const activeSkinName =
        AVAILABLE_SKINS.find(s => s.id === activeSkinId)?.name.split(' ')[0] || 'Cyber';

    const inventorySlotViews = useMemo(() => [
        { id: 'heal-potion', name: 'Cyber Elixir', icon: '🧪', count: entities.inventory.getItemCount('heal-potion') },
        { id: 'bubble-shield', name: 'Nano Shield', icon: '🛡️', count: entities.inventory.getItemCount('bubble-shield') },
        { id: 'slime-bomb', name: 'Pulse Bomb', icon: '💣', count: entities.inventory.getItemCount('slime-bomb') },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [inventoryRevision]);

    const equippedWeaponDef = {
        id: equippedWeaponId,
        name: WEAPON_CONFIGS[equippedWeaponId]?.name ?? WEAPON_CONFIGS['wooden-sword'].name,
        icon: '🗡️',
    };

    const backpackSlotsUsed = useMemo(() => {
        void backpackRevision;
        return entities.backpack.usedSlotsCount;
    }, [backpackRevision]);

    const ownedBooksCount = useMemo(() => {
        void booksRevision;
        return Object.values(entities.books).filter(b => b.isUnlocked).length;
    }, [booksRevision]);

    return (
        <div id="app">
            <AchievementToast />
            {villageWelcomeToast && (
                <div className="village-welcome-toast">{villageWelcomeToast}</div>
            )}

            {!isMainMenuOpen && (
                <Hud
                    bossHp={bossHp}
                    bossMaxHp={bossMaxHp}
                    coinsCount={coinsCount}
                    currentLevel={currentLevel}
                    elapsedSeconds={elapsedSeconds}
                    equippedWeapon={{
                        id: equippedWeaponDef.id,
                        name: equippedWeaponDef.name,
                        icon: equippedWeaponDef.icon,
                    }}
                    highScore={highScore}
                    inventorySlots={inventorySlotViews}
                    isGamePaused={isGamePaused}
                    lives={lives}
                    maxLives={maxLives}
                    onCycleWeapon={handleCycleWeapon}
                    onOpenAchievements={handleOpenAchievements}
                    onOpenShop={() => setIsShopOpen(true)}
                    onOpenBackpack={() => setIsBackpackOpen(true)}
                    onOpenLibrary={() =>
                    {
                        setActiveReaderBookId(undefined);
                        setActiveReaderPageNumber(undefined);
                        setTextbookModalMode('reader');
                        setIsLibraryOpen(true);
                    }}
                    ownedBooksCount={ownedBooksCount}
                    backpackCount={backpackSlotsUsed}
                    maxBackpackSlots={entities.backpack.maxSlots}
                    onTogglePause={handleTogglePause}
                    onUseItem={handleUseItem}
                    score={score}
                    springTimer={springTimer}
                    starTimer={starTimer}
                    unclaimedAchievementsCount={unclaimedAchievementsCount}
                    walletBalance={walletBalance}
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
                    onOpenWorldMap={() =>
                    {
                        setLevelComplete(false);
                        setIsStageMapOpen(true);
                    }}
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
                    onOpenAchievements={handleOpenAchievements}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenSkinModal={() => setIsSkinModalOpen(true)}
                    onRestartLevel={() => handleRestart(false)}
                    onResume={handleResumeGame}
                    onToggleMusic={handleToggleMusic}
                    onToggleMute={handleToggleMute}
                    score={score}
                    unclaimedAchievementsCount={unclaimedAchievementsCount}
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
                    walletBalance={walletBalance}
                    onOpenAchievements={handleOpenAchievements}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenShop={() => setIsShopOpen(true)}
                    onOpenSkinModal={() => setIsSkinModalOpen(true)}
                    onOpenStageSelect={() => setIsStageMapOpen(true)}
                    onStartGame={handleStartGame}
                    unclaimedAchievementsCount={unclaimedAchievementsCount}
                />
            )}

            {isSettingsOpen && (
                <SettingsModal
                    isMusicMuted={isMusicMuted}
                    isMuted={isMuted}
                    onClearAllData={handleClearAllData}
                    onClose={() => setIsSettingsOpen(false)}
                    onImportGame={handleImportGame}
                    onLoadGame={handleLoadGame}
                    onSaveGame={handleSaveGame}
                    onToggleMusic={handleToggleMusic}
                    onToggleMute={handleToggleMute}
                />
            )}

            {(isStageMapOpen || isStageSelectOpen) && (
                <StageMapModal
                    currentLevel={currentLevel}
                    onClose={() =>
                    {
                        setIsStageMapOpen(false);
                        setIsStageSelectOpen(false);
                    }}
                    onSelectStage={handleStartGame}
                    stageProgression={stageProgression}
                />
            )}

            {isDialogueOpen && (
                <DialogueModal
                    choices={dialogueChoices}
                    node={currentDialogueNode}
                    onAdvance={handleAdvanceDialogue}
                    onChoose={handleSelectDialogueChoice}
                    onClose={handleCloseDialogue}
                />
            )}

            {isShopOpen && (
                <ShopModal
                    onClose={() => setIsShopOpen(false)}
                    onUpdateWallet={(bal) => setWalletBalance(bal)}
                    walletBalance={walletBalance}
                />
            )}

            {isAchievementsOpen && (
                <AchievementModal
                    achievementManager={entities.achievementManager}
                    onClose={handleCloseAchievements}
                    onRewardClaimed={handleRewardClaimed}
                    wallet={entities.wallet}
                />
            )}

            {/* Knowledge Quest Modals */}
            <TextbookModal
                isOpen={isLibraryOpen}
                mode={textbookModalMode}
                isInVillage={currentLevel === 'village'}
                initialBookId={activeReaderBookId}
                initialPageNumber={activeReaderPageNumber}
                onClose={() => setIsLibraryOpen(false)}
                onBookPurchased={(_bookId, newBalance) =>
                {
                    setWalletBalance(newBalance);
                    setBooksRevision(r => r + 1);
                    saveManager.autoSave(getCurrentSnapshot());
                }}
                onPageRead={() =>
                {
                    setBooksRevision(r => r + 1);
                    saveManager.autoSave(getCurrentSnapshot());
                }}
                onGoToExam={(bookId) =>
                {
                    setIsLibraryOpen(false);
                    setActiveExamBookId(bookId);
                    setIsAcademyOpen(true);
                }}
            />

            <AcademyModal
                isOpen={isAcademyOpen}
                initialBookId={activeExamBookId}
                onClose={() => setIsAcademyOpen(false)}
                onCreditChanged={(newBalance) =>
                {
                    setWalletBalance(newBalance);
                    saveManager.autoSave(getCurrentSnapshot());
                }}
                onOpenLibraryStore={() =>
                {
                    if (currentLevel === 'village')
                    {
                        setTextbookModalMode('library-store');
                        setIsLibraryOpen(true);
                    }
                }}
                onOpenReader={(bookId, pageNumber) =>
                {
                    setActiveReaderBookId(bookId);
                    setActiveReaderPageNumber(pageNumber);
                    setTextbookModalMode('reader');
                    setIsLibraryOpen(true);
                }}
                onExamPassed={() =>
                {
                    setWalletBalance(entities.wallet.balance);
                    setBooksRevision(r => r + 1);
                    setBackpackRevision(r => r + 1);
                    saveManager.autoSave(getCurrentSnapshot());
                }}
            />

            <WorkshopModal
                isOpen={isWorkshopOpen}
                onClose={() =>
                {
                    setIsWorkshopOpen(false);
                    setBackpackRevision(r => r + 1);
                }}
            />

            <ForgeModal
                isOpen={isForgeOpen}
                onClose={() =>
                {
                    setIsForgeOpen(false);
                    setBackpackRevision(r => r + 1);
                }}
            />

            <BackpackModal
                isOpen={isBackpackOpen}
                onClose={() => setIsBackpackOpen(false)}
                onOpenBooks={() =>
                {
                    setActiveReaderBookId(undefined);
                    setActiveReaderPageNumber(undefined);
                    setTextbookModalMode('reader');
                    setIsLibraryOpen(true);
                }}
                onUseItem={(itemId) =>
                {
                    if (itemId === 'herb-potion')
                    {
                        setLives(prev => Math.min(maxLives, prev + 1));
                    }
                    setBackpackRevision(r => r + 1);
                    saveManager.autoSave(getCurrentSnapshot());
                }}
            />

            <GateRepairModal
                isOpen={isGateRepairOpen}
                gateId={activeGateId}
                onClose={() => setIsGateRepairOpen(false)}
                onGateRepaired={() =>
                {
                    setIsGateRepairOpen(false);
                    setBackpackRevision(r => r + 1);
                    saveManager.autoSave(getCurrentSnapshot());
                }}
            />

            <WaypointModal
                isOpen={isWaypointOpen}
                waypointName={waypointName}
                onClose={() => setIsWaypointOpen(false)}
                onReturnConfirmed={() =>
                {
                    setIsWaypointOpen(false);
                    setLives(maxLives);
                    handleStartGame('village');
                }}
            />

            <QuizFinisherModal
                isOpen={isQuizFinisherOpen}
                onClose={() => setIsQuizFinisherOpen(false)}
                onPass={() =>
                {
                    setIsQuizFinisherOpen(false);
                    EventBus.emit('quiz-finisher-passed');
                    setBackpackRevision(r => r + 1);
                    saveManager.autoSave(getCurrentSnapshot());
                }}
                onFail={() =>
                {
                    setIsQuizFinisherOpen(false);
                    EventBus.emit('quiz-finisher-failed');
                }}
            />

            <VirtualTouchControls
                visible={
                    !isMainMenuOpen &&
                    !isGamePaused &&
                    !levelComplete &&
                    !gameOver &&
                    !isDialogueOpen &&
                    !isShopOpen &&
                    !isSettingsOpen &&
                    !isSkinModalOpen &&
                    !isAchievementsOpen &&
                    !(isStageMapOpen || isStageSelectOpen) &&
                    !isLibraryOpen &&
                    !isAcademyOpen &&
                    !isWorkshopOpen &&
                    !isForgeOpen &&
                    !isBackpackOpen &&
                    !isGateRepairOpen &&
                    !isWaypointOpen &&
                    !isQuizFinisherOpen
                }
            />
        </div>
    );
}

export default App;
