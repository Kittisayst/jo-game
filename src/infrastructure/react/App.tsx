import { useEffect, useMemo, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { toggleSoundUseCase, toggleMusicUseCase } from '../../application/UpdateSettingsUseCase';
import { soundManager } from '../audio/SoundManager';
import { SaveGameSnapshot, STARTER_BOOK_CREDIT_RESERVE } from '../../domain/entities/SaveData';
import { saveManager, SaveSlotId } from '../storage/SaveManager';
import {
    pauseGameUseCase,
    resumeGameUseCase,
    togglePauseUseCase,
} from '../../application/TogglePauseUseCase';
import { EventBus } from '../EventBus';
import { entities, repositories } from '../composition';
import { Hud } from './components/Hud';
import { SkinModal } from './components/SkinModal';
import { useDialogue } from './hooks/useDialogue';
import { useGameEvents } from './hooks/useGameEvents';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useModalState } from './hooks/useModalState';
import { useSkinShop } from './hooks/useSkinShop';
import { autoSaveGame, createCurrentSnapshot, resetEntitiesToNewGame, restoreEntitiesFromSnapshot } from '../saveSnapshot';
import { getNextObjective } from '../../domain/utils/nextObjective';
import { getGameContent } from '../content/ContentCatalog';
import { PauseMenuModal } from './components/PauseMenuModal';
import { TitleMenu } from './components/TitleMenu';
import { SettingsModal } from './components/SettingsModal';
import { StageMapModal } from './components/StageMapModal';
import { DialogueModal } from './components/DialogueModal';
import { VirtualTouchControls } from './components/VirtualTouchControls';
import { completeStageUseCase } from '../../application/CompleteStageUseCase';
import { awardChapterClearUseCase } from '../../application/AwardChapterClearUseCase';
import { selectStageUseCase } from '../../application/SelectStageUseCase';
import { WEAPON_CONFIGS } from '../../domain/entities/EquipmentState';
import { cycleEquippedWeaponUseCase } from '../../application/CycleEquippedWeaponUseCase';
import { TextbookModal } from './components/TextbookModal';
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

    const {
        isDialogueOpen,
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
    const modals = useModalState();
    const {
        isLibraryOpen, setIsLibraryOpen,
        textbookModalMode, setTextbookModalMode,
        activeReaderBookId, setActiveReaderBookId,
        activeReaderPageNumber, setActiveReaderPageNumber,
        isAcademyOpen, setIsAcademyOpen,
        activeExamBookId, setActiveExamBookId,
        isWorkshopOpen, setIsWorkshopOpen,
        isForgeOpen, setIsForgeOpen,
        isBackpackOpen, setIsBackpackOpen,
        isGateRepairOpen, setIsGateRepairOpen,
        activeGateId, setActiveGateId,
        activeGateRequirements, setActiveGateRequirements,
        isWaypointOpen, setIsWaypointOpen,
        waypointName, setWaypointName,
        isQuizFinisherOpen, setIsQuizFinisherOpen,
        isSettingsOpen, setIsSettingsOpen,
        isStageSelectOpen, setIsStageSelectOpen,
        isStageMapOpen, setIsStageMapOpen,
    } = modals;

    // Bumped when books or the backpack change, so memoised values that read them recompute
    const [booksRevision, setBooksRevision] = useState(0);
    const [backpackRevision, setBackpackRevision] = useState(0);

    useEffect(() =>
    {
        // Ensure legacy local storage keys are migrated into active save slot on startup
        saveManager.load();
    }, []);

    const handleCycleWeapon = () =>
    {
        const nextId = cycleEquippedWeaponUseCase(entities.equipment, entities.backpack);
        soundManager.playSelect();
        setEquippedWeaponId(nextId);
        autoSaveGame();
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
        autoSaveGame();
    };

    const handleToggleMusic = () =>
    {
        const payload = toggleMusicUseCase(settings, repositories.settings);
        setIsMusicMuted(payload.musicMuted);
        autoSaveGame();
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

    // Anything beyond a brand-new save: the first menu item then reads "Continue" and "New Game" appears
    const hasProgress = Object.values(entities.books).some(book => book.isUnlocked)
        || stageProgression.completedStages.length > 0
        || walletBalance !== STARTER_BOOK_CREDIT_RESERVE
        || skinManager.ownedSkinIds.length > 1;

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

    const handleEscape = () =>
    {
        if (isMainMenuOpen) return;

        if (isDialogueOpen)
        {
            closeDialogue();
            return;
        }

        if (modals.closeTopModal()) return;

        togglePauseUseCase(pauseState);
    };

    useGlobalShortcuts({
        toggleSound: () => setIsMuted(toggleSoundUseCase(entities.settings, repositories.settings).soundMuted),
        toggleMusic: () => setIsMusicMuted(toggleMusicUseCase(entities.settings, repositories.settings).musicMuted),
        escape: handleEscape,
        toggleBackpack: () =>
        {
            if (!isMainMenuOpen) setIsBackpackOpen(prev => !prev);
        },
    });

    useGameEvents({
        onStageCleared: payload =>
        {
            // Beating a Chapter boss sends the player home to learn and craft, not to a score screen
            const clear = completeStageUseCase(stageProgression, repositories.stageProgression, payload.stageId, null);
            const bonus = awardChapterClearUseCase(entities.wallet, clear.isFirstTimeClear);
            setWalletBalance(entities.wallet.balance);
            autoSaveGame();
            EventBus.emit('change-level', 'village');
            const bonusText = bonus > 0 ? ` +${bonus} 🎓 Credit!` : '';
            setTimeout(() => setVillageWelcomeToast(`🏆 ຊະນະ Boss ບົດທີ 1!${bonusText} ກັບມາໝູ່ບ້ານເພື່ອຮຽນ ແລະ ສ້າງອາວຸດຕໍ່ໄປ`), 300);
        },
        onPlayerHealthChanged: payload => setHealth(payload.currentHealth),
        onPlayerDied: () =>
        {
            // Dying costs half the carried Materials, then the player wakes up healed in the village
            const result = returnToVillageUseCase('death', entities.backpack);
            setBackpackRevision(r => r + 1);
            autoSaveGame();

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
        },
        onBossDamaged: payload =>
        {
            setBossHp(payload.currentHp);
            setBossMaxHp(payload.maxHp);
        },
        onBossDefeated: () => setBossHp(0),
        onGamePaused: () => setIsGamePaused(true),
        onGameResumed: () => setIsGamePaused(false),
        onOpenStageMap: () => setIsStageMapOpen(true),
        onWeaponChanged: weaponId =>
        {
            setEquippedWeaponId(weaponId);
            autoSaveGame();
        },
        onOpenLibrary: bookId =>
        {
            // The Library building opens the bookstore
            setActiveReaderBookId(bookId);
            setActiveReaderPageNumber(undefined);
            setTextbookModalMode('library-store');
            setIsLibraryOpen(true);
        },
        onOpenAcademy: bookId =>
        {
            if (bookId) setActiveExamBookId(bookId);
            setIsAcademyOpen(true);
        },
        onOpenWorkshop: () => setIsWorkshopOpen(true),
        onOpenForge: () => setIsForgeOpen(true),
        onOpenBackpack: () => setIsBackpackOpen(true),
        onOpenGateRepair: (gateId, requirements) =>
        {
            if (gateId) setActiveGateId(gateId);
            setActiveGateRequirements(requirements);
            setIsGateRepairOpen(true);
        },
        onOpenWaypoint: name =>
        {
            if (name) setWaypointName(name);
            setIsWaypointOpen(true);
        },
        onOpenQuizFinisher: () => setIsQuizFinisherOpen(true),
        onChangeLevel: levelKey => handleStartGame(levelKey),
        onBookExamPassed: () =>
        {
            setWalletBalance(entities.wallet.balance);
            setBackpackRevision(r => r + 1);
            autoSaveGame();
        },
        onDailyPracticeCompleted: () =>
        {
            setWalletBalance(entities.wallet.balance);
            autoSaveGame();
        },
        onBackpackItemUsed: () =>
        {
            setBackpackRevision(r => r + 1);
            autoSaveGame();
        },
        onBackpackChanged: () => setBackpackRevision(r => r + 1),
    });

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
                <TitleMenu
                    walletBalance={walletBalance}
                    hasProgress={hasProgress}
                    isBlocked={isSettingsOpen || isSkinModalOpen || isStageMapOpen || isStageSelectOpen}
                    onStartGame={handleStartGame}
                    onNewGame={handleClearAllData}
                    onOpenStageSelect={() => setIsStageMapOpen(true)}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onOpenSkinModal={openSkinModal}
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
                    autoSaveGame();
                }}
                onPageRead={() =>
                {
                    setBooksRevision(r => r + 1);
                    autoSaveGame();
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
                    autoSaveGame();
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
                    autoSaveGame();
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
                    autoSaveGame();
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
                    autoSaveGame();
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
                    autoSaveGame();
                }}
                onFail={() =>
                {
                    setIsQuizFinisherOpen(false);
                    EventBus.emit('quiz-finisher-failed');
                }}
            />

            <VirtualTouchControls
                visible={!isMainMenuOpen && !isGamePaused && !isDialogueOpen && !modals.isAnyModalOpen}
            />
        </div>
    );
}

export default App;
