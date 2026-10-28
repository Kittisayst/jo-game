/**
 * Connects the live game state (`entities`) to the save use cases with the concrete
 * stores. React and Phaser call these; none of it touches React state, so callers refresh
 * their own state from `entities` afterwards.
 */

import {
    createSaveSnapshotUseCase,
    resetGameUseCase,
    restoreSaveSnapshotUseCase,
} from '../application/SaveSnapshotUseCases';
import { SaveGameSnapshot } from '../domain/entities/SaveData';
import { entities, repositories } from './composition';
import { saveManager, SaveSlotId } from './storage/SaveManager';

export function createCurrentSnapshot (slotId?: SaveSlotId): SaveGameSnapshot
{
    return createSaveSnapshotUseCase(entities, saveManager, slotId);
}

/** Saves the current progress into the autosave slot (throttled by the SaveManager). */
export function autoSaveGame (): void
{
    saveManager.autoSave(createCurrentSnapshot());
}

/** Replaces the live game state, and the per-topic stores, with a loaded snapshot. */
export function restoreEntitiesFromSnapshot (snapshot: SaveGameSnapshot): void
{
    restoreSaveSnapshotUseCase(entities, snapshot, repositories);
}

/** Wipes the active slot and puts the game state back to a brand-new player. */
export function resetEntitiesToNewGame (): void
{
    resetGameUseCase(entities, repositories, saveManager);
}
