import { EnemyAttackMove, EnemyAttackPlan, EnemyAttackPlanner } from '../../../domain/entities/EnemyAttackPlanner';
import type { Enemy } from './Enemy';

type Phase = 'ready' | 'telegraph' | 'charge' | 'throw' | 'stunned';

/** The hero is only attacked when roughly on the same level as the enemy. */
const MAX_HEIGHT_DIFFERENCE = 140;
/** Time between two rocks of one throw, and the pause after the last one. */
const ROCK_INTERVAL_MS = 280;
const THROW_RECOVERY_MS = 500;
const WARNING_BLINK_MS = 110;

const WARNING_TINT = 0xff3333;
const STUN_TINT = 0x93c5fd;

/**
 * The special attacks of a Mini-boss (charge and rock throw): warn, attack, then rest.
 * Which attack comes next is decided by the domain's `EnemyAttackPlanner`; this class only
 * moves the sprite. While an attack runs it takes over the enemy; `update` says so by returning true.
 */
export class EnemyAttackBehavior
{
    private readonly planner: EnemyAttackPlanner;
    private phase: Phase = 'ready';
    private phaseMs = 0;
    private move: EnemyAttackMove | null = null;
    private direction = 1;
    private rocksThrown = 0;
    private marker?: Phaser.GameObjects.Text;

    constructor (private readonly enemy: Enemy, plan: EnemyAttackPlan)
    {
        this.planner = new EnemyAttackPlanner(plan);
    }

    /** True while an attack (warning, rush, throw or daze) controls the enemy this frame. */
    update (delta: number, playerX: number, playerY: number, body: Phaser.Physics.Arcade.Body): boolean
    {
        const { enemy } = this;
        this.moveMarker();

        if (this.phase === 'ready')
        {
            this.planner.tick(delta);

            const distance = Math.abs(playerX - enemy.x);
            if (Math.abs(playerY - enemy.y) > MAX_HEIGHT_DIFFERENCE) return false;

            const next = this.planner.choose(distance);
            if (!next) return false;

            this.planner.begin(next);
            this.move = next;
            this.direction = playerX < enemy.x ? -1 : 1;
            this.enter('telegraph');
            return true;
        }

        this.phaseMs += delta;
        const move = this.move!;

        switch (this.phase)
        {
            case 'telegraph':
                enemy.setVelocityX(0);
                enemy.setFlipX(this.direction < 0);
                if (Math.floor(this.phaseMs / WARNING_BLINK_MS) % 2 === 0) enemy.setTint(WARNING_TINT);
                else enemy.clearTint();

                if (this.phaseMs >= move.telegraphMs)
                {
                    enemy.clearTint();
                    this.enter(move.id === 'charge' ? 'charge' : 'throw');
                }
                break;

            case 'charge': {
                enemy.setVelocityX(this.direction * move.speed);
                const hitWall = this.direction > 0 ? body.blocked.right : body.blocked.left;
                if (hitWall || this.phaseMs >= (move.durationMs ?? 0))
                {
                    enemy.setVelocityX(0);
                    this.enter('stunned');
                }
                break;
            }

            case 'throw': {
                enemy.setVelocityX(0);
                const due = Math.min(move.projectiles ?? 1, Math.floor(this.phaseMs / ROCK_INTERVAL_MS) + 1);
                while (this.rocksThrown < due)
                {
                    this.rocksThrown++;
                    enemy.throwRock(this.direction, move.speed);
                }
                const finishedAt = ((move.projectiles ?? 1) - 1) * ROCK_INTERVAL_MS + THROW_RECOVERY_MS;
                if (this.phaseMs >= finishedAt) this.enter('ready');
                break;
            }

            case 'stunned':
                enemy.setVelocityX(0);
                enemy.setTint(STUN_TINT);
                if (this.phaseMs >= (move.stunMs ?? 0)) this.enter('ready');
                break;
        }

        return true;
    }

    /** Drops any warning marker and tint, e.g. when the enemy is defeated. */
    /** A stun cuts an attack short: the warning, rush or throw ends and the enemy starts over. */
    interrupt (): void
    {
        if (this.phase !== 'ready') this.enter('ready');
    }

    cancel (): void
    {
        this.marker?.destroy();
        this.marker = undefined;
        this.enemy.clearTint();
    }

    private enter (phase: Phase): void
    {
        this.phase = phase;
        this.phaseMs = 0;
        this.rocksThrown = 0;

        this.marker?.destroy();
        this.marker = undefined;
        if (phase === 'telegraph') this.showMarker('❗', '#f87171');
        else if (phase === 'stunned') this.showMarker('💫', '#93c5fd');

        if (phase === 'ready') this.enemy.clearTint();
    }

    private showMarker (symbol: string, color: string): void
    {
        const { enemy } = this;
        this.marker = enemy.scene.add.text(enemy.x, enemy.y - enemy.displayHeight / 2 - 18, symbol, {
            fontFamily: 'monospace, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            color,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(15);
    }

    private moveMarker (): void
    {
        const { enemy, marker } = this;
        if (marker?.active) marker.setPosition(enemy.x, enemy.y - enemy.displayHeight / 2 - 18);
    }
}
