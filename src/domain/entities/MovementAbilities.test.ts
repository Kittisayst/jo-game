import { describe, expect, it } from 'vitest';
import { MovementAbilities } from './MovementAbilities';

describe('MovementAbilities', () =>
{
    it('has the Dash from the start and nothing else', () =>
    {
        const abilities = new MovementAbilities();
        expect(abilities.has('dash')).toBe(true);
        expect(abilities.has('air-dash')).toBe(false);
        expect(abilities.unlocked).toEqual(['dash']);
    });

    it('unlocks an ability once', () =>
    {
        const abilities = new MovementAbilities();
        expect(abilities.unlock('double-jump')).toBe(true);
        expect(abilities.unlock('double-jump')).toBe(false);
        expect(abilities.unlocked).toEqual(['dash', 'double-jump']);
    });

    it('counts the Dash cooldown down and never below zero', () =>
    {
        const abilities = new MovementAbilities();
        abilities.startDashCooldown(800);
        abilities.tick(300);
        expect(abilities.dashReadyInMs).toBe(500);
        abilities.tick(-50);
        abilities.tick(Number.NaN);
        expect(abilities.dashReadyInMs).toBe(500);
        abilities.tick(900);
        expect(abilities.dashReadyInMs).toBe(0);
    });

    it('loads a save: keeps known ids, always has the Dash, starts ready', () =>
    {
        const abilities = new MovementAbilities();
        abilities.startDashCooldown(800);
        abilities.loadFrom(['air-dash', 'fly', 'air-dash']);
        expect(abilities.unlocked).toEqual(['dash', 'air-dash']);
        expect(abilities.dashReadyInMs).toBe(0);
        abilities.loadFrom(undefined);
        expect(abilities.unlocked).toEqual(['dash']);
    });
});
