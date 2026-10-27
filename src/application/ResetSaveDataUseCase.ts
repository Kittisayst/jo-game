import { DomainEvents } from '../domain/DomainEvents';
import { GameStats } from '../domain/entities/GameStats';
import { Settings } from '../domain/entities/Settings';
import { SkinManager } from '../domain/entities/Skin';
import { GameStatsPort, SettingsPort, SkinPort } from '../domain/ports';
import { SETTINGS_CHANGED_EVENT, SettingsChangedPayload } from './UpdateSettingsUseCase';
import { SKIN_CHANGED_EVENT, SkinChangedPayload } from './SelectSkinUseCase';

export const SAVE_DATA_RESET_EVENT = 'save-data-reset';

export const DEFAULT_SKIN_ID = 'cyber-blue';

export interface ResetSaveDataEntities
{
    gameStats: GameStats;
    skinManager: SkinManager;
    settings: Settings;
}

export interface ResetSaveDataPorts
{
    gameStats: GameStatsPort;
    skin: SkinPort;
    settings: SettingsPort;
}

/**
 * Wipes only this game's saved data (stats, skin, settings) through each port —
 * never the whole origin's storage — and resets the in-memory entities.
 * See "Port" in CONTEXT.md.
 */
export function resetSaveDataUseCase (entities: ResetSaveDataEntities, ports: ResetSaveDataPorts): void
{
    entities.gameStats.reset();
    entities.skinManager.forceEquip(DEFAULT_SKIN_ID);
    entities.settings.reset();

    ports.gameStats.clear();
    ports.skin.clear();
    ports.settings.clear();

    DomainEvents.emit<SkinChangedPayload>(SKIN_CHANGED_EVENT, { skinId: entities.skinManager.activeSkinId });
    DomainEvents.emit<SettingsChangedPayload>(SETTINGS_CHANGED_EVENT, {
        soundMuted: entities.settings.isSoundMuted,
        musicMuted: entities.settings.isMusicMuted,
    });
    DomainEvents.emit(SAVE_DATA_RESET_EVENT, {});
}
