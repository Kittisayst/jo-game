import { describe, expect, it, vi } from 'vitest';
import { DomainEvents } from '../domain/DomainEvents';
import { Enemy } from '../domain/entities/Enemy';
import { Score } from '../domain/entities/Score';
import {
    defeatEnemyUseCase,
    ENEMY_DEFEATED_EVENT,
    EnemyDefeatedPayload,
} from './DefeatEnemyUseCase';

describe('defeatEnemyUseCase', () =>
{
    it('defeats the enemy, adds points to score, and emits domain event', () =>
    {
        const enemy = new Enemy(150);
        const score = new Score(50);
        const listener = vi.fn();

        DomainEvents.on<EnemyDefeatedPayload>(ENEMY_DEFEATED_EVENT, listener);
        defeatEnemyUseCase(enemy, score);
        DomainEvents.off<EnemyDefeatedPayload>(ENEMY_DEFEATED_EVENT, listener);

        expect(enemy.isDefeated).toBe(true);
        expect(score.value).toBe(200);
        expect(listener).toHaveBeenCalledWith({
            points: 150,
            totalScore: 200,
        });
    });

    it('does not award points again if enemy is already defeated', () =>
    {
        const enemy = new Enemy(100);
        const score = new Score(0);
        const listener = vi.fn();

        defeatEnemyUseCase(enemy, score);

        DomainEvents.on<EnemyDefeatedPayload>(ENEMY_DEFEATED_EVENT, listener);
        defeatEnemyUseCase(enemy, score);
        DomainEvents.off<EnemyDefeatedPayload>(ENEMY_DEFEATED_EVENT, listener);

        expect(score.value).toBe(100);
        expect(listener).not.toHaveBeenCalled();
    });
});
