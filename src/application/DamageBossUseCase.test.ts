import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Boss } from '../domain/entities/Boss';
import {
    damageBossUseCase,
    BOSS_DAMAGED_EVENT,
    BOSS_DEFEATED_EVENT,
    BossDamagedPayload,
    BossDefeatedPayload,
} from './DamageBossUseCase';

function listen ()
{
    const damageListener = vi.fn();
    const defeatedListener = vi.fn();
    DomainEvents.on<BossDamagedPayload>(BOSS_DAMAGED_EVENT, damageListener);
    DomainEvents.on<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, defeatedListener);
    return {
        damageListener,
        defeatedListener,
        stop: () =>
        {
            DomainEvents.off<BossDamagedPayload>(BOSS_DAMAGED_EVENT, damageListener);
            DomainEvents.off<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, defeatedListener);
        },
    };
}

describe('damageBossUseCase', () =>
{
    it('damages the boss and emits BOSS_DAMAGED_EVENT when not fatal', () =>
    {
        const boss = new Boss(3);
        const { damageListener, defeatedListener, stop } = listen();

        const isDefeated = damageBossUseCase(boss, 1);
        stop();

        expect(isDefeated).toBe(false);
        expect(boss.currentHp).toBe(2);
        expect(damageListener).toHaveBeenCalledWith({ currentHp: 2, maxHp: 3 });
        expect(defeatedListener).not.toHaveBeenCalled();
    });

    it('defeats the boss on a fatal blow and emits both events', () =>
    {
        const boss = new Boss(1);
        const { damageListener, defeatedListener, stop } = listen();

        const isDefeated = damageBossUseCase(boss, 1);
        stop();

        expect(isDefeated).toBe(true);
        expect(boss.currentHp).toBe(0);
        expect(boss.isDefeated).toBe(true);
        expect(damageListener).toHaveBeenCalledWith({ currentHp: 0, maxHp: 1 });
        expect(defeatedListener).toHaveBeenCalledWith({ maxHp: 1 });
    });

    it('does nothing when the boss is already defeated', () =>
    {
        const boss = new Boss(1);
        boss.takeDamage(1);
        const { damageListener, defeatedListener, stop } = listen();

        const isDefeated = damageBossUseCase(boss, 1);
        stop();

        expect(isDefeated).toBe(false);
        expect(damageListener).not.toHaveBeenCalled();
        expect(defeatedListener).not.toHaveBeenCalled();
    });
});
