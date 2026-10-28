import { useEffect, useMemo, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { DomainEvents } from '../../domain/DomainEvents';
import {
    PLAYER_DAMAGED_EVENT,
    PLAYER_DIED_EVENT,
    PlayerDamagedPayload,
} from '../../application/PlayerTakeDamageUseCase';
import {
    BOSS_DAMAGED_EVENT,
    BOSS_DEFEATED_EVENT,
    BossDamagedPayload,
    BossDefeatedPayload,
} from '../../application/DamageBossUseCase';
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
import { EventBus } from '../EventBus';
import { entities, repositories } from '../composition';
import { Hud } from './components/Hud';
import { SkinModal } from './components/SkinModal';
import { purchaseSkinUseCase } from '../../application/PurchaseSkinUseCase';
import { selectSkinUseCase } from '../../application/SelectSkinUseCase';
import { STARTER_BOOK_CREDIT_RESERVE } from '../../domain/entities/SaveData';
import { getNextObjective } from '../../domain/utils/nextObjective';
import { loadBooksData } from '../dataLoader';
import { PauseMenuModal } from './components/PauseMenuModal';
import { MainMenuModal } from './components/MainMenuModal';
import { SettingsModal } from './components/SettingsModal';
import { StageMapModal } from './components/StageMapModal';
import { DialogueChoice, DialogueNode } from '../../domain/entities/Dialogue';
import { DialogueModal } from './components/DialogueModal';
import { VirtualTouchControls } from './components/VirtualTouchControls';
import { VILLAGE_ELDER_DIALOGUE } from '../dialogue/villageElderDialogue';
import {
    advanceDialogueUseCase,
    closeDialogueUseCase,
    selectDialogueChoiceUseCase,
    startDialogueUseCase,
} from '../../application/AdvanceDialogueUseCase';
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

    const [currentLevel, setCurrentLevel] = useState(() => (shouldResumeInGame ? initialSession : 'village'));
    const [health, setHealth] = useState(3);
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
    const [activeSkinId, setActiveSkinId] = useState(entities.skinManager.activeSkinId);
    const [isSkinModalOpen, setIsSkinModalOpen] = useState(false);
    const [skinNotice, setSkinNotice] = useState<string | null>(null);
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
    const maxHealth = 3;

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
    const [isDialogueOpen, setIsDialogueOpen] = useState(false);
    const [currentDialogueNode, setCurrentDialogueNode] = useState<DialogueNode | null>(null);
    const [dialogueChoices, setDialogueChoices] = useState<DialogueChoice[]>([]);
    const isDialogueOpenRef = useRef(isDialogueOpen);
    isDialogueOpenRef.current = isDialogueOpen;
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
            saveManager.autoSave(getCurrentSnapshot());
            EventBus.emit('change-level', 'village');
            const bonusText = bonus > 0 ? ` +${bonus} 🎓 Credit!` : '';
            setTimeout(() => setVillageWelcomeToast(`🏆 ຊະນະ Boss ບົດທີ 1!${bonusText} ກັບມາໝູ່ບ້ານເພື່ອຮຽນ ແລະ ສ້າງອາວຸດຕໍ່ໄປ`), 300);
        };

        const onPlayerDamaged = (payload: PlayerDamagedPayload) =>
        {
            setHealth(payload.currentHealth);
        };

        const onGameOver = () =>
        {
            // Dying costs half the carried Materials, then the player wakes up healed in the village
            const result = returnToVillageUseCase('death', entities.backpack);
            setBackpackRevision(r => r + 1);
            saveManager.autoSave(getCurrentSnapshot());

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
        EventBus.on('stage-cleared', onStageCleared);
        DomainEvents.on<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, onPlayerDamaged);
        DomainEvents.on(PLAYER_DIED_EVENT, onGameOver);
        DomainEvents.on<BossDamagedPayload>(BOSS_DAMAGED_EVENT, onBossDamaged);
        DomainEvents.on<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, onBossDefeated);
        DomainEvents.on(GAME_PAUSED_EVENT, onGamePaused);
        DomainEvents.on(GAME_RESUMED_EVENT, onGameResumed);
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
            EventBus.removeListener('stage-cleared', onStageCleared);
            DomainEvents.off<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, onPlayerDamaged);
            DomainEvents.off(PLAYER_DIED_EVENT, onGameOver);
            DomainEvents.off<BossDamagedPayload>(BOSS_DAMAGED_EVENT, onBossDamaged);
            DomainEvents.off<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, onBossDefeated);
            DomainEvents.off(GAME_PAUSED_EVENT, onGamePaused);
            DomainEvents.off(GAME_RESUMED_EVENT, onGameResumed);
            window.removeEventListener('keydown', handleKeyDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAdvanceDialogue = () =>
    {
        advanceDialogueUseCase(entities.dialogueState);
        const node = entities.dialogueState.getCurrentNode();
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
            activeSkinId: skinManager.activeSkinId,
            ownedSkins: skinManager.ownedSkinIds,
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

        skinManager.restore(snap.activeSkinId, snap.ownedSkins);
        repositories.skin.saveActiveSkinId(skinManager.activeSkinId);
        setActiveSkinId(skinManager.activeSkinId);

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
        if (snap.achievements)
        {
            entities.achievementManager.loadFrom(snap.achievements);
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
        if (typeof window !== 'undefined' && window.confirm('Are you sure you want to reset all High Scores and saved data?'))
        {
            resetSaveDataUseCase(
                { skinManager, settings, stageProgression },
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
            setWalletBalance(20);
            setBooksRevision(r => r + 1);
            setBackpackRevision(r => r + 1);
            setActiveSkinId('cyber-blue');
            setIsMuted(settings.isSoundMuted);
            setIsMusicMuted(settings.isMusicMuted);
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

    const handleBuySkin = (skinId: string) =>
    {
        // Until the first textbook is bought, its price stays untouchable
        const reserve = entities.books['book-ch1']?.isUnlocked ? 0 : STARTER_BOOK_CREDIT_RESERVE;
        const result = purchaseSkinUseCase(entities.wallet, skinManager, skinId, reserve);

        if (result.success)
        {
            setWalletBalance(entities.wallet.balance);
            setSkinNotice('🎉 ຊື້ຊຸດສຳເລັດ! ກົດ "ໃສ່" ເພື່ອໃສ່ຊຸດນີ້');
            soundManager.playBuy();
            saveManager.autoSave(getCurrentSnapshot());
            return;
        }

        soundManager.playHurt();
        const reasons: Record<typeof result.reason, string> = {
            unknown_skin: '❌ ບໍ່ພົບຊຸດນີ້',
            already_owned: 'ເຈົ້າມີຊຸດນີ້ແລ້ວ',
            insufficient_credit: '❌ Credit ບໍ່ພໍ — ຮຽນ ແລະ ສອບເພື່ອຫາ Credit ເພີ່ມ',
            reserved_for_textbook: `📚 ເກັບ ${STARTER_BOOK_CREDIT_RESERVE} Credit ໄວ້ຊື້ປຶ້ມຕຳລາບົດທີ 1 ກ່ອນ`,
        };
        setSkinNotice(reasons[result.reason]);
    };

    const handleEquipSkin = (skinId: string) =>
    {
        if (selectSkinUseCase(skinManager, skinId, repositories.skin))
        {
            setActiveSkinId(skinId);
            saveManager.autoSave(getCurrentSnapshot());
        }
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

    const [ch1PageCount, setCh1PageCount] = useState(0);
    useEffect(() =>
    {
        loadBooksData()
            .then(books => setCh1PageCount(books.find(b => b.id === 'book-ch1')?.pages.length ?? 0))
            .catch(console.error);
    }, []);

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
                    onOpenSkinModal={() => setIsSkinModalOpen(true)}
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
                    onClose={() => { setIsSkinModalOpen(false); setSkinNotice(null); }}
                    onBuySkin={handleBuySkin}
                    onEquipSkin={handleEquipSkin}
                />
            )}

            {isMainMenuOpen && (
                <MainMenuModal
                    walletBalance={walletBalance}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenSkinModal={() => setIsSkinModalOpen(true)}
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
                    onAdvance={handleAdvanceDialogue}
                    onChoose={handleSelectDialogueChoice}
                    onClose={handleCloseDialogue}
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
                        setHealth(prev => Math.min(maxHealth, prev + 1));
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
