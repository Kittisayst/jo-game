import { describe, expect, it } from 'vitest';
import {
    AttackCooldown,
    calculateDamage,
    calculateEffectiveCooldown,
} from './Combat';

describe('Combat domain entity & formulas', () =>
{
    it('initializes AttackCooldown as ready', () =>
    {
        const cd = new AttackCooldown();
        expect(cd.isReady).toBe(true);
        expect(cd.canAttack()).toBe(true);
        expect(cd.remainingMs).toBe(0);
    });

    it('triggers and ticks attack cooldowns until ready', () =>
    {
        const cd = new AttackCooldown();
        cd.trigger(300);
        expect(cd.isReady).toBe(false);
        expect(cd.canAttack()).toBe(false);
        expect(cd.remainingMs).toBe(300);

        cd.tick(100);
        expect(cd.remainingMs).toBe(200);
        expect(cd.isReady).toBe(false);

        cd.tick(250);
        expect(cd.remainingMs).toBe(0);
        expect(cd.isReady).toBe(true);
    });

    it('calculates damage with upgrade bonuses and crits', () =>
    {
        expect(calculateDamage(1, 0, false)).toBe(1);
        expect(calculateDamage(1, 2, false)).toBe(3);
        expect(calculateDamage(2, 1, true)).toBe(6);
    });

    it('calculates effective cooldown with reduction factors', () =>
    {
        expect(calculateEffectiveCooldown(400, 1.0)).toBe(400);
        expect(calculateEffectiveCooldown(400, 0.88)).toBe(352);
        expect(calculateEffectiveCooldown(400, 0.5)).toBe(200);
    });
});
