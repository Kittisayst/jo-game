import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { GameStats } from '../domain/entities/GameStats';
import { Settings } from '../domain/entities/Settings';
import { SkinManager } from '../domain/entities/Skin';
import { resetSaveDataUseCase, SAVE_DATA_RESET_EVENT } from './ResetSaveDataUseCase';
import { SKIN_CHANGED_EVENT } from './SelectSkinUseCase';
import { SETTINGS_CHANGED_EVENT } from './UpdateSettingsUseCase';

describe('resetSaveDataUseCase', () =>
{
    it('resets entities, clears every port, and emits events', () =>
    {
        const gameStats = new GameStats(999, 12.3);
        const skinManager = new SkinManager('neon-ninja');
        const settings = new Settings(true, true);
        const ports = {
            gameStats: { load: vi.fn(), save: vi.fn(), clear: vi.fn() },
            skin: { loadActiveSkinId: vi.fn(), saveActiveSkinId: vi.fn(), clear: vi.fn() },
            settings: { load: vi.fn(), save: vi.fn(), clear: vi.fn() },
        };
        const onReset = vi.fn();
        const onSkin = vi.fn();
        const onSettings = vi.fn();
        DomainEvents.on(SAVE_DATA_RESET_EVENT, onReset);
        DomainEvents.on(SKIN_CHANGED_EVENT, onSkin);
        DomainEvents.on(SETTINGS_CHANGED_EVENT, onSettings);

        resetSaveDataUseCase({ gameStats, skinManager, settings }, ports);

        DomainEvents.off(SAVE_DATA_RESET_EVENT, onReset);
        DomainEvents.off(SKIN_CHANGED_EVENT, onSkin);
        DomainEvents.off(SETTINGS_CHANGED_EVENT, onSettings);

        expect(gameStats.highScore).toBe(0);
        expect(gameStats.bestTimeSeconds).toBeNull();
        expect(skinManager.activeSkinId).toBe('cyber-blue');
        expect(settings.isSoundMuted).toBe(false);
        expect(settings.isMusicMuted).toBe(false);
        expect(ports.gameStats.clear).toHaveBeenCalled();
        expect(ports.skin.clear).toHaveBeenCalled();
        expect(ports.settings.clear).toHaveBeenCalled();
        expect(onReset).toHaveBeenCalled();
        expect(onSkin).toHaveBeenCalledWith({ skinId: 'cyber-blue' });
        expect(onSettings).toHaveBeenCalledWith({ soundMuted: false, musicMuted: false });
    });
});
