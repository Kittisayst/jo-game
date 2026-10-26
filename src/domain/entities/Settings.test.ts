import { describe, expect, it } from 'vitest';
import { Settings } from './Settings';

describe('Settings entity', () =>
{
    it('initializes with default unmuted values', () =>
    {
        const settings = new Settings();
        expect(settings.isSoundMuted).toBe(false);
        expect(settings.isMusicMuted).toBe(false);
    });

    it('initializes with custom values', () =>
    {
        const settings = new Settings(true, true);
        expect(settings.isSoundMuted).toBe(true);
        expect(settings.isMusicMuted).toBe(true);
    });

    it('toggles sound mute state', () =>
    {
        const settings = new Settings();
        expect(settings.toggleSound()).toBe(true);
        expect(settings.isSoundMuted).toBe(true);
        expect(settings.toggleSound()).toBe(false);
        expect(settings.isSoundMuted).toBe(false);
    });

    it('toggles music mute state', () =>
    {
        const settings = new Settings();
        expect(settings.toggleMusic()).toBe(true);
        expect(settings.isMusicMuted).toBe(true);
        expect(settings.toggleMusic()).toBe(false);
        expect(settings.isMusicMuted).toBe(false);
    });

    it('explicitly sets mute states', () =>
    {
        const settings = new Settings();
        settings.setSoundMuted(true);
        settings.setMusicMuted(true);
        expect(settings.isSoundMuted).toBe(true);
        expect(settings.isMusicMuted).toBe(true);
    });

    it('resets settings to default', () =>
    {
        const settings = new Settings(true, true);
        settings.reset();
        expect(settings.isSoundMuted).toBe(false);
        expect(settings.isMusicMuted).toBe(false);
    });
});
