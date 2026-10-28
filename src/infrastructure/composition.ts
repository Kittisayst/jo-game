import { DialogueState } from '../domain/entities/Dialogue';
import { Settings } from '../domain/entities/Settings';
import { SkinManager } from '../domain/entities/Skin';
import { StageProgression } from '../domain/entities/StageProgression';
import { GamePauseState } from '../domain/entities/GamePauseState';
import { Wallet } from '../domain/entities/Wallet';
import { AttackCooldown } from '../domain/entities/Combat';
import { AchievementManager } from '../domain/entities/Achievement';
import { BookProgress } from '../domain/entities/Book';
import { Backpack } from '../domain/entities/Backpack';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { SpacedRepetitionSystem } from '../domain/entities/Quiz';
import { applySettingsUseCase } from '../application/UpdateSettingsUseCase';
import { localStorageSkinRepository } from './storage/LocalStorageSkinRepository';
import { localStorageSettingsRepository } from './storage/LocalStorageSettingsRepository';
import { localStorageStageProgressionRepository } from './storage/LocalStorageStageProgressionRepository';
import { saveManager } from './storage/SaveManager';
import './audio/SoundManager';

export const repositories = {
    skin: localStorageSkinRepository,
    settings: localStorageSettingsRepository,
    stageProgression: localStorageStageProgressionRepository,
};

const initialSave = saveManager.load();

// Initialize Books
const initialBooks: Record<string, BookProgress> = {};
if (initialSave.books)
{
    for (const [bId, snap] of Object.entries(initialSave.books))
    {
        initialBooks[bId] = BookProgress.fromSnapshot(snap);
    }
}
if (!initialBooks['book-ch1'])
{
    initialBooks['book-ch1'] = new BookProgress('book-ch1', false);
}

export const entities = {
    skinManager: new SkinManager(initialSave.activeSkinId),
    settings: new Settings(initialSave.settings.soundMuted, initialSave.settings.musicMuted),
    stageProgression: new StageProgression(initialSave.stageProgression.unlockedStages, initialSave.stageProgression.completedStages),
    pauseState: new GamePauseState(false),
    dialogueState: new DialogueState(),
    wallet: new Wallet(initialSave.wallet.balance),
    attackCooldown: new AttackCooldown(),
    achievementManager: new AchievementManager(initialSave.achievements),

    // Version 4 Knowledge Quest entities
    backpack: new Backpack(initialSave.backpack || []),
    equipment: EquipmentState.fromSnapshot(initialSave.equipment),
    spacedRepetition: SpacedRepetitionSystem.fromSnapshot(initialSave.practiceStats || {
        lastPracticeDate: '',
        practiceCountToday: 0,
        questionStats: {},
    }),
    books: initialBooks,
    repairedGates: new Set<string>(initialSave.repairedGates || []),
    forgeUnlocked: Boolean(initialSave.forgeUnlocked ?? initialBooks['book-ch1']?.examPassed ?? false),
};

// Push persisted audio preferences into SoundManager
applySettingsUseCase(entities.settings);
