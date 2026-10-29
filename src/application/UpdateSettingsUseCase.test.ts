import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Settings } from '../domain/entities/Settings';
import { SettingsData, SettingsPort } from '../domain/ports';
import {
    applySettingsUseCase,
    SETTINGS_CHANGED_EVENT,
    SettingsChangedPayload,
    toggleMusicUseCase,
    toggleSoundUseCase,
} from './UpdateSettingsUseCase';

class MockSettingsRepository implements SettingsPort
{
    saved: SettingsData | null = null;
    load () { return this.saved ?? { soundMuted: false, musicMuted: false }; }
    save (data: SettingsData) { this.saved = { ...data }; }
    clear () { this.saved = null; }
}

describe('UpdateSettingsUseCase', () =>
{
    it('toggleSoundUseCase flips sound, persists, and emits', () =>
    {
        const settings = new Settings(false, false);
        const repo = new MockSettingsRepository();
        const listener = vi.fn();
        DomainEvents.on<SettingsChangedPayload>(SETTINGS_CHANGED_EVENT, listener);

        const result = toggleSoundUseCase(settings, repo);

        DomainEvents.off<SettingsChangedPayload>(SETTINGS_CHANGED_EVENT, listener);
        expect(result).toEqual({ soundMuted: true, musicMuted: false });
        expect(repo.saved).toEqual({ soundMuted: true, musicMuted: false });
        expect(listener).toHaveBeenCalledWith({ soundMuted: true, musicMuted: false });
    });

    it('toggleMusicUseCase flips music only', () =>
    {
        const settings = new Settings(true, false);
        const repo = new MockSettingsRepository();

        const result = toggleMusicUseCase(settings, repo);

        expect(result).toEqual({ soundMuted: true, musicMuted: true });
        expect(repo.saved).toEqual({ soundMuted: true, musicMuted: true });
    });

    it('applySettingsUseCase emits current state without persisting', () =>
    {
        const settings = new Settings(false, true);
        const listener = vi.fn();
        DomainEvents.on<SettingsChangedPayload>(SETTINGS_CHANGED_EVENT, listener);

        applySettingsUseCase(settings);

        DomainEvents.off<SettingsChangedPayload>(SETTINGS_CHANGED_EVENT, listener);
        expect(listener).toHaveBeenCalledWith({ soundMuted: false, musicMuted: true });
    });
});
