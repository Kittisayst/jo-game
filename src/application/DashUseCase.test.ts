import { describe, expect, it } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { MovementAbilities } from '../domain/entities/MovementAbilities';
import { DASHED_EVENT, dashUseCase } from './DashUseCase';

const tuning = { speed: 640, durationMs: 170, dodgeMs: 220, cooldownMs: 800 };
const ground = { inAir: false, airDashUsed: false };

describe('dashUseCase', () =>
{
    it('dashes on the ground, starts the cooldown and says so', () =>
    {
        const abilities = new MovementAbilities();
        const heard: unknown[] = [];
        const listen = (payload: unknown) => heard.push(payload);
        DomainEvents.on(DASHED_EVENT, listen);
        expect(dashUseCase(abilities, tuning, ground)).toEqual({ success: true, tuning });
        DomainEvents.off(DASHED_EVENT, listen);
        expect(abilities.dashReadyInMs).toBe(800);
        expect(heard).toEqual([{ inAir: false }]);
    });

    it('waits for the cooldown', () =>
    {
        const abilities = new MovementAbilities();
        dashUseCase(abilities, tuning, ground);
        expect(dashUseCase(abilities, tuning, ground)).toEqual({ success: false, reason: 'cooldown' });
        abilities.tick(800);
        expect(dashUseCase(abilities, tuning, ground).success).toBe(true);
    });

    it('needs the air dash in the air, once per jump', () =>
    {
        const abilities = new MovementAbilities();
        expect(dashUseCase(abilities, tuning, { inAir: true, airDashUsed: false })).toEqual({ success: false, reason: 'no_air_dash' });
        abilities.unlock('air-dash');
        expect(dashUseCase(abilities, tuning, { inAir: true, airDashUsed: true })).toEqual({ success: false, reason: 'air_dash_used' });
        expect(dashUseCase(abilities, tuning, { inAir: true, airDashUsed: false }).success).toBe(true);
    });
});
