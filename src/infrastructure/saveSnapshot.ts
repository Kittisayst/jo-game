/**
 * Moves the live game state (the `entities` from composition) in and out of a
 * save snapshot. React and Phaser both call this; none of it touches React state,
 * so callers refresh their own state from `entities` afterwards.
 */

import { applySettingsUseCase } from '../application/UpdateSettingsUseCase';
import { resetSaveDataUseCase } from '../application/ResetSaveDataUseCase';
import { BookProgress } from '../domain/entities/Book';
import { EquipmentState } from '../domain/entities/EquipmentState';
import { SpacedRepetitionSystem } from '../domain/entities/Quiz';
import {
    createDefaultSaveSnapshot,
    CURRENT_SAVE_VERSION,
    SaveGameSnapshot,
} from '../domain/entities/SaveData';
import { entities, repositories } from './composition';
import { saveManager, SaveSlotId } from './storage/SaveManager';

export function createCurrentSnapshot (slotId?: SaveSlotId): SaveGameSnapshot
{
    const books: SaveGameSnapshot['books'] = {};
    for (const [key, book] of Object.entries(entities.books))
    {
        books[key] = book.toSnapshot();
    }

    return {
        version: CURRENT_SAVE_VERSION,
        timestamp: Date.now(),
        slotId: slotId ?? saveManager.getActiveSlot(),
        activeSkinId: entities.skinManager.activeSkinId,
        ownedSkins: entities.skinManager.ownedSkinIds,
        settings: {
            soundMuted: entities.settings.isSoundMuted,
            musicMuted: entities.settings.isMusicMuted,
        },
        stageProgression: {
            unlockedStages: entities.stageProgression.unlockedStages,
            completedStages: entities.stageProgression.completedStages,
        },
        wallet: {
            balance: entities.wallet.balance,
        },
        achievements: entities.achievementManager.serialize(),
        books,
        backpack: entities.backpack.toSnapshot(),
        equipment: entities.equipment.toSnapshot(),
        practiceStats: entities.spacedRepetition.toSnapshot(),
        repairedGates: Array.from(entities.repairedGates),
        forgeUnlocked: entities.forgeUnlocked,
    };
}

/** Replaces the live game state (and the per-topic stores) with a loaded snapshot. */
export function restoreEntitiesFromSnapshot (snap: SaveGameSnapshot): void
{
    const { skinManager, settings, stageProgression } = entities;

    skinManager.restore(snap.activeSkinId, snap.ownedSkins);
    repositories.skin.saveActiveSkinId(skinManager.activeSkinId);

    settings.setSoundMuted(snap.settings.soundMuted);
    settings.setMusicMuted(snap.settings.musicMuted);
    repositories.settings.save({ soundMuted: snap.settings.soundMuted, musicMuted: snap.settings.musicMuted });
    applySettingsUseCase(settings);

    stageProgression.loadFrom(snap.stageProgression.unlockedStages, snap.stageProgression.completedStages);
    repositories.stageProgression.save(stageProgression);

    if (snap.wallet)
    {
        entities.wallet.setBalance(snap.wallet.balance);
    }
    if (snap.achievements)
    {
        entities.achievementManager.loadFrom(snap.achievements);
    }

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
    if (snap.backpack)
    {
        entities.backpack.loadFromSnapshot(snap.backpack);
    }
    if (snap.equipment)
    {
        entities.equipment = EquipmentState.fromSnapshot(snap.equipment);
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
}

/** Wipes the active slot and puts every entity back to a brand-new player. */
export function resetEntitiesToNewGame (): void
{
    resetSaveDataUseCase(
        {
            skinManager: entities.skinManager,
            settings: entities.settings,
            stageProgression: entities.stageProgression,
        },
        repositories
    );
    saveManager.clearSlot(saveManager.getActiveSlot());
    entities.achievementManager.reset();
    restoreEntitiesFromSnapshot(createDefaultSaveSnapshot(saveManager.getActiveSlot()));
}
