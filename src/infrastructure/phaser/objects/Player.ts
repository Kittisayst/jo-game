import { Physics, Scene } from 'phaser';
import { soundManager } from '../../audio/SoundManager';

const WIDTH = 32;
const HEIGHT = 48;


const MOVE_SPEED = 220;
const JUMP_SPEED = 420;
const SPRING_JUMP_SPEED = 560;

export interface PlayerInputControls
{
    left: { isDown: boolean };
    right: { isDown: boolean };
    up: { isDown: boolean };
}

export class Player extends Physics.Arcade.Sprite
{
    isInvincible = false;
    hasStarPower = false;
    hasSpringPower = false;
    facingDir = 1;
    isDashing = false;
    dashCooldownTimer = 0;
    isWallSliding = false;
    private wallJumpLockout = 0;
    private currentSkinId = 'cyber-blue';
    private jumpSpeed = JUMP_SPEED;
    private isKnockedBack = false;
    private wasInAir = false;
    private coyoteTimer = 0;
    private jumpBufferTimer = 0;
    private wasJumpDown = false;
    private footstepTimer = 0;
    private runDustTimer = 0;

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

        // Tuned collision box (22x44 with 5px horizontal offset, 4px vertical offset)
        this.setSize(22, 44);
        this.setOffset(5, 4);
        this.setCollideWorldBounds(true);
        this.setDepth(10);

        // Terminal velocity limits to prevent tunneling during extreme leaps/falls
        this.setMaxVelocity(320, 650);

        this.initAnimations(skinId);
    }

    setSkin (skinId: string): void
    {
        this.currentSkinId = skinId;
        Player.ensureSkinTexture(this.scene, skinId);
        this.setTexture(`player-skin-${skinId}`);
        this.initAnimations(skinId);
    }

    private initAnimations (skinId: string): void
    {
        const anims = this.scene.anims;
        const textureKey = `player-skin-${skinId}`;
        const texture = this.scene.textures.get(textureKey);

        if (!texture || texture.frameTotal <= 1) return;

        const idleKey = `${skinId}-idle`;
        const runKey = `${skinId}-run`;
        const jumpKey = `${skinId}-jump`;
        const fallKey = `${skinId}-fall`;

        if (!anims.exists(idleKey))
        {
            anims.create({
                key: idleKey,
                frames: anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
                frameRate: 6,
                repeat: -1,
            });
        }

        if (!anims.exists(runKey))
        {
            anims.create({
                key: runKey,
                frames: anims.generateFrameNumbers(textureKey, { start: 4, end: 9 }),
                frameRate: 11,
                repeat: -1,
            });
        }

        if (!anims.exists(jumpKey))
        {
            anims.create({
                key: jumpKey,
                frames: [{ key: textureKey, frame: 10 }],
                frameRate: 1,
            });
        }

        if (!anims.exists(fallKey))
        {
            anims.create({
                key: fallKey,
                frames: [{ key: textureKey, frame: 11 }],
                frameRate: 1,
            });
        }
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


    triggerDamage (sourceX: number): void
    {
        if (this.isInvincible || this.hasStarPower) return;

        this.isInvincible = true;
        this.isKnockedBack = true;

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

    private rainbowTimer?: Phaser.Time.TimerEvent;

    setStarPower (active: boolean): void
    {
        this.hasStarPower = active;

        if (active)
        {
            if (this.rainbowTimer)
            {
                this.rainbowTimer.remove();
            }

            const tints = [0xff0000, 0xf97316, 0xfacc15, 0x10b981, 0x06b6d4, 0x8b5cf6, 0xec4899];
            let tintIndex = 0;

            this.rainbowTimer = this.scene.time.addEvent({
                delay: 90,
                loop: true,
                callback: () =>
                {
                    this.setTint(tints[tintIndex % tints.length]);
                    tintIndex++;
                },
            });
        }
        else
        {
            if (this.rainbowTimer)
            {
                this.rainbowTimer.remove();
                this.rainbowTimer = undefined;
            }
            if (this.hasSpringPower)
            {
                this.setTint(0x38bdf8);
            }
            else
            {
                this.clearTint();
            }
        }
    }

    setSpringPower (active: boolean): void
    {
        this.hasSpringPower = active;
        this.jumpSpeed = active ? SPRING_JUMP_SPEED : JUMP_SPEED;

        if (!this.hasStarPower)
        {
            if (active)
            {
                this.setTint(0x38bdf8);
            }
            else
            {
                this.clearTint();
            }
        }
    }

    activateStar (durationMs = 8000): void
    {
        this.setStarPower(true);
        if (durationMs > 0)
        {
            this.scene.time.delayedCall(durationMs, () =>
            {
                if (!this.scene || !this.active) return;
                this.setStarPower(false);
            });
        }
    }

    activateSpring (durationMs = 10000): void
    {
        this.setSpringPower(true);
        if (durationMs > 0)
        {
            this.scene.time.delayedCall(durationMs, () =>
            {
                if (!this.scene || !this.active) return;
                this.setSpringPower(false);
            });
        }
    }

    dash (dir?: number): boolean
    {
        if (this.dashCooldownTimer > 0 || this.isKnockedBack || this.isDashing) return false;

        const dashDir = typeof dir === 'number' && dir !== 0 ? Math.sign(dir) : this.facingDir;
        this.isDashing = true;
        this.isInvincible = true;
        this.dashCooldownTimer = 1100;
        soundManager.playDash();

        this.setMaxVelocity(600, 650);
        this.setVelocityX(dashDir * 520);
        this.setVelocityY(0);

        // Ghost trails
        for (let i = 0; i < 3; i++)
        {
            this.scene.time.delayedCall(i * 40, () =>
            {
                if (!this.active || !this.scene) return;
                const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);
                ghost.setFlipX(this.flipX);
                ghost.setTint(0x38bdf8);
                ghost.setAlpha(0.65);
                ghost.setDepth(9);
                this.scene.tweens.add({
                    targets: ghost,
                    alpha: 0,
                    scaleX: 1.1,
                    scaleY: 0.9,
                    duration: 160,
                    onComplete: () => ghost.destroy(),
                });
            });
        }

        this.scene.time.delayedCall(160, () =>
        {
            this.isDashing = false;
            this.isInvincible = false;
            this.setMaxVelocity(320, 650);
            if (this.body)
            {
                this.setVelocityX(dashDir * MOVE_SPEED);
            }
        });

        return true;
    }

    triggerSlashVfx (weaponId: string): void
    {
        const slashX = this.x + (this.facingDir * 30);
        const slashY = this.y;

        const slash = this.scene.add.graphics({ x: slashX, y: slashY });
        slash.setDepth(15);

        if (weaponId === 'cyber-saber')
        {
            const color = 0x06b6d4;
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
        if (this.dashCooldownTimer > 0)
        {
            this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - delta);
        }

        if (this.isKnockedBack) return;
        if (this.isDashing) return;

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
                this.setVelocityX(-MOVE_SPEED);
                this.setFlipX(true);
                this.facingDir = -1;
            }
            else if (controls.right.isDown)
            {
                this.setVelocityX(MOVE_SPEED);
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
            this.setVelocityY(-this.jumpSpeed);
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
            this.setVelocityY(-this.jumpSpeed * 0.95);
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
        const idleKey = `${this.currentSkinId}-idle`;
        const runKey = `${this.currentSkinId}-run`;
        const jumpKey = `${this.currentSkinId}-jump`;
        const fallKey = `${this.currentSkinId}-fall`;

        if (!onGround)
        {
            if (body.velocity.y < 0)
            {
                if (this.scene.anims.exists(jumpKey))
                {
                    this.play(jumpKey, true);
                }
            }
            else
            {
                if (this.scene.anims.exists(fallKey))
                {
                    this.play(fallKey, true);
                }
            }
        }
        else
        {
            if (Math.abs(body.velocity.x) > 10)
            {
                if (this.scene.anims.exists(runKey))
                {
                    this.play(runKey, true);
                }
            }
            else
            {
                if (this.scene.anims.exists(idleKey))
                {
                    this.play(idleKey, true);
                }
            }
        }
    }
}
