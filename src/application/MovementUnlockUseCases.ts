import { DomainEvents } from '../domain/DomainEvents';
import { MovementAbilities, MovementAbilityId } from '../domain/entities/MovementAbilities';

export const MOVEMENT_UNLOCKED_EVENT = 'movement-unlocked';

/** A movement ability the hero gets for beating the Boss of a Stage (from `skills.json`). */
export interface MovementUnlock
{
    ability: MovementAbilityId;
    afterBossStage: number;
}

export interface MovementUnlockedPayload
{
    ability: MovementAbilityId;
}

/**
 * Gives the hero every movement ability whose Boss Stage was cleared. Safe to call again and again (also after
 * loading a save made before the ability existed): only new abilities come back.
 */
export function syncMovementWithProgressUseCase (
    abilities: MovementAbilities,
    unlocks: readonly MovementUnlock[],
    clearedStageNumbers: ReadonlySet<number>
): MovementAbilityId[]
{
    const gained: MovementAbilityId[] = [];
    for (const unlock of unlocks)
    {
        if (!clearedStageNumbers.has(unlock.afterBossStage)) continue;
        if (abilities.unlock(unlock.ability))
        {
            gained.push(unlock.ability);
            DomainEvents.emit<MovementUnlockedPayload>(MOVEMENT_UNLOCKED_EVENT, { ability: unlock.ability });
        }
    }
    return gained;
}
