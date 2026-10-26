import { DomainEvents } from '../domain/DomainEvents';
import { Enemy } from '../domain/entities/Enemy';
import { Score } from '../domain/entities/Score';

export const ENEMY_DEFEATED_EVENT = 'enemy-defeated';

export interface EnemyDefeatedPayload
{
    points: number;
    totalScore: number;
}

/**
 * Use case executed when the player stomps/defeats an enemy.
 * Marks the enemy defeated, awards points to score, and emits a domain event.
 * See "Application layer" in CONTEXT.md.
 */
export function defeatEnemyUseCase (enemy: Enemy, score: Score): void
{
    if (enemy.isDefeated) return;

    enemy.defeat();
    score.add(enemy.points);

    DomainEvents.emit<EnemyDefeatedPayload>(ENEMY_DEFEATED_EVENT, {
        points: enemy.points,
        totalScore: score.value,
    });
}
