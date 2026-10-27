import { GameStats } from '../domain/entities/GameStats';
import { Settings } from '../domain/entities/Settings';
import { SkinManager } from '../domain/entities/Skin';
import { StageProgression } from '../domain/entities/StageProgression';
import { GamePauseState } from '../domain/entities/GamePauseState';
import { applySettingsUseCase } from '../application/UpdateSettingsUseCase';
import { localStorageGameStatsRepository } from './storage/LocalStorageGameStatsRepository';
import { localStorageSkinRepository } from './storage/LocalStorageSkinRepository';
import { localStorageSettingsRepository } from './storage/LocalStorageSettingsRepository';
import { localStorageStageProgressionRepository } from './storage/LocalStorageStageProgressionRepository';
import './audio/SoundManager';

/**
 * Composition Root — the single place that wires concrete repositories (infrastructure)
 * to long-lived domain entities. UI and scenes import from here instead of calling
 * `new Entity()` or `localStorage` themselves. See "Port" in CONTEXT.md.
 */
export const repositories = {
    gameStats: localStorageGameStatsRepository,
    skin: localStorageSkinRepository,
    settings: localStorageSettingsRepository,
    stageProgression: localStorageStageProgressionRepository,
};

const savedStats = repositories.gameStats.load();
const savedSettings = repositories.settings.load();
const savedProgression = repositories.stageProgression.load();

export const entities = {
    gameStats: new GameStats(savedStats.highScore, savedStats.bestTimeSeconds),
    skinManager: new SkinManager(repositories.skin.loadActiveSkinId() ?? undefined),
    settings: new Settings(savedSettings.soundMuted, savedSettings.musicMuted),
    stageProgression: new StageProgression(savedProgression.unlockedStages, savedProgression.completedStages),
    pauseState: new GamePauseState(false),
};

// Push persisted audio preferences into SoundManager (it listens for SETTINGS_CHANGED_EVENT).
applySettingsUseCase(entities.settings);
