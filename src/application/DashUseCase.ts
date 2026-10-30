import { DomainEvents } from '../domain/DomainEvents';
import { DashTuning, MovementAbilities } from '../domain/entities/MovementAbilities';

export const DASHED_EVENT = 'dashed';

export interface DashedPayload
{
    inAir: boolean;
}

export type DashResult =
    | { success: true; tuning: DashTuning }
    | { success: false; reason: 'cooldown' | 'no_air_dash' | 'air_dash_used' };

/**
 * The hero asks to Dash. On the ground it only needs the cooldown to be over; in the air it also needs the
 * air dash (unlocked later) and allows one per jump. Starts the cooldown and says so with `dashed`; the scene
 * moves the hero.
 */
export function dashUseCase (
    abilities: MovementAbilities,
    tuning: DashTuning,
    state: { inAir: boolean; airDashUsed: boolean }
): DashResult
{
    if (abilities.dashReadyInMs > 0) return { success: false, reason: 'cooldown' };
    if (state.inAir)
    {
        if (!abilities.has('air-dash')) return { success: false, reason: 'no_air_dash' };
        if (state.airDashUsed) return { success: false, reason: 'air_dash_used' };
    }

    abilities.startDashCooldown(tuning.cooldownMs);
    DomainEvents.emit<DashedPayload>(DASHED_EVENT, { inAir: state.inAir });
    return { success: true, tuning };
}
