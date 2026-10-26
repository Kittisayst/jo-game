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

    it('correctly checks if a skin is unlocked based on score', () =>
    {
        const manager = new SkinManager();
        expect(manager.isSkinUnlocked('cyber-blue', 0)).toBe(true);
        expect(manager.isSkinUnlocked('neon-ninja', 200)).toBe(false);
        expect(manager.isSkinUnlocked('neon-ninja', 300)).toBe(true);
        expect(manager.isSkinUnlocked('golden-runner', 1400)).toBe(false);
        expect(manager.isSkinUnlocked('golden-runner', 1500)).toBe(true);
        expect(manager.isSkinUnlocked('unknown-skin', 9999)).toBe(false);
    });

    it('selects skin if unlocked', () =>
    {
        const manager = new SkinManager();
        const success = manager.selectSkin('neon-ninja', 500);

        expect(success).toBe(true);
        expect(manager.activeSkinId).toBe('neon-ninja');
    });

    it('refuses to select skin if score is insufficient', () =>
    {
        const manager = new SkinManager();
        const success = manager.selectSkin('golden-runner', 500);

        expect(success).toBe(false);
        expect(manager.activeSkinId).toBe('cyber-blue');
    });

    it('refuses to select non-existent skin', () =>
    {
        const manager = new SkinManager();
        const success = manager.selectSkin('bogus-skin', 9999);

        expect(success).toBe(false);
        expect(manager.activeSkinId).toBe('cyber-blue');
    });

    it('allows forceEquip for valid skin regardless of score', () =>
    {
        const manager = new SkinManager();
        const success = manager.forceEquip('golden-runner');

        expect(success).toBe(true);
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
