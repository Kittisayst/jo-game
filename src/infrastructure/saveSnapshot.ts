/**
 * Connects the live game state (`entities`) to the save use cases with the concrete
 * stores. React and Phaser call these; none of it touches React state, so callers refresh
 * their own state from `entities` afterwards.
 */

import { syncSkills } from './skills';
import {
    createSaveSnapshotUseCase,
    resetGameUseCase,
    restoreSaveSnapshotUseCase,
} from '../application/SaveSnapshotUseCases';
import { SaveGameSnapshot } from '../domain/entities/SaveData';
import { createTrailingThrottle } from '../domain/utils/trailingThrottle';
import { entities, repositories } from './composition';
import { saveManager, SaveSlotId } from './storage/SaveManager';

export function createCurrentSnapshot (slotId?: SaveSlotId): SaveGameSnapshot
{
    return createSaveSnapshotUseCase(entities, saveManager, slotId);
}

/** Minimum time between two disk writes of the autosave. */
const AUTOSAVE_INTERVAL_MS = 3000;

// The snapshot is taken when the write actually happens, so a request that had to wait
// still saves the latest state (buy a skin, then equip it a second later: both are kept).
const autoSaveThrottle = createTrailingThrottle(
    () => saveManager.autoSave(createCurrentSnapshot()),
    AUTOSAVE_INTERVAL_MS
);

/** Saves the current progress. Writes at most every 3 seconds but never drops the last change. */
export function autoSaveGame (): void
{
    autoSaveThrottle.trigger();
}

/** Writes any save that is still waiting, e.g. because the player is leaving the page. */
export function flushPendingAutoSave (): void
{
    autoSaveThrottle.flush();
}

if (typeof window !== 'undefined')
{
    window.addEventListener('pagehide', flushPendingAutoSave);
    document.addEventListener('visibilitychange', () =>
    {
        if (document.visibilityState === 'hidden') flushPendingAutoSave();
    });
}

/** Replaces the live game state, and the per-topic stores, with a loaded snapshot. */
export function restoreEntitiesFromSnapshot (snapshot: SaveGameSnapshot): void
{
    restoreSaveSnapshotUseCase(entities, snapshot, repositories);
    // A save made before skills existed still teaches the skills of the Textbooks already passed
    syncSkills();
}

/** Wipes the active slot and puts the game state back to a brand-new player. */
export function resetEntitiesToNewGame (): void
{
    resetGameUseCase(entities, repositories, saveManager);
}
