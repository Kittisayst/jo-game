import { DomainEvents } from '../domain/DomainEvents';
import { Boss } from '../domain/entities/Boss';

export const BOSS_DAMAGED_EVENT = 'boss-damaged';
export const BOSS_DEFEATED_EVENT = 'boss-defeated';

export interface BossDamagedPayload
{
    currentHp: number;
    maxHp: number;
}

export interface BossDefeatedPayload
{
    maxHp: number;
}

/**
 * Use case executed when the player damages the Boss.
 * Decreases Boss HP and publishes domain events. Returns true when the blow was fatal.
 * See "Application layer" in CONTEXT.md.
 */
export function damageBossUseCase (boss: Boss, amount = 1): boolean
{
    if (boss.isDefeated) return false;

    const result = boss.takeDamage(amount);

    DomainEvents.emit<BossDamagedPayload>(BOSS_DAMAGED_EVENT, {
        currentHp: boss.currentHp,
        maxHp: boss.maxHp,
    });

    if (result.defeated)
    {
        DomainEvents.emit<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, {
            maxHp: boss.maxHp,
        });
    }

    return result.defeated;
}
