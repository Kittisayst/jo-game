import { describe, expect, it } from 'vitest';
import { SkinManager, AVAILABLE_SKINS } from './Skin';

describe('SkinManager entity', () =>
{
    it('initializes with default cyber-blue skin', () =>
    {
        const manager = new SkinManager();
        expect(manager.activeSkinId).toBe('cyber-blue');
    });

    it('initializes with valid custom skin', () =>
    {
        const manager = new SkinManager('neon-ninja');
        expect(manager.activeSkinId).toBe('neon-ninja');
    });

    it('falls back to cyber-blue when initialized with invalid skin', () =>
    {
        const manager = new SkinManager('unknown-skin');
        expect(manager.activeSkinId).toBe('cyber-blue');
    });

    it('selects any known skin', () =>
    {
        const manager = new SkinManager();

        expect(manager.selectSkin('golden-runner')).toBe(true);
        expect(manager.activeSkinId).toBe('golden-runner');
    });

    it('refuses to select non-existent skin', () =>
    {
        const manager = new SkinManager();

        expect(manager.selectSkin('bogus-skin')).toBe(false);
        expect(manager.activeSkinId).toBe('cyber-blue');
    });

    it('forceEquip also only accepts known skins', () =>
    {
        const manager = new SkinManager();

        expect(manager.forceEquip('golden-runner')).toBe(true);
        expect(manager.forceEquip('bogus-skin')).toBe(false);
        expect(manager.activeSkinId).toBe('golden-runner');
    });

    it('provides all 4 predefined skins', () =>
    {
        expect(AVAILABLE_SKINS).toHaveLength(4);
        expect(AVAILABLE_SKINS.map(s => s.id)).toEqual([
            'cyber-blue',
            'neon-ninja',
            'cyber-knight',
            'golden-runner',
        ]);
    });
});
