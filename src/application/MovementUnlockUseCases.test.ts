import { describe, expect, it } from 'vitest';
import { MovementAbilities } from '../domain/entities/MovementAbilities';
import { syncMovementWithProgressUseCase } from './MovementUnlockUseCases';

const unlocks = [
    { ability: 'air-dash' as const, afterBossStage: 10 },
    { ability: 'double-jump' as const, afterBossStage: 30 },
];

describe('syncMovementWithProgressUseCase', () =>
{
    it('gives the air dash when the Stage 10 Boss was cleared, once', () =>
    {
        const abilities = new MovementAbilities();
        expect(syncMovementWithProgressUseCase(abilities, unlocks, new Set([1, 2, 5]))).toEqual([]);
        expect(abilities.has('air-dash')).toBe(false);
        expect(syncMovementWithProgressUseCase(abilities, unlocks, new Set([1, 10]))).toEqual(['air-dash']);
        expect(abilities.has('air-dash')).toBe(true);
        expect(syncMovementWithProgressUseCase(abilities, unlocks, new Set([1, 10]))).toEqual([]);
    });

    it('gives every ability whose Boss was already beaten (an older save)', () =>
    {
        const abilities = new MovementAbilities();
        expect(syncMovementWithProgressUseCase(abilities, unlocks, new Set([10, 20, 30]))).toEqual(['air-dash', 'double-jump']);
    });
});
