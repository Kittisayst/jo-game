import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { SkinManager } from '../domain/entities/Skin';
import { SkinPort } from '../domain/ports';
import {
    selectSkinUseCase,
    SKIN_CHANGED_EVENT,
    SkinChangedPayload,
} from './SelectSkinUseCase';

class MockSkinRepository implements SkinPort
{
    saved: string | null = null;
    loadActiveSkinId () { return this.saved; }
    saveActiveSkinId (skinId: string) { this.saved = skinId; }
    clear () { this.saved = null; }
}

describe('selectSkinUseCase', () =>
{
    it('equips an owned skin, persists it and emits SKIN_CHANGED_EVENT', () =>
    {
        const manager = new SkinManager('cyber-blue', ['neon-ninja']);
        const repo = new MockSkinRepository();
        const listener = vi.fn();

        DomainEvents.on<SkinChangedPayload>(SKIN_CHANGED_EVENT, listener);
        const success = selectSkinUseCase(manager, 'neon-ninja', repo);
        DomainEvents.off<SkinChangedPayload>(SKIN_CHANGED_EVENT, listener);

        expect(success).toBe(true);
        expect(manager.activeSkinId).toBe('neon-ninja');
        expect(repo.saved).toBe('neon-ninja');
        expect(listener).toHaveBeenCalledWith({ skinId: 'neon-ninja' });
    });

    it('does not equip, persist or emit for a skin that is unknown or not bought', () =>
    {
        const manager = new SkinManager('cyber-blue');
        const repo = new MockSkinRepository();
        const listener = vi.fn();

        DomainEvents.on<SkinChangedPayload>(SKIN_CHANGED_EVENT, listener);
        const success = selectSkinUseCase(manager, 'bogus-skin', repo) || selectSkinUseCase(manager, 'golden-runner', repo);
        DomainEvents.off<SkinChangedPayload>(SKIN_CHANGED_EVENT, listener);

        expect(success).toBe(false);
        expect(manager.activeSkinId).toBe('cyber-blue');
        expect(repo.saved).toBeNull();
        expect(listener).not.toHaveBeenCalled();
    });
});
