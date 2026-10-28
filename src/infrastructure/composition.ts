import { GameState } from '../domain/entities/GameState';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
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

/** Filled from `items.json` at startup (see main.tsx) before anything reads it. */
const itemCatalog = new ItemCatalog();

/** The one live game state. Loading a save changes it in place, so references stay valid. */
export const entities = new GameState(itemCatalog);
entities.loadFromSnapshot(saveManager.load());

// Push persisted audio preferences into SoundManager
applySettingsUseCase(entities.settings);
