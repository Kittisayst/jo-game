import type { WornArmorContext } from '../application/ArmorUseCases';
import { GameState } from '../domain/entities/GameState';
import { ItemCatalog } from '../domain/entities/ItemCatalog';
import { applySettingsUseCase } from '../application/UpdateSettingsUseCase';
import { localStorageSkinRepository } from './storage/LocalStorageSkinRepository';
import { localStorageSettingsRepository } from './storage/LocalStorageSettingsRepository';
import { localStorageStageProgressionRepository } from './storage/LocalStorageStageProgressionRepository';
import { saveManager } from './storage/SaveManager';
import { MathRandom, SystemClock } from './SystemClock';
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

/** Real time and chance, for what grows over time and what drops by chance. */
export const clock = new SystemClock();
export const random = new MathRandom();

/** What the Armor use cases need, built once from the live state (its members never get replaced). */
export const armorContext: WornArmorContext = {
    equipment: entities.equipment,
    health: entities.health,
    catalog: entities.itemCatalog,
};

// Development only: lets the browser tests read the live state. A test that `import()`s this file itself can
// get a second copy of the module (and of the state) if it does so while the app is still loading.
if (import.meta.env.DEV)
{
    const dev = window as unknown as { __entities: GameState; __advanceClock: (ms: number) => void };
    dev.__entities = entities;
    // Lets a test make a plant grow without waiting for it
    dev.__advanceClock = (ms: number) => clock.advance(ms);
}

// Push persisted audio preferences into SoundManager
applySettingsUseCase(entities.settings);
