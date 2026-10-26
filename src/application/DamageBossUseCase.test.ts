import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Boss } from '../domain/entities/Boss';
import { Score } from '../domain/entities/Score';
import {
    damageBossUseCase,
    BOSS_DAMAGED_EVENT,
    BOSS_DEFEATED_EVENT,
    BossDamagedPayload,
    BossDefeatedPayload,
} from './DamageBossUseCase';

describe('damageBossUseCase', () =>
{
    it('damages the boss and emits BOSS_DAMAGED_EVENT when not fatal', () =>
    {
        const boss = new Boss(3, 1000);
        const score = new Score(200);

        const damageListener = vi.fn();
        const defeatedListener = vi.fn();

        DomainEvents.on<BossDamagedPayload>(BOSS_DAMAGED_EVENT, damageListener);
        DomainEvents.on<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, defeatedListener);

        const isDefeated = damageBossUseCase(boss, score, 1);

        DomainEvents.off<BossDamagedPayload>(BOSS_DAMAGED_EVENT, damageListener);
        DomainEvents.off<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, defeatedListener);

        expect(isDefeated).toBe(false);
        expect(boss.currentHp).toBe(2);
        expect(score.value).toBe(200);
        expect(damageListener).toHaveBeenCalledWith({ currentHp: 2, maxHp: 3 });
        expect(defeatedListener).not.toHaveBeenCalled();
    });

    it('defeats the boss on fatal blow, adds score, and emits both events', () =>
    {
        const boss = new Boss(1, 1000);
        const score = new Score(200);

        const damageListener = vi.fn();
        const defeatedListener = vi.fn();

        DomainEvents.on<BossDamagedPayload>(BOSS_DAMAGED_EVENT, damageListener);
        DomainEvents.on<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, defeatedListener);

        const isDefeated = damageBossUseCase(boss, score, 1);

        DomainEvents.off<BossDamagedPayload>(BOSS_DAMAGED_EVENT, damageListener);
        DomainEvents.off<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, defeatedListener);

        expect(isDefeated).toBe(true);
        expect(boss.currentHp).toBe(0);
        expect(boss.isDefeated).toBe(true);
        expect(score.value).toBe(1200);
        expect(damageListener).toHaveBeenCalledWith({ currentHp: 0, maxHp: 1 });
        expect(defeatedListener).toHaveBeenCalledWith({ points: 1000, totalScore: 1200 });
    });

    it('does not emit events if boss was already defeated', () =>
    {
        const boss = new Boss(1);
        const score = new Score(0);
        boss.takeDamage(1);

        const damageListener = vi.fn();
        const defeatedListener = vi.fn();

        DomainEvents.on<BossDamagedPayload>(BOSS_DAMAGED_EVENT, damageListener);
        DomainEvents.on<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, defeatedListener);

        const isDefeated = damageBossUseCase(boss, score, 1);

        DomainEvents.off<BossDamagedPayload>(BOSS_DAMAGED_EVENT, damageListener);
        DomainEvents.off<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, defeatedListener);

        expect(isDefeated).toBe(false);
        expect(damageListener).not.toHaveBeenCalled();
        expect(defeatedListener).not.toHaveBeenCalled();
    });
});
