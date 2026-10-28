import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Backpack } from '../domain/entities/Backpack';
import { Health } from '../domain/entities/Health';
import { consumeItemUseCase, PLAYER_HEALED_EVENT, PlayerHealedPayload } from './ConsumeItemUseCase';

function backpackWithPotions (count: number): Backpack
{
    const backpack = new Backpack();
    backpack.addItem('herb-potion', count);
    return backpack;
}

describe('consumeItemUseCase', () =>
{
    it('heals one heart, spends one potion and emits PLAYER_HEALED_EVENT', () =>
    {
        const backpack = backpackWithPotions(2);
        const health = new Health(1, 3);
        const listener = vi.fn();

        DomainEvents.on<PlayerHealedPayload>(PLAYER_HEALED_EVENT, listener);
        const result = consumeItemUseCase(backpack, health, 'herb-potion', { healAmount: 1 });
        DomainEvents.off<PlayerHealedPayload>(PLAYER_HEALED_EVENT, listener);

        expect(result).toEqual({ success: true, healed: 1 });
        expect(health.current).toBe(2);
        expect(backpack.getItemCount('herb-potion')).toBe(1);
        expect(listener).toHaveBeenCalledWith({ currentHealth: 2, maxHealth: 3 });
    });

    it('never heals past the maximum', () =>
    {
        const health = new Health(2, 3);

        const result = consumeItemUseCase(backpackWithPotions(1), health, 'herb-potion', { healAmount: 5 });

        expect(result).toEqual({ success: true, healed: 1 });
        expect(health.current).toBe(3);
    });

    it('keeps the potion when health is already full', () =>
    {
        const backpack = backpackWithPotions(1);
        const listener = vi.fn();

        DomainEvents.on(PLAYER_HEALED_EVENT, listener);
        const result = consumeItemUseCase(backpack, new Health(3, 3), 'herb-potion', { healAmount: 1 });
        DomainEvents.off(PLAYER_HEALED_EVENT, listener);

        expect(result).toEqual({ success: false, reason: 'already_full' });
        expect(backpack.getItemCount('herb-potion')).toBe(1);
        expect(listener).not.toHaveBeenCalled();
    });

    it('fails when the item is not carried, has no effect, or the player is dead', () =>
    {
        const health = new Health(1, 3);

        expect(consumeItemUseCase(new Backpack(), health, 'herb-potion', { healAmount: 1 }))
            .toEqual({ success: false, reason: 'not_in_backpack' });

        const kit = new Backpack();
        kit.addItem('repair-kit', 1);
        expect(consumeItemUseCase(kit, health, 'repair-kit', {}))
            .toEqual({ success: false, reason: 'no_effect' });
        expect(kit.getItemCount('repair-kit')).toBe(1);

        const dead = new Health(0, 3);
        expect(consumeItemUseCase(backpackWithPotions(1), dead, 'herb-potion', { healAmount: 1 }))
            .toEqual({ success: false, reason: 'dead' });
    });
});
