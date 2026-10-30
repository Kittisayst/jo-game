import { Physics, Scene } from 'phaser';
import { soundManager } from '../../audio/SoundManager';
import { getGameContent } from '../../content/ContentCatalog';
import { GROUND_SINK, JUMP_SPEED, MOVE_SPEED } from '../physicsConstants';
import type { DashTuning } from '../../../domain/entities/MovementAbilities';

const WIDTH = 32;
const HEIGHT = 48;
/** How long the attack row (6 frames at 24 fps) and the tool row (6 frames at 16 fps) take. */
const ATTACK_ANIM_MS = 250;
const TOOL_ANIM_MS = 375;



export interface PlayerInputControls
{
    left: { isDown: boolean };
    right: { isDown: boolean };
    up: { isDown: boolean };
}

/** Fastest the hero moves sideways, except during a Dash (limits tunneling through thin walls). */
const MAX_SPEED_X = 320;

export class Player extends Physics.Arcade.Sprite
{
    isInvincible = false;
    /** True for the first moments of a Dash: nothing can hurt the hero (the dodge). */
    isDodging = false;
    /** An air dash was used since the hero last stood on the ground. */
    airDashUsed = false;
    /** Walking speed factor: a speed Potion and boots raise it (set by the scene every frame). */
    speedMultiplier = 1;
    facingDir = 1;
    isWallSliding = false;
    private wallJumpLockout = 0;
    private currentSkinId = 'cyber-blue';
    private isKnockedBack = false;
    private wasInAir = false;
    private coyoteTimer = 0;
    private jumpBufferTimer = 0;
    private wasJumpDown = false;
    private footstepTimer = 0;
    private runDustTimer = 0;
    private attackAnimTimer = 0;
    private isFainted = false;
    private dashMsLeft = 0;
    private dashSpeed = 0;
    private dashGhostTimer = 0;

    onJump?: (x: number, y: number) => void;
    onLand?: (x: number, y: number) => void;
    onRunStep?: (x: number, y: number, dir: number) => void;
    onWallSlide?: (x: number, y: number, wallDir: number) => void;

    constructor (scene: Scene, x: number, y: number, skinId = 'cyber-blue')
    {
        Player.ensureSkinTexture(scene, skinId);

        super(scene, x, y, `player-skin-${skinId}`);

        this.currentSkinId = skinId;
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Tuned collision box: 22x42, 5px in from the left and 4px down from the top of the 32x48 cell.
        // The boots reach the last row of the cell, 2px below the box, so the hero stands in the grass
        // line like the trees and signs do (the ground tile's grass starts 2px below its top edge).
        this.setSize(22, 44 - GROUND_SINK);
        this.setOffset(5, 4);
        this.setCollideWorldBounds(true);
        this.setDepth(10);

        // Terminal velocity limits to prevent tunneling during extreme leaps/falls
        this.setMaxVelocity(MAX_SPEED_X, 650);

        this.initAnimations(skinId);
    }

    get skinId (): string
    {
        return this.currentSkinId;
    }

    setSkin (skinId: string): void
    {
        this.currentSkinId = skinId;
        Player.ensureSkinTexture(this.scene, skinId);
        this.setTexture(`player-skin-${skinId}`);
        this.initAnimations(skinId);

        // The hero may be frozen (a conversation or the Skin shop is open) so update() is not
        // running to switch animations: without this the old skin's animation keeps repainting
        const idleKey = `${skinId}-idle`;
        if (this.scene.anims.exists(idleKey)) this.play(idleKey);
    }

    /** One Phaser animation per sheet row (`<skin>-<name>`), from player-animations.json. */
    private initAnimations (skinId: string): void
    {
        const anims = this.scene.anims;
        const textureKey = `player-skin-${skinId}`;
        const texture = this.scene.textures.get(textureKey);

        // A generated stand-in (no sheet loaded) has a single frame and no animations
        if (!texture || texture.frameTotal <= 1) return;

        const { frame, animations } = getGameContent().playerAnimations;
        for (const [name, animation] of Object.entries(animations))
        {
            const key = `${skinId}-${name}`;
            if (anims.exists(key)) continue;

            const start = animation.row * frame.columns;
            anims.create({
                key,
                frames: anims.generateFrameNumbers(textureKey, { start, end: start + animation.frames - 1 }),
                frameRate: Math.max(1, animation.fps),
                repeat: animation.loop ? -1 : 0,
            });
        }
    }

    /** The sheet frame number of column `column` in the animation `name`. */
    private frameOf (name: string, column: number): number
    {
        const { frame, animations } = getGameContent().playerAnimations;
        return animations[name].row * frame.columns + column;
    }

    /** Plays an animation of the current skin from its first frame, if the skin has a sheet. */
    private playAnimation (name: string): void
    {
        const key = `${this.currentSkinId}-${name}`;
        if (this.scene.anims.exists(key)) this.play(key, true);
    }

    private static ensureSkinTexture (scene: Scene, skinId: string)
    {
        const textureKey = `player-skin-${skinId}`;
        if (scene.textures.exists(textureKey)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        let bodyColor = 0x0284c7;
        let helmColor = 0x0f172a;
        let visorColor = 0x38bdf8;
        let coreColor = 0xf59e0b;
        let beltColor = 0x1e293b;
        let bootsColor = 0x0369a1;

        if (skinId === 'neon-ninja')
        {
            bodyColor = 0x0f172a;
            helmColor = 0x064e3b;
            visorColor = 0x10b981;
            coreColor = 0xef4444;
            beltColor = 0xdc2626;
            bootsColor = 0x1e293b;
        }
        else if (skinId === 'cyber-knight')
        {
            bodyColor = 0x64748b;
            helmColor = 0x334155;
            visorColor = 0xef4444;
            coreColor = 0xfbbf24;
            beltColor = 0x1e293b;
            bootsColor = 0x475569;
        }
        else if (skinId === 'golden-runner')
        {
            bodyColor = 0xf59e0b;
            helmColor = 0x78350f;
            visorColor = 0x22d3ee;
            coreColor = 0xffffff;
            beltColor = 0xd97706;
            bootsColor = 0xb45309;
        }

        // Body suit
        graphics.fillStyle(bodyColor, 1);
        graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);

        // Head/Helmet visor band
        graphics.fillStyle(helmColor, 1);
        graphics.fillRect(4, 8, WIDTH - 8, 12);

        // Glowing visor eye
        graphics.fillStyle(visorColor, 1);
        graphics.fillRect(8, 11, WIDTH - 16, 6);

        // Chest core / badge
        graphics.fillStyle(coreColor, 1);
        graphics.fillCircle(WIDTH / 2, 28, 4);

        // Belt
        graphics.fillStyle(beltColor, 1);
        graphics.fillRect(2, 34, WIDTH - 4, 4);

        // Boots
        graphics.fillStyle(bootsColor, 1);
        graphics.fillRect(2, HEIGHT - 8, 12, 8);
        graphics.fillRect(WIDTH - 14, HEIGHT - 8, 12, 8);

        graphics.generateTexture(textureKey, WIDTH, HEIGHT);
        graphics.destroy();
    }


    /** Plays the faint row and then stays down; the scene sends the hero home meanwhile. */
    playFaint (): void
    {
        this.isFainted = true;
        this.setVelocity(0, 0);
        this.playAnimation('faint');
    }

    /** Whether a hit would count right now (not after a hit, not while dodging). */
    get canBeHurt (): boolean
    {
        return !this.isInvincible && !this.isDodging;
    }

    /** True while a Dash moves the hero (it can be refused then: nothing else steers). */
    get isDashing (): boolean
    {
        return this.dashMsLeft > 0;
    }

    /** True when knocked back or fainted: the hero cannot act. */
    get isStunned (): boolean
    {
        return this.isKnockedBack || this.isFainted;
    }

    /** A quick burst towards `dir`, flat (no gravity) and dodging for `dodgeMs`. The rules are in `dashUseCase`. */
    dash (dir: -1 | 1, tuning: DashTuning): void
    {
        const body = this.body as Phaser.Physics.Arcade.Body;
        this.facingDir = dir;
        this.setFlipX(dir < 0);
        this.dashMsLeft = tuning.durationMs;
        this.dashSpeed = dir * tuning.speed;
        this.dashGhostTimer = 0;
        if (!body.blocked.down) this.airDashUsed = true;
        body.setAllowGravity(false);
        body.setMaxVelocityX(Math.max(MAX_SPEED_X, tuning.speed));
        this.setVelocity(this.dashSpeed, 0);

        this.isDodging = true;
        this.scene.time.delayedCall(tuning.dodgeMs, () =>
        {
            this.isDodging = false;
        });
    }

    /** Ends a Dash: gravity back, keep a little of the speed. */
    private endDash (): void
    {
        this.dashMsLeft = 0;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(true);
        body.setMaxVelocityX(MAX_SPEED_X);
        this.setVelocityX(Math.sign(this.dashSpeed) * MOVE_SPEED * this.speedMultiplier);
    }

    /** A fading copy of the hero left behind during a Dash. */
    private dropDashGhost (): void
    {
        const ghost = this.scene.add.image(this.x, this.y, this.texture.key, this.frame.name)
            .setFlipX(this.flipX)
            .setOrigin(this.originX, this.originY)
            .setScale(this.scaleX, this.scaleY)
            .setDepth(this.depth - 1)
            .setAlpha(0.55)
            .setTint(0x38bdf8);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() });
    }

    triggerDamage (sourceX: number): void
    {
        if (this.isInvincible) return;

        this.isInvincible = true;
        this.isKnockedBack = true;
        this.playAnimation('hurt');

        // Apply knockback
        const knockDirection = this.x < sourceX ? -1 : 1;
        this.setVelocity(knockDirection * 180, -260);

        this.scene.time.delayedCall(220, () =>
        {
            this.isKnockedBack = false;
        });

        // Invincibility flashing tween with damage red tint (1.4s)
        this.scene.tweens.add({
            targets: this,
            alpha: 0.25,
            duration: 100,
            yoyo: true,
            repeat: 6,
            onStart: () =>
            {
                this.setTint(0xef4444);
            },
            onComplete: () =>
            {
                this.clearTint();
                this.alpha = 1;
                this.isInvincible = false;
            },
        });
    }

    /** Faces `targetX` and plays the attack pose, e.g. for chopping a tree (no slash wave). */
    swingToolToward (targetX: number): void
    {
        this.facingDir = targetX < this.x ? -1 : 1;
        this.setFlipX(this.facingDir < 0);

        this.attackAnimTimer = TOOL_ANIM_MS;
        this.playAnimation('tool');
    }

    triggerSlashVfx (weaponId: string): void
    {
        this.attackAnimTimer = ATTACK_ANIM_MS;
        this.playAnimation('attack');

        const slashX = this.x + (this.facingDir * 30);
        const slashY = this.y;

        const slashSprites: Record<string, string> = {
            'wooden-sword': 'slash-wood',
            'iron-sword': 'slash-iron',
            'crystal-sword': 'slash-crystal',
        };
        const slashKey = slashSprites[weaponId];

        if (slashKey && this.scene.textures.exists(slashKey) && this.scene.textures.get(slashKey).frameTotal > 3)
        {
            const animKey = `${slashKey}-anim`;
            if (!this.scene.anims.exists(animKey))
            {
                this.scene.anims.create({
                    key: animKey,
                    frames: this.scene.anims.generateFrameNumbers(slashKey, { start: 0, end: 2 }),
                    frameRate: 22,
                    repeat: 0,
                });
            }
            const vfx = this.scene.add.sprite(slashX, slashY, slashKey, 0);
            vfx.setDepth(15);
            vfx.setFlipX(this.facingDir < 0);
            vfx.play(animKey);
            vfx.once('animationcomplete', () => vfx.destroy());

            this.scene.tweens.add({
                targets: this,
                scaleX: 1.12,
                scaleY: 0.92,
                duration: 70,
                yoyo: true,
            });
            return;
        }

        const swordColors: Record<string, number> = {
            'wooden-sword': 0xd4a373,
            'iron-sword': 0xe2e8f0,
            'crystal-sword': 0xa855f7,
        };

        const slash = this.scene.add.graphics({ x: slashX, y: slashY });
        slash.setDepth(15);

        if (weaponId === 'cyber-saber' || swordColors[weaponId] !== undefined)
        {
            const color = swordColors[weaponId] ?? 0x06b6d4;
            slash.lineStyle(4, color, 1);
            slash.beginPath();
            slash.arc(0, 0, 26, this.facingDir > 0 ? -Math.PI / 3 : (4 * Math.PI) / 3, this.facingDir > 0 ? Math.PI / 3 : (2 * Math.PI) / 3, false);
            slash.strokePath();

            slash.lineStyle(2, 0xffffff, 1);
            slash.beginPath();
            slash.arc(0, 0, 20, this.facingDir > 0 ? -Math.PI / 4 : (5 * Math.PI) / 4, this.facingDir > 0 ? Math.PI / 4 : (3 * Math.PI) / 4, false);
            slash.strokePath();

            this.scene.tweens.add({
                targets: slash,
                scaleX: 1.3,
                scaleY: 1.3,
                alpha: 0,
                duration: 130,
                onComplete: () => slash.destroy(),
            });
        }
        else if (weaponId === 'thunder-hammer')
        {
            slash.lineStyle(6, 0xf59e0b, 1);
            slash.beginPath();
            slash.arc(0, 0, 36, this.facingDir > 0 ? -Math.PI / 2 : (3 * Math.PI) / 2, this.facingDir > 0 ? Math.PI / 4 : (3 * Math.PI) / 4, false);
            slash.strokePath();

            slash.fillStyle(0xfef08a, 1);
            slash.fillCircle(this.facingDir * 18, 14, 4);
            slash.fillCircle(this.facingDir * 28, -6, 3);

            this.scene.tweens.add({
                targets: slash,
                scaleX: 1.4,
                scaleY: 1.4,
                alpha: 0,
                duration: 180,
                onComplete: () => slash.destroy(),
            });
        }
        else
        {
            // Muzzle flash for blaster / projectile
            slash.fillStyle(0x38bdf8, 1);
            slash.fillCircle(0, 0, 8);
            slash.fillStyle(0xffffff, 1);
            slash.fillCircle(0, 0, 4);

            this.scene.tweens.add({
                targets: slash,
                scale: 1.6,
                alpha: 0,
                duration: 90,
                onComplete: () => slash.destroy(),
            });
        }

        // Quick punchy player squeeze
        this.scene.tweens.add({
            targets: this,
            scaleX: 1.12,
            scaleY: 0.92,
            duration: 70,
            yoyo: true,
        });
    }

    update (controls: PlayerInputControls | Phaser.Types.Input.Keyboard.CursorKeys, delta = 16.66)
    {
        if (this.isFainted || this.isKnockedBack) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        const onGround = body.blocked.down;

        // Landing detection
        if (this.wasInAir && onGround)
        {
            this.onLand?.(this.x, this.y + HEIGHT / 2);

            // Subtle landing squash
            this.scene.tweens.add({
                targets: this,
                scaleY: 0.86,
                scaleX: 1.15,
                duration: 90,
                yoyo: true,
                ease: 'Quad.easeOut',
            });
        }
        this.wasInAir = !onGround;
        if (onGround) this.airDashUsed = false;

        // A Dash steers the hero by itself until it ends (or hits a wall)
        if (this.dashMsLeft > 0)
        {
            this.dashMsLeft = Math.max(0, this.dashMsLeft - delta);
            this.dashGhostTimer -= delta;
            if (this.dashGhostTimer <= 0)
            {
                this.dashGhostTimer = 40;
                this.dropDashGhost();
            }
            const blocked = this.dashSpeed < 0 ? body.blocked.left : body.blocked.right;
            if (this.dashMsLeft === 0 || blocked)
            {
                this.endDash();
            }
            else
            {
                this.setVelocity(this.dashSpeed, 0);
                this.playAnimation('run');
                return;
            }
        }

        // Coyote Time tracking (allows jumping briefly after running off a ledge)
        if (onGround)
        {
            this.coyoteTimer = 110;
        }
        else
        {
            this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
        }

        if (this.wallJumpLockout > 0)
        {
            this.wallJumpLockout = Math.max(0, this.wallJumpLockout - delta);
        }

        // Horizontal movement & footstep sounds
        const isMovingHorizontally = controls.left.isDown || controls.right.isDown;
        if (this.wallJumpLockout <= 0)
        {
            if (controls.left.isDown)
            {
                this.setVelocityX(-MOVE_SPEED * this.speedMultiplier);
                this.setFlipX(true);
                this.facingDir = -1;
            }
            else if (controls.right.isDown)
            {
                this.setVelocityX(MOVE_SPEED * this.speedMultiplier);
                this.setFlipX(false);
                this.facingDir = 1;
            }
            else
            {
                this.setVelocityX(0);
            }
        }

        // Wall Slide detection & deceleration
        const isTouchingWall = !onGround && (body.blocked.left || body.blocked.right);
        const wallDir = body.blocked.left ? -1 : (body.blocked.right ? 1 : 0);
        const isPressingIntoWall = (wallDir === -1 && controls.left.isDown) || (wallDir === 1 && controls.right.isDown);
        const isSlidingDown = body.velocity.y > 0;

        this.isWallSliding = isTouchingWall && isPressingIntoWall && isSlidingDown;

        if (this.isWallSliding)
        {
            // Decelerate downward slide (friction along the wall)
            if (body.velocity.y > 90)
            {
                this.setVelocityY(90);
            }
            this.onWallSlide?.(this.x + (wallDir * 12), this.y, wallDir);
        }

        if (onGround && isMovingHorizontally)
        {
            this.footstepTimer -= delta;
            if (this.footstepTimer <= 0)
            {
                this.footstepTimer = 185;
                soundManager.playFootstep();
            }

            this.runDustTimer -= delta;
            if (this.runDustTimer <= 0)
            {
                this.runDustTimer = 110;
                const dir = this.flipX ? 1 : -1;
                this.onRunStep?.(this.x, this.y + HEIGHT / 2 - 2, dir);
            }
        }
        else
        {
            this.footstepTimer = 50;
            this.runDustTimer = 30;
        }

        // Jump input buffering & edge detection
        const jumpIsDown = Boolean(controls.up.isDown);
        const jumpJustPressed = jumpIsDown && !this.wasJumpDown;
        const jumpJustReleased = !jumpIsDown && this.wasJumpDown;
        this.wasJumpDown = jumpIsDown;

        if (jumpJustPressed)
        {
            this.jumpBufferTimer = 130;
        }
        else
        {
            this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
        }

        // Execute jump if buffered press meets coyote window
        if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0)
        {
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            this.setVelocityY(-JUMP_SPEED);
            soundManager.playJump();
            this.onJump?.(this.x, this.y + HEIGHT / 2);

            // Subtle jump stretch
            this.scene.tweens.add({
                targets: this,
                scaleY: 1.2,
                scaleX: 0.85,
                duration: 110,
                yoyo: true,
                ease: 'Back.easeOut',
            });
        }
        else if (this.jumpBufferTimer > 0 && isTouchingWall)
        {
            // Wall Jump / Wall Kick!
            this.jumpBufferTimer = 0;
            this.coyoteTimer = 0;
            this.isWallSliding = false;
            this.wallJumpLockout = 160;

            // Kick off horizontally opposite to wall, leap upwards
            this.setVelocityX(-wallDir * 230);
            this.setVelocityY(-JUMP_SPEED * 0.95);
            this.facingDir = -wallDir;
            this.setFlipX(wallDir > 0);

            soundManager.playJump();
            this.onJump?.(this.x + (wallDir * 12), this.y);

            this.scene.tweens.add({
                targets: this,
                scaleY: 1.18,
                scaleX: 0.88,
                duration: 100,
                yoyo: true,
                ease: 'Back.easeOut',
            });
        }

        // Variable jump cut: early button release cuts the upward leap short
        if (jumpJustReleased && body.velocity.y < -80)
        {
            this.setVelocityY(body.velocity.y * 0.45);
        }

        // Asymmetric fall gravity: snappier, weighty descent
        if (body.velocity.y > 0)
        {
            body.setGravityY(420);
        }
        else
        {
            body.setGravityY(0);
        }

        // Animation playback according to state & velocity
        if (this.attackAnimTimer > 0)
        {
            this.attackAnimTimer = Math.max(0, this.attackAnimTimer - delta);
            return;
        }

        const hasSheet = this.scene.anims.exists(`${this.currentSkinId}-idle`);
        if (!hasSheet) return;

        if (!onGround)
        {
            if (this.isWallSliding)
            {
                this.playAnimation('wall');
            }
            else
            {
                // The air row is not played: the frame follows the vertical speed
                const vy = body.velocity.y;
                const column = vy < -JUMP_SPEED * 0.85 ? 0 : vy < -120 ? 1 : vy <= 120 ? 2 : vy < 380 ? 3 : 4;
                this.anims.stop();
                this.setFrame(this.frameOf('air', column));
            }
        }
        else if (Math.abs(body.velocity.x) > 10)
        {
            this.playAnimation('run');
        }
        else
        {
            this.playAnimation('idle');
        }
    }
}
