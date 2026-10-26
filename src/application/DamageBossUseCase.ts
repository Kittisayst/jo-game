import { DomainEvents } from '../domain/DomainEvents';
import { Boss } from '../domain/entities/Boss';
import { Score } from '../domain/entities/Score';

export const BOSS_DAMAGED_EVENT = 'boss-damaged';
export const BOSS_DEFEATED_EVENT = 'boss-defeated';

export interface BossDamagedPayload
{
    currentHp: number;
    maxHp: number;
}

export interface BossDefeatedPayload
{
    points: number;
    totalScore: number;
}

/**
 * Use case executed when the player damages the Boss.
 * Decreases Boss HP, awards score points if defeated, and publishes domain events.
 * See "Application layer" in CONTEXT.md.
 */
export function damageBossUseCase (boss: Boss, score: Score, amount = 1): boolean
{
    if (boss.isDefeated) return false;

    const result = boss.takeDamage(amount);

    DomainEvents.emit<BossDamagedPayload>(BOSS_DAMAGED_EVENT, {
        currentHp: boss.currentHp,
        maxHp: boss.maxHp,
    });

    if (result.defeated)
    {
        score.add(boss.points);
        DomainEvents.emit<BossDefeatedPayload>(BOSS_DEFEATED_EVENT, {
            points: boss.points,
            totalScore: score.value,
        });
    }

    return result.defeated;
}
