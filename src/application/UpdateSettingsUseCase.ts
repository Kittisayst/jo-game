import { DomainEvents } from '../domain/DomainEvents';
import { Settings } from '../domain/entities/Settings';
import { SettingsPort } from '../domain/ports';

export const SETTINGS_CHANGED_EVENT = 'settings-changed';

export interface SettingsChangedPayload
{
    soundMuted: boolean;
    musicMuted: boolean;
}

function persistAndEmit (settings: Settings, repository: SettingsPort): SettingsChangedPayload
{
    const payload: SettingsChangedPayload = {
        soundMuted: settings.isSoundMuted,
        musicMuted: settings.isMusicMuted,
    };
    repository.save(payload);
    DomainEvents.emit<SettingsChangedPayload>(SETTINGS_CHANGED_EVENT, payload);
    return payload;
}

/**
 * Toggles sound effects. `Settings` is the single source of truth; audio infrastructure
 * reacts to SETTINGS_CHANGED_EVENT. See "Application layer" in CONTEXT.md.
 */
export function toggleSoundUseCase (settings: Settings, repository: SettingsPort): SettingsChangedPayload
{
    settings.toggleSound();
    return persistAndEmit(settings, repository);
}

/** Toggles background music. */
export function toggleMusicUseCase (settings: Settings, repository: SettingsPort): SettingsChangedPayload
{
    settings.toggleMusic();
    return persistAndEmit(settings, repository);
}

/** Re-broadcasts current settings (e.g. at startup) so listeners can sync. */
export function applySettingsUseCase (settings: Settings): SettingsChangedPayload
{
    const payload: SettingsChangedPayload = {
        soundMuted: settings.isSoundMuted,
        musicMuted: settings.isMusicMuted,
    };
    DomainEvents.emit<SettingsChangedPayload>(SETTINGS_CHANGED_EVENT, payload);
    return payload;
}
