import { useEffect, useMemo, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { DomainEvents } from '../../domain/DomainEvents';
import {
    PLAYER_DAMAGED_EVENT,
    PLAYER_DIED_EVENT,
    PlayerDamagedPayload,
} from '../../application/PlayerTakeDamageUseCase';
import { PLAYER_HEALED_EVENT, PlayerHealedPayload } from '../../application/ConsumeItemUseCase';
import { GateRequirements } from '../../application/RepairBrokenGateUseCase';
import {
    BOSS_DAMAGED_EVENT,
    BOSS_DEFEATED_EVENT,
    BossDamagedPayload,
    BossDefeatedPayload,
} from '../../application/DamageBossUseCase';
import { toggleSoundUseCase, toggleMusicUseCase } from '../../application/UpdateSettingsUseCase';
import { soundManager } from '../audio/SoundManager';
import { SaveGameSnapshot } from '../../domain/entities/SaveData';
import { saveManager, SaveSlotId } from '../storage/SaveManager';
import {
    GAME_PAUSED_EVENT,
    GAME_RESUMED_EVENT,
    pauseGameUseCase,
    resumeGameUseCase,
    togglePauseUseCase,
} from '../../application/TogglePauseUseCase';
import { EventBus } from '../EventBus';
import { entities, repositories } from '../composition';
import { Hud } from './components/Hud';
import { SkinModal } from './components/SkinModal';
import { useDialogue } from './hooks/useDialogue';
import { useSkinShop } from './hooks/useSkinShop';
import { createCurrentSnapshot, resetEntitiesToNewGame, restoreEntitiesFromSnapshot } from '../saveSnapshot';
import { getNextObjective } from '../../domain/utils/nextObjective';
import { getGameContent } from '../content/ContentCatalog';
import { PauseMenuModal } from './components/PauseMenuModal';
import { MainMenuModal } from './components/MainMenuModal';
import { SettingsModal } from './components/SettingsModal';
import { StageMapModal } from './components/StageMapModal';
import { DialogueModal } from './components/DialogueModal';
import { VirtualTouchControls } from './components/VirtualTouchControls';
import { completeStageUseCase } from '../../application/CompleteStageUseCase';
import { awardChapterClearUseCase } from '../../application/AwardChapterClearUseCase';
import { selectStageUseCase } from '../../application/SelectStageUseCase';
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

    const [currentLevel, setCurrentLevel] = useState(() => (shouldResumeInGame ? initialSession : 'village'));
    const [health, setHealth] = useState(() => entities.health.current);
    const [walletBalance, setWalletBalance] = useState(() => entities.wallet.balance);
    const [equippedWeaponId, setEquippedWeaponId] = useState(() => entities.equipment.equippedWeaponId);
    const [skinManager] = useState(() => entities.skinManager);
    const [settings] = useState(() => entities.settings);
    const [stageProgression] = useState(() => entities.stageProgression);
    const [pauseState] = useState(() => entities.pauseState);
    const [isMuted, setIsMuted] = useState(entities.settings.isSoundMuted);
    const [isMusicMuted, setIsMusicMuted] = useState(entities.settings.isMusicMuted);
    const [bossHp, setBossHp] = useState<number | null>(null);
    const [bossMaxHp, setBossMaxHp] = useState(5);
    const [isMainMenuOpen, setIsMainMenuOpen] = useState(!shouldResumeInGame);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStageSelectOpen, setIsStageSelectOpen] = useState(false);
    const [isStageMapOpen, setIsStageMapOpen] = useState(false);
    const [isGamePaused, setIsGamePaused] = useState(false);
    const [villageWelcomeToast, setVillageWelcomeToast] = useState<string | null>(() =>
        shouldResumeInGame && initialSession === 'village'
            ? '🏡 ຍິນດີຕ້ອນຮັບສູ່ ໝູ່ບ້ານ Cyber Village! (ລົມກັບຫົວໜ້າໝູ່ບ້ານ ແລະ NPC Mina)'
            : null
    );
    const maxHealth = entities.health.max;

    useEffect(() =>
    {
        if (villageWelcomeToast)
        {
            const timer = setTimeout(() => setVillageWelcomeToast(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [villageWelcomeToast]);

    const pauseStateRef = useRef(pauseState);
    pauseStateRef.current = pauseState;
    const isMainMenuOpenRef = useRef(isMainMenuOpen);
    isMainMenuOpenRef.current = isMainMenuOpen;
    const {
        isDialogueOpen,
        isDialogueOpenRef,
        currentDialogueNode,
        dialogueChoices,
        advanceDialogue,
        selectDialogueChoice,
        closeDialogue,
    } = useDialogue();
    const {
        activeSkinId,
        setActiveSkinId,
        isSkinModalOpen,
        skinNotice,
        openSkinModal,
        closeSkinModal,
        buySkin,
        equipSkin,
    } = useSkinShop(() => setWalletBalance(entities.wallet.balance));
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
    const [activeGateRequirements, setActiveGateRequirements] = useState<GateRequirements | undefined>(undefined);
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
        const onStageCleared = (payload: { stageId: string }) =>
        {
            // Beating a Chapter boss sends the player home to learn and craft, not to a score screen
            const clear = completeStageUseCase(
                stageProgressionRef.current,
                repositories.stageProgression,
                payload.stageId,
                null
            );
            const bonus = awardChapterClearUseCase(entities.wallet, clear.isFirstTimeClear);
            setWalletBalance(entities.wallet.balance);
            saveManager.autoSave(createCurrentSnapshot());
            EventBus.emit('change-level', 'village');
            const bonusText = bonus > 0 ? ` +${bonus} 🎓 Credit!` : '';
            setTimeout(() => setVillageWelcomeToast(`🏆 ຊະນະ Boss ບົດທີ 1!${bonusText} ກັບມາໝູ່ບ້ານເພື່ອຮຽນ ແລະ ສ້າງອາວຸດຕໍ່ໄປ`), 300);
        };

        const onPlayerHealthChanged = (payload: PlayerDamagedPayload | PlayerHealedPayload) =>
        {
            setHealth(payload.currentHealth);
        };

        const onGameOver = () =>
        {
            // Dying costs half the carried Materials, then the player wakes up healed in the village
            const result = returnToVillageUseCase('death', entities.backpack);
            setBackpackRevision(r => r + 1);
            saveManager.autoSave(createCurrentSnapshot());

            const lostCount = result.lostMaterials.reduce((total, m) => total + m.count, 0);
            setTimeout(() =>
            {
                EventBus.emit('change-level', 'village');
                setTimeout(() => setVillageWelcomeToast(
                    lostCount > 0
                        ? `💀 ເຈົ້າສະຫຼົບ! ເສຍວັດສະດຸ ${lostCount} ຊິ້ນ ແຕ່ HP ຟື້ນເຕັມແລ້ວ`
                        : '💀 ເຈົ້າສະຫຼົບ! ກັບມາໝູ່ບ້ານ HP ຟື້ນເຕັມແລ້ວ'
                ), 300);
            }, 1200);
        };

        const onBossDamaged = (payload: BossDamagedPayload) =>
        {
            setBossHp(payload.currentHp);
            setBossMaxHp(payload.maxHp);
        };

        const onBossDefeated = () =>
        {
            setBossHp(0);
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
                setIsMuted(toggleSoundUseCase(entities.settings, repositories.settings).soundMuted);
            }
            else if (e.key === 'b' || e.key === 'B')
            {
                setIsMusicMuted(toggleMusicUseCase(entities.settings, repositories.settings).musicMuted);
            }
            else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P')
            {
                if (isMainMenuOpenRef.current) return;

                if (isDialogueOpenRef.current)
                {
                    closeDialogue();
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
                if (!isMainMenuOpenRef.current)
                {
                    setIsBackpackOpen(prev => !prev);
                }
            }
            else if (e.key === 'q' || e.key === 'Q')
            {
                if (!isMainMenuOpenRef.current)
                {
                    handleCycleWeapon();
                }
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
        const onOpenGateRepair = (gateId?: string, requirements?: GateRequirements) =>
        {
            if (gateId) setActiveGateId(gateId);
            setActiveGateRequirements(requirements);
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
            saveManager.autoSave(createCurrentSnapshot());
        };
        const onDailyPracticeCompleted = () =>
        {
            setWalletBalance(entities.wallet.balance);
            saveManager.autoSave(createCurrentSnapshot());
        };
        const onBackpackItemUsed = () =>
        {
            setBackpackRevision(r => r + 1);
            saveManager.autoSave(createCurrentSnapshot());
        };
        const onBackpackChanged = () => setBackpackRevision(r => r + 1);

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
        EventBus.on('stage-cleared', onStageCleared);
        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, onPlayerHealthChanged);
        DomainEvents.on<PlayerHealedPayload>(PLAYER_HEALED_EVENT, onPlayerHealthChanged);
        DomainEvents.on(PLAYER_DIED_EVENT, onGameOver);
        DomainEvents.on<BossDamagedPayload>(BOSS_DAMAGED_EVENT, onBossDamaged);
        DomainEvents.on<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, onBossDefeated);
        DomainEvents.on(GAME_PAUSED_EVENT, onGamePaused);
        DomainEvents.on(GAME_RESUMED_EVENT, onGameResumed);
        window.addEventListener('keydown', handleKeyDown);

        return () =>
        {
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
            EventBus.removeListener('stage-cleared', onStageCleared);
            DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, onPlayerHealthChanged);
            DomainEvents.off<PlayerHealedPayload>(PLAYER_HEALED_EVENT, onPlayerHealthChanged);
            DomainEvents.off(PLAYER_DIED_EVENT, onGameOver);
            DomainEvents.off<BossDamagedPayload>(BOSS_DAMAGED_EVENT, onBossDamaged);
            DomainEvents.off<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, onBossDefeated);
            DomainEvents.off(GAME_PAUSED_EVENT, onGamePaused);
            DomainEvents.off(GAME_RESUMED_EVENT, onGameResumed);
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCycleWeapon = () =>
    {
        const nextId = cycleEquippedWeaponUseCase(entities.equipment, entities.backpack);
        soundManager.playSelect();
        setEquippedWeaponId(nextId);
        saveManager.autoSave(createCurrentSnapshot());
    };

    /** Refreshes React state after the live entities were replaced (load, import or reset). */
    const syncStateFromEntities = () =>
    {
        setActiveSkinId(skinManager.activeSkinId);
        setIsMuted(settings.isSoundMuted);
        setIsMusicMuted(settings.isMusicMuted);
        setWalletBalance(entities.wallet.balance);
        setEquippedWeaponId(entities.equipment.equippedWeaponId);
        setBooksRevision(r => r + 1);
        setBackpackRevision(r => r + 1);
    };

    const applyLoadedSnapshot = (snap: SaveGameSnapshot) =>
    {
        restoreEntitiesFromSnapshot(snap);
        syncStateFromEntities();
        soundManager.playPowerUp();
    };

    const handleSaveGame = (slotId: SaveSlotId) =>
    {
        const snapshot = createCurrentSnapshot(slotId);
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
                skinId: snapshot.activeSkinId,
                coins: 0,
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
        saveManager.autoSave(createCurrentSnapshot());
    };

    const handleToggleMusic = () =>
    {
        const payload = toggleMusicUseCase(settings, repositories.settings);
        setIsMusicMuted(payload.musicMuted);
        saveManager.autoSave(createCurrentSnapshot());
    };

    const handlePauseGame = () =>
    {
        if (isMainMenuOpen) return;
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
        setHealth(maxHealth);
        setCurrentLevel(stageKey);
        setBossHp(null);

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
                skinId: activeSkinId,
                coins: 0,
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
        setIsStageSelectOpen(false);
        setIsStageMapOpen(false);
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

    const handleClearAllData = () =>
    {
        if (typeof window !== 'undefined' && window.confirm('Are you sure you want to reset all saved data?'))
        {
            resetEntitiesToNewGame();
            syncStateFromEntities();
            removeKey(ACTIVE_SESSION_STORAGE_KEY);
            soundManager.playCoin();
        }
    };

    const handleRestart = (resetToStart = false) =>
    {
        resumeGameUseCase(pauseState);
        setIsGamePaused(false);
        const target = resetToStart ? 'village' : currentLevel;
        writeString(ACTIVE_SESSION_STORAGE_KEY, target);

        if (resetToStart)
        {
            setHealth(maxHealth);
        }

        setCurrentLevel(target);
        setBossHp(null);

        phaserRef.current?.scene?.scene.restart({
            levelKey: target,
            skinId: activeSkinId,
        });
    };

    const equippedWeaponDef = {
        id: equippedWeaponId,
        name: WEAPON_CONFIGS[equippedWeaponId]?.name ?? WEAPON_CONFIGS['wooden-sword'].name,
        icon: '🗡️',
    };

    const backpackSlotsUsed = useMemo(() => {
        void backpackRevision;
        return entities.backpack.usedSlotsCount;
    }, [backpackRevision]);

    const ch1PageCount = getGameContent().books.find(b => b.id === 'book-ch1')?.pages.length ?? 0;

    const objective = useMemo(() => {
        void booksRevision;
        void backpackRevision;
        void walletBalance;
        const book = entities.books['book-ch1'];
        const count = (id: string) => entities.backpack.getItemCount(id);
        return getNextObjective({
            ownsBook: Boolean(book?.isUnlocked),
            bookFullyRead: Boolean(book && ch1PageCount > 0 && book.isFullyRead(ch1PageCount)),
            examPassed: Boolean(book?.examPassed),
            hasPickaxe: count('pickaxe-t1') > 0,
            hasHammer: count('hammer-t1') > 0,
            hasRepairKit: count('repair-kit') > 0,
            gateRepaired: entities.repairedGates.has('gate-ch1'),
            bossCleared: stageProgression.isStageCompleted('stage-ch1'),
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [booksRevision, backpackRevision, walletBalance, ch1PageCount, currentLevel]);

    const ownedBooksCount = useMemo(() => {
        void booksRevision;
        return Object.values(entities.books).filter(b => b.isUnlocked).length;
    }, [booksRevision]);

    return (
        <div id="app">
            {villageWelcomeToast && (
                <div className="village-welcome-toast">{villageWelcomeToast}</div>
            )}

            {!isMainMenuOpen && (
                <Hud
                    bossHp={bossHp}
                    bossMaxHp={bossMaxHp}
                    currentLevel={currentLevel}
                    objective={objective}
                    equippedWeapon={{
                        id: equippedWeaponDef.id,
                        name: equippedWeaponDef.name,
                        icon: equippedWeaponDef.icon,
                    }}
                    isGamePaused={isGamePaused}
                    health={health}
                    maxHealth={maxHealth}
                    onCycleWeapon={handleCycleWeapon}
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
                    walletBalance={walletBalance}
                />
            )}

            <PhaserGame ref={phaserRef} />

            {isGamePaused && !isMainMenuOpen && (
                <PauseMenuModal
                    currentLevel={currentLevel}
                    isMusicMuted={isMusicMuted}
                    isMuted={isMuted}
                    onExitToMainMenu={handleOpenMainMenu}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenSkinModal={openSkinModal}
                    onRestartLevel={() => handleRestart(false)}
                    onResume={handleResumeGame}
                    onToggleMusic={handleToggleMusic}
                    onToggleMute={handleToggleMute}
                />
            )}

            {isSkinModalOpen && (
                <SkinModal
                    activeSkinId={activeSkinId}
                    walletBalance={walletBalance}
                    skinManager={skinManager}
                    notice={skinNotice}
                    onClose={closeSkinModal}
                    onBuySkin={buySkin}
                    onEquipSkin={equipSkin}
                />
            )}

            {isMainMenuOpen && (
                <MainMenuModal
                    walletBalance={walletBalance}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenSkinModal={openSkinModal}
                    onOpenStageSelect={() => setIsStageMapOpen(true)}
                    onStartGame={handleStartGame}
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
                    onAdvance={advanceDialogue}
                    onChoose={selectDialogueChoice}
                    onClose={closeDialogue}
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
                    saveManager.autoSave(createCurrentSnapshot());
                }}
                onPageRead={() =>
                {
                    setBooksRevision(r => r + 1);
                    saveManager.autoSave(createCurrentSnapshot());
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
                    saveManager.autoSave(createCurrentSnapshot());
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
                    saveManager.autoSave(createCurrentSnapshot());
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
                onUseItem={() =>
                {
                    setBackpackRevision(r => r + 1);
                    saveManager.autoSave(createCurrentSnapshot());
                }}
            />

            <GateRepairModal
                isOpen={isGateRepairOpen}
                gateId={activeGateId}
                requirements={activeGateRequirements}
                onClose={() => setIsGateRepairOpen(false)}
                onGateRepaired={() =>
                {
                    setIsGateRepairOpen(false);
                    setBackpackRevision(r => r + 1);
                    saveManager.autoSave(createCurrentSnapshot());
                }}
            />

            <WaypointModal
                isOpen={isWaypointOpen}
                waypointName={waypointName}
                onClose={() => setIsWaypointOpen(false)}
                onReturnConfirmed={() =>
                {
                    setIsWaypointOpen(false);
                    setHealth(maxHealth);
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
                    saveManager.autoSave(createCurrentSnapshot());
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
                    !isDialogueOpen &&
                    !isSettingsOpen &&
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
