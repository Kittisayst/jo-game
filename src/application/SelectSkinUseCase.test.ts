import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { SkinManager } from '../domain/entities/Skin';
import { SkinPort } from '../domain/ports';
import {
    selectSkinUseCase,
    skinUnlockScore,
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
    it('selects skin and emits SKIN_CHANGED_EVENT when unlocked', () =>
    {
        const manager = new SkinManager('cyber-blue');
        const listener = vi.fn();

        DomainEvents.on<SkinChangedPayload>(SKIN_CHANGED_EVENT, listener);

        const success = selectSkinUseCase(manager, 'neon-ninja', 500);

        DomainEvents.off<SkinChangedPayload>(SKIN_CHANGED_EVENT, listener);

        expect(success).toBe(true);
        expect(manager.activeSkinId).toBe('neon-ninja');
        expect(listener).toHaveBeenCalledWith({ skinId: 'neon-ninja' });
    });

    it('does not select skin or emit event when score is insufficient', () =>
    {
        const manager = new SkinManager('cyber-blue');
        const listener = vi.fn();

        DomainEvents.on<SkinChangedPayload>(SKIN_CHANGED_EVENT, listener);

        const success = selectSkinUseCase(manager, 'golden-runner', 200);

        DomainEvents.off<SkinChangedPayload>(SKIN_CHANGED_EVENT, listener);

        expect(success).toBe(false);
        expect(manager.activeSkinId).toBe('cyber-blue');
        expect(listener).not.toHaveBeenCalled();
    });

    it('unlocks using the saved high score when the current run score is low', () =>
    {
        const manager = new SkinManager('cyber-blue');
        const repo = new MockSkinRepository();

        const success = selectSkinUseCase(manager, 'cyber-knight', 50, 900, repo);

        expect(success).toBe(true);
        expect(repo.saved).toBe('cyber-knight');
    });

    it('does not persist when selection fails', () =>
    {
        const manager = new SkinManager('cyber-blue');
        const repo = new MockSkinRepository();

        selectSkinUseCase(manager, 'golden-runner', 10, 10, repo);

        expect(repo.saved).toBeNull();
    });

    it('skinUnlockScore returns the better of current and high score', () =>
    {
        expect(skinUnlockScore(100, 400)).toBe(400);
        expect(skinUnlockScore(700, 400)).toBe(700);
    });
});
