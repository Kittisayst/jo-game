export type EnemyAttackId = 'charge' | 'rock-throw';

/** One special attack of a Mini-boss; the numbers come from `enemies.json`. */
export interface EnemyAttackMove
{
    id: EnemyAttackId;
    /** How long the enemy shows a warning before the attack lands. */
    telegraphMs: number;
    /** The attack is used while the player is between these two distances. */
    minDistance: number;
    maxDistance: number;
    /** Charge speed, or the speed of a thrown rock. */
    speed: number;
    /** Charge only: how long the rush lasts at most. */
    durationMs?: number;
    /** Charge only: how long the enemy is dazed (and open to hits) afterwards. */
    stunMs?: number;
    /** Rock throw only: how many rocks are thrown. */
    projectiles?: number;
}

export interface EnemyAttackPlan
{
    /** The enemy attacks only while the player is within this distance. */
    engageRange: number;
    /** The quiet time between the end of one attack and the choice of the next. */
    cooldownMs: number;
    moves: EnemyAttackMove[];
}

/** The same attack may not be used more than this many times in a row. */
const MAX_REPEATS = 2;

/**
 * Chooses which special attack a Mini-boss uses next: by how far the player is, after a cooldown,
 * and never the same attack three times in a row. Pure rules, no Phaser or time source:
 * the caller feeds in the elapsed time and the player's distance.
 */
export class EnemyAttackPlanner
{
    private cooldownLeftMs = 0;
    private history: EnemyAttackId[] = [];

    constructor (private readonly plan: EnemyAttackPlan) {}

    get isReady (): boolean
    {
        return this.cooldownLeftMs <= 0;
    }

    tick (deltaMs: number): void
    {
        this.cooldownLeftMs = Math.max(0, this.cooldownLeftMs - deltaMs);
    }

    /** The attack to start for a player `distance` away, or null when none fits right now. */
    choose (distance: number, random: () => number = Math.random): EnemyAttackMove | null
    {
        if (!this.isReady || distance > this.plan.engageRange) return null;

        const lastTwo = this.history.slice(-MAX_REPEATS);
        const bannedId = lastTwo.length === MAX_REPEATS && lastTwo.every(id => id === lastTwo[0])
            ? lastTwo[0]
            : null;

        const candidates = this.plan.moves.filter(move =>
            move.id !== bannedId && distance >= move.minDistance && distance <= move.maxDistance);

        if (candidates.length === 0) return null;
        return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    }

    /** Records the chosen attack and starts the cooldown that follows it. */
    begin (move: EnemyAttackMove): void
    {
        this.history.push(move.id);
        if (this.history.length > MAX_REPEATS) this.history.shift();
        this.cooldownLeftMs = this.plan.cooldownMs;
    }

    reset (): void
    {
        this.cooldownLeftMs = 0;
        this.history = [];
    }
}
