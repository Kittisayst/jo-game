import { describe, expect, it } from 'vitest';
import { SkinManager, AVAILABLE_SKINS } from './Skin';

describe('SkinManager entity', () =>
{
    it('initializes with the free default cyber-blue skin owned', () =>
    {
        const manager = new SkinManager();
        expect(manager.activeSkinId).toBe('cyber-blue');
        expect(manager.ownedSkinIds).toEqual(['cyber-blue']);
        expect(manager.isOwned('cyber-blue')).toBe(true);
        expect(manager.isOwned('neon-ninja')).toBe(false);
    });

    it('restores owned skins and an owned active skin', () =>
    {
        const manager = new SkinManager('neon-ninja', ['neon-ninja']);
        expect(manager.activeSkinId).toBe('neon-ninja');
        expect(manager.ownedSkinIds).toEqual(['cyber-blue', 'neon-ninja']);
    });

    it('falls back to cyber-blue when the active skin is unknown or not owned', () =>
    {
        expect(new SkinManager('unknown-skin').activeSkinId).toBe('cyber-blue');
        expect(new SkinManager('golden-runner', []).activeSkinId).toBe('cyber-blue');
    });

    it('ignores unknown skin ids in the owned list', () =>
    {
        const manager = new SkinManager('cyber-blue', ['bogus', 'neon-ninja']);
        expect(manager.ownedSkinIds).toEqual(['cyber-blue', 'neon-ninja']);
    });

    it('unlocks a skin once and cannot select a skin that is not owned', () =>
    {
        const manager = new SkinManager();

        expect(manager.selectSkin('golden-runner')).toBe(false);
        expect(manager.activeSkinId).toBe('cyber-blue');

        expect(manager.unlock('golden-runner')).toBe(true);
        expect(manager.unlock('golden-runner')).toBe(false);
        expect(manager.unlock('bogus-skin')).toBe(false);

        expect(manager.selectSkin('golden-runner')).toBe(true);
        expect(manager.activeSkinId).toBe('golden-runner');
    });

    it('reset gives back only the free skin', () =>
    {
        const manager = new SkinManager('neon-ninja', ['neon-ninja']);
        manager.reset();

        expect(manager.activeSkinId).toBe('cyber-blue');
        expect(manager.ownedSkinIds).toEqual(['cyber-blue']);
    });

    it('prices every skin except the free default', () =>
    {
        expect(AVAILABLE_SKINS).toHaveLength(4);
        expect(AVAILABLE_SKINS.map(s => s.id)).toEqual([
            'cyber-blue',
            'neon-ninja',
            'cyber-knight',
            'golden-runner',
        ]);
        expect(AVAILABLE_SKINS[0].price).toBe(0);
        expect(AVAILABLE_SKINS.slice(1).every(s => s.price > 0)).toBe(true);
    });

    it('restore swaps in a loaded save', () =>
    {
        const manager = new SkinManager('neon-ninja', ['neon-ninja']);

        manager.restore('golden-runner', ['golden-runner']);

        expect(manager.ownedSkinIds).toEqual(['cyber-blue', 'golden-runner']);
        expect(manager.activeSkinId).toBe('golden-runner');

        manager.restore('neon-ninja', []);
        expect(manager.activeSkinId).toBe('cyber-blue');
    });
});
