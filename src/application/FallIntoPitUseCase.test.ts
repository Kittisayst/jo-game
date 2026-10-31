import { afterEach, describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Health } from '../domain/entities/Health';
import { fallIntoPitUseCase, PLAYER_FELL_EVENT } from './FallIntoPitUseCase';
import { PLAYER_DIED_EVENT } from './PlayerTakeDamageUseCase';

describe('Health.kill', () =>
{
    it('kills at once, through Armor and full hearts, once', () =>
    {
        const health = new Health();
        health.syncMaxArmor(3);
        expect(health.armor).toBe(3);
        expect(health.kill()).toBe(true);
        expect(health.isDead).toBe(true);
        expect(health.armor).toBe(0);
        expect(health.kill()).toBe(false);
    });
});

describe('fallIntoPitUseCase', () =>
{
    const events: string[] = [];
    const onFell = () => events.push('fell');
    const onDied = () => events.push('died');
    afterEach(() =>
    {
        DomainEvents.off(PLAYER_FELL_EVENT, onFell);
        DomainEvents.off(PLAYER_DIED_EVENT, onDied);
    });

    it('is death at once, with Armor, and says the hero fell and died', () =>
    {
        events.length = 0;
        DomainEvents.on(PLAYER_FELL_EVENT, onFell);
        DomainEvents.on(PLAYER_DIED_EVENT, onDied);
        const health = new Health(6, 6);
        health.syncMaxArmor(4);

        expect(fallIntoPitUseCase(health)).toBe(true);
        expect(health.isDead).toBe(true);
        expect(health.current).toBe(0);
        expect(events).toEqual(['fell', 'died']);
    });

    it('does nothing for a hero that is dead already', () =>
    {
        events.length = 0;
        DomainEvents.on(PLAYER_FELL_EVENT, onFell);
        DomainEvents.on(PLAYER_DIED_EVENT, onDied);
        const health = new Health();
        health.kill();
        expect(fallIntoPitUseCase(health)).toBe(false);
        expect(events).toEqual([]);
    });
});
