import { DomainEvents } from '../domain/DomainEvents';
import { Health } from '../domain/entities/Health';
import { PLAYER_DAMAGED_EVENT, PLAYER_DIED_EVENT, type PlayerDamagedPayload } from './PlayerTakeDamageUseCase';

export const PLAYER_FELL_EVENT = 'player-fell';

/**
 * The hero fell into a pit: dead at once, whatever the hearts and the Armor. Invincibility, a Potion or the Dash's
 * dodge do not save it: nothing hits the hero, the ground is gone. Returns false when the hero was dead already.
 */
export function fallIntoPitUseCase (health: Health): boolean
{
    if (!health.kill()) return false;

    DomainEvents.emit(PLAYER_FELL_EVENT, {});
    DomainEvents.emit<PlayerDamagedPayload>(PLAYER_DAMAGED_EVENT, {
        currentHealth: 0,
        maxHealth: health.max,
        armor: 0,
        maxArmor: health.maxArmor,
    });
    DomainEvents.emit(PLAYER_DIED_EVENT, {});
    return true;
}
