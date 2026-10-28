import { Physics, Scene } from 'phaser';
import { Boss as BossEntity, BossPhase } from '../../../domain/entities/Boss';
import { damageBossUseCase } from '../../../application/DamageBossUseCase';
import { Score } from '../../../domain/entities/Score';

const TEXTURE_KEY = 'boss-king-slime';
const WIDTH = 96;
const HEIGHT = 72;

export type BossAction = 'jump_slam' | 'roll_dash' | 'summon';
export type BossFsmState = 'idle' | 'telegraph' | 'jump_slam' | 'roll_dash' | 'summon' | 'recover';

/**
 * Phaser arcade sprite representing the King Slime Boss.
 * Features a multi-phase AI state machine (Royal Phase 1, Enraged Phase 2, Berserk Phase 3).
 * Pairs with the Boss domain entity — see CONTEXT.md.
 */
export class Boss extends Physics.Arcade.Sprite
{
    entity: BossEntity;
    isInvulnerable = false;
    private _fsmState: BossFsmState = 'idle';
    private stateTimer = 0;
    private pendingAction: BossAction = 'jump_slam';
    private wasInAir = false;
    private doubleSlamPending = false;
    private previousPhase: BossPhase = 1;
    private chargeDirection = 1;

    onLanding?: (x: number, y: number) => void;
    onDefeated?: (x: number, y: number) => void;
    onSummonMinion?: (x: number, y: number) => void;
    onPhaseChanged?: (newPhase: BossPhase) => void;

    constructor (scene: Scene, x: number, y: number, maxHp = 5)
    {
        Boss.ensureTexture(scene);

        super(scene, x, y, TEXTURE_KEY);

        this.entity = new BossEntity(maxHp, 1000);
        this.previousPhase = this.entity.phase;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0.05);

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.setSize(WIDTH - 16, HEIGHT - 14);
            body.setOffset(8, 14);
        }
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Royal Slime Body (deep amethyst purple)
        graphics.fillStyle(0x7c3aed, 1);
        graphics.fillRoundedRect(4, 20, WIDTH - 8, HEIGHT - 20, 24);

        // Inner gelatin shade
        graphics.fillStyle(0x6d28d9, 1);
        graphics.fillRoundedRect(8, 26, WIDTH - 16, HEIGHT - 30, 20);

        // Gelatin shine highlight
        graphics.fillStyle(0xc4b5fd, 0.7);
        graphics.fillEllipse(26, 34, 18, 8);

        // Golden Royal Crown
        const crownX = WIDTH / 2 - 20;
        const crownY = 4;
        graphics.fillStyle(0xf59e0b, 1);
        graphics.fillRect(crownX, crownY + 12, 40, 6);

        // 3 Crown peaks
        graphics.fillStyle(0xfbbf24, 1);
        graphics.beginPath();
        graphics.moveTo(crownX, crownY + 12);
        graphics.lineTo(crownX + 4, crownY + 2);
        graphics.lineTo(crownX + 12, crownY + 12);
        graphics.lineTo(crownX + 20, crownY);
        graphics.lineTo(crownX + 28, crownY + 12);
        graphics.lineTo(crownX + 36, crownY + 2);
        graphics.lineTo(crownX + 40, crownY + 12);
        graphics.closePath();
        graphics.fillPath();

        // Crown rubies
        graphics.fillStyle(0xef4444, 1);
        graphics.fillCircle(crownX + 4, crownY + 4, 2.5);
        graphics.fillCircle(crownX + 20, crownY + 2, 3);
        graphics.fillCircle(crownX + 36, crownY + 4, 2.5);

        // Menacing glowing eyes
        graphics.fillStyle(0xffffff, 1);
        graphics.fillEllipse(32, 46, 9, 7);
        graphics.fillEllipse(64, 46, 9, 7);

        // Red angry pupils
        graphics.fillStyle(0xdc2626, 1);
        graphics.fillCircle(34, 46, 4);
        graphics.fillCircle(62, 46, 4);

        // Evil smile
        graphics.fillStyle(0x1e1b4b, 1);
        graphics.beginPath();
        graphics.moveTo(40, 56);
        graphics.lineTo(56, 56);
        graphics.lineTo(48, 62);
        graphics.closePath();
        graphics.fillPath();

        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }

    get fsmState (): BossFsmState
    {
        return this._fsmState;
    }

    update (playerX: number, _playerY?: number, delta = 16): void
    {
        if (this.entity.isDefeated || !this.body) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.blocked.down || body.touching.down;

        // Ground landing detector for jump slam
        if (this.wasInAir && isOnGround)
        {
            this.handleLanding();
        }
        else if (!isOnGround)
        {
            this.wasInAir = true;
        }

        // Apply Phase Tint if not currently invulnerable/flashing
        if (!this.isInvulnerable && this._fsmState !== 'telegraph')
        {
            this.applyPhaseAppearance();
        }

        this.tickFsm(playerX, delta, body, isOnGround);
    }

    private tickFsm (
        playerX: number,
        delta: number,
        body: Phaser.Physics.Arcade.Body,
        isOnGround: boolean
    )
    {
        this.stateTimer += delta;
        const phase = this.entity.phase;

        switch (this._fsmState)
        {
            case 'idle': {
                if (isOnGround)
                {
                    this.setVelocityX(0);
                    this.setFlipX(playerX < this.x);
                }

                const attackCooldown = phase === 3 ? 1000 : (phase === 2 ? 1600 : 2200);
                if (isOnGround && this.stateTimer >= attackCooldown && !this.isInvulnerable)
                {
                    this.selectNextAttack(phase);
                    this.transitionTo('telegraph');
                }
                break;
            }

            case 'telegraph': {
                this.setVelocityX(0);
                const telegraphDuration = phase === 3 ? 300 : (phase === 2 ? 400 : 500);

                // Warning shake & color pulse
                const shakeOffset = (this.stateTimer % 80 < 40) ? -3 : 3;
                this.setX(this.x + shakeOffset * 0.1);

                if (this.stateTimer >= telegraphDuration)
                {
                    this.executeAttack(playerX);
                }
                break;
            }

            case 'jump_slam': {
                // Tracking motion in air handled by initial velocity
                break;
            }

            case 'roll_dash': {
                // Horizontal charge across the arena
                const dashSpeed = phase === 3 ? 360 : 300;
                this.setVelocityX(this.chargeDirection * dashSpeed);

                const hitWall = (this.chargeDirection < 0 && body.blocked.left) ||
                                (this.chargeDirection > 0 && body.blocked.right);

                // Stop roll dash on wall collision or after 850ms
                if (hitWall || this.stateTimer >= 850)
                {
                    if (hitWall)
                    {
                        this.scene.cameras.main.shake(160, 0.008);
                    }
                    this.transitionTo('recover');
                }
                break;
            }

            case 'summon': {
                if (this.stateTimer >= 300)
                {
                    this.onSummonMinion?.(this.x, this.y - 10);
                    this.transitionTo('recover');
                }
                break;
            }

            case 'recover': {
                this.setVelocityX(0);
                const recoveryDuration = phase === 3 ? 250 : 450;
                if (this.stateTimer >= recoveryDuration)
                {
                    this.transitionTo('idle');
                }
                break;
            }
        }
    }

    private selectNextAttack (phase: BossPhase)
    {
        const roll = Math.random();

        if (phase === 1)
        {
            // Phase 1: 75% Jump Slam, 25% Minion Summon
            this.pendingAction = roll < 0.75 ? 'jump_slam' : 'summon';
        }
        else if (phase === 2)
        {
            // Phase 2: 50% Charge Roll Dash, 50% Heavy Jump Slam
            this.pendingAction = roll < 0.5 ? 'roll_dash' : 'jump_slam';
        }
        else
        {
            // Phase 3 (Berserk): 50% Double Slam, 35% Frenzy Charge, 15% Minion Summon
            if (roll < 0.5)
            {
                this.pendingAction = 'jump_slam';
                this.doubleSlamPending = true;
            }
            else if (roll < 0.85)
            {
                this.pendingAction = 'roll_dash';
            }
            else
            {
                this.pendingAction = 'summon';
            }
        }
    }

    private executeAttack (playerX: number)
    {
        const dir = playerX < this.x ? -1 : 1;
        this.chargeDirection = dir;
        this.setFlipX(dir < 0);

        if (this.pendingAction === 'jump_slam')
        {
            const phase = this.entity.phase;
            const jumpVy = phase === 3 ? -520 : (phase === 2 ? -460 : -390);
            const jumpVx = dir * (phase === 3 ? 180 : (phase === 2 ? 140 : 100));

            this.setVelocity(jumpVx, jumpVy);
            this.transitionTo('jump_slam');

            // Leaping stretch
            this.scene.tweens.add({
                targets: this,
                scaleX: 0.85,
                scaleY: 1.25,
                duration: 110,
                yoyo: true,
            });
        }
        else if (this.pendingAction === 'roll_dash')
        {
            this.transitionTo('roll_dash');

            // Squashed roll shape
            this.scene.tweens.add({
                targets: this,
                scaleX: 1.35,
                scaleY: 0.7,
                duration: 120,
            });
        }
        else if (this.pendingAction === 'summon')
        {
            this.transitionTo('summon');

            // Squat and pop
            this.scene.tweens.add({
                targets: this,
                scaleY: 1.25,
                scaleX: 0.85,
                duration: 150,
                yoyo: true,
            });
        }
    }

    private handleLanding ()
    {
        this.wasInAir = false;
        this.scene.cameras.main.shake(140, 0.006);
        this.onLanding?.(this.x, this.y + HEIGHT / 2);

        // Landing squash
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.3,
            scaleY: 0.75,
            duration: 90,
            yoyo: true,
        });

        // Berserk Double-Slam follow-up leap
        if (this.doubleSlamPending)
        {
            this.doubleSlamPending = false;
            this.scene.time.delayedCall(120, () =>
            {
                if (this.entity.isDefeated) return;
                const quickDir = this.flipX ? -1 : 1;
                this.setVelocity(quickDir * 200, -480);
                this.transitionTo('jump_slam');
            });
            return;
        }

        this.transitionTo('recover');
    }

    private transitionTo (nextState: BossFsmState)
    {
        this._fsmState = nextState;
        this.stateTimer = 0;

        if (nextState === 'telegraph')
        {
            const phase = this.entity.phase;
            const telegraphTint = phase === 3 ? 0xef4444 : (phase === 2 ? 0xf97316 : 0xfbbf24);
            this.setTint(telegraphTint);

            // Telegraph anticipation squash
            this.scene.tweens.add({
                targets: this,
                scaleX: 1.2,
                scaleY: 0.82,
                duration: 150,
                yoyo: true,
            });
        }
        else if (nextState === 'idle' || nextState === 'recover')
        {
            this.setScale(1, 1);
            this.applyPhaseAppearance();
        }
    }

    private applyPhaseAppearance ()
    {
        const phase = this.entity.phase;
        if (phase === 3)
        {
            this.setTint(0xff3355); // Berserk furious crimson
        }
        else if (phase === 2)
        {
            this.setTint(0xffaa66); // Enraged sunset amber
        }
        else
        {
            this.clearTint(); // Regal amethyst
        }
    }

    takeDamage (score: Score, amount = 1): boolean
    {
        if (this.isInvulnerable || this.entity.isDefeated) return false;

        this.isInvulnerable = true;

        const isDefeated = damageBossUseCase(this.entity, score, amount);
        const currentPhase = this.entity.phase;

        // Check for dramatic Phase Shift reaction
        if (currentPhase !== this.previousPhase && !isDefeated)
        {
            this.previousPhase = currentPhase;
            this.scene.cameras.main.shake(250, 0.012);
            this.scene.cameras.main.flash(120, 255, 100, 100, true);
            this.onPhaseChanged?.(currentPhase);
        }

        // Flash invulnerability tween
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            tint: 0xff3333,
            duration: 90,
            yoyo: true,
            repeat: 5,
            onComplete: () =>
            {
                this.alpha = 1;
                this.isInvulnerable = false;
                this.applyPhaseAppearance();
                this.transitionTo('idle');
            },
        });

        if (isDefeated)
        {
            this.handleDefeated();
        }
        else
        {
            // Flinch bounce back
            this.setVelocityY(-260);
            this.transitionTo('recover');
        }

        return true;
    }

    /**
     * When true, the boss only freezes at 0 HP instead of vanishing, so a wrong finisher answer
     * can bring it back (see `reviveAfterFailedFinisher`). The scene then calls `playDefeatTween`
     * once the finisher is answered correctly.
     */
    awaitFinisher = false;

    private handleDefeated (): void
    {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.enable = false;
        }

        this.scene.cameras.main.shake(400, 0.015);
        this.onDefeated?.(this.x, this.y);

        if (this.awaitFinisher)
        {
            this.setVelocity(0, 0);
            return;
        }

        this.playDefeatTween();
    }

    /** Brings a boss frozen at 0 HP back into the fight after a wrong finisher answer. */
    reviveAfterFailedFinisher (healAmount: number): void
    {
        this.entity.heal(healAmount);
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.enable = true;
        }
        this.setAlpha(1);
        this.isInvulnerable = false;
        this.applyPhaseAppearance();
        this.transitionTo('idle');
    }

    playDefeatTween (): void
    {
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.5,
            scaleY: 0.2,
            alpha: 0,
            duration: 700,
            ease: 'Power2',
            onComplete: () =>
            {
                this.destroy();
            },
        });
    }
}
