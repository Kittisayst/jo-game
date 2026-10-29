import { describe, expect, it } from 'vitest';
import { EnemyAttackPlan, EnemyAttackPlanner } from './EnemyAttackPlanner';

const plan: EnemyAttackPlan = {
    engageRange: 500,
    cooldownMs: 2500,
    moves: [
        { id: 'charge', telegraphMs: 800, minDistance: 0, maxDistance: 260, speed: 360, durationMs: 700, stunMs: 1000 },
        { id: 'rock-throw', telegraphMs: 600, minDistance: 240, maxDistance: 500, speed: 260, projectiles: 3 },
    ],
};

const first = () => 0;
const last = () => 0.999;

describe('EnemyAttackPlanner', () =>
{
    it('uses the attack whose distance band the player stands in', () =>
    {
        const planner = new EnemyAttackPlanner(plan);

        expect(planner.choose(120, first)?.id).toBe('charge');
        expect(planner.choose(420, first)?.id).toBe('rock-throw');
    });

    it('picks between attacks whose bands overlap using the random value', () =>
    {
        const planner = new EnemyAttackPlanner(plan);

        expect(planner.choose(250, first)?.id).toBe('charge');
        expect(planner.choose(250, last)?.id).toBe('rock-throw');
    });

    it('does nothing when the player is beyond the engage range', () =>
    {
        const planner = new EnemyAttackPlanner(plan);

        expect(planner.choose(501, first)).toBeNull();
    });

    it('waits out the cooldown after an attack begins', () =>
    {
        const planner = new EnemyAttackPlanner(plan);
        const charge = planner.choose(100, first)!;

        planner.begin(charge);
        expect(planner.isReady).toBe(false);
        expect(planner.choose(100, first)).toBeNull();

        planner.tick(2499);
        expect(planner.choose(420, first)).toBeNull();

        planner.tick(1);
        expect(planner.isReady).toBe(true);
        expect(planner.choose(420, first)?.id).toBe('rock-throw');
    });

    it('never uses the same attack three times in a row', () =>
    {
        const planner = new EnemyAttackPlanner(plan);
        const charge = plan.moves[0];

        planner.begin(charge);
        planner.tick(2500);
        planner.begin(charge);
        planner.tick(2500);

        // Close range only fits the charge, and it has just been used twice
        expect(planner.choose(100, first)).toBeNull();
        // In the overlap band the other attack is chosen instead
        expect(planner.choose(250, first)?.id).toBe('rock-throw');
    });

    it('allows the same attack again once another one was used in between', () =>
    {
        const planner = new EnemyAttackPlanner(plan);

        planner.begin(plan.moves[0]);
        planner.tick(2500);
        planner.begin(plan.moves[1]);
        planner.tick(2500);
        planner.begin(plan.moves[0]);
        planner.tick(2500);

        expect(planner.choose(100, first)?.id).toBe('charge');
    });

    it('forgets the cooldown and history on reset', () =>
    {
        const planner = new EnemyAttackPlanner(plan);
        planner.begin(plan.moves[0]);

        planner.reset();

        expect(planner.isReady).toBe(true);
    });
});
