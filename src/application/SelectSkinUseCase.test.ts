import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { SkinManager } from '../domain/entities/Skin';
import {
    selectSkinUseCase,
    SKIN_CHANGED_EVENT,
    SkinChangedPayload,
} from './SelectSkinUseCase';

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
});
