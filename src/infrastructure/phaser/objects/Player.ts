import { Physics, Scene } from 'phaser';
import { soundManager } from '../../audio/SoundManager';

const WIDTH = 32;
const HEIGHT = 48;


const MOVE_SPEED = 220;
const JUMP_SPEED = 420;
const SPRING_JUMP_SPEED = 560;

export class Player extends Physics.Arcade.Sprite
{
    isInvincible = false;
    hasStarPower = false;
    hasSpringPower = false;
    private jumpSpeed = JUMP_SPEED;
    private isKnockedBack = false;
    private wasInAir = false;

    onJump?: (x: number, y: number) => void;
    onLand?: (x: number, y: number) => void;

    constructor (scene: Scene, x: number, y: number, skinId = 'cyber-blue')
    {
        Player.ensureSkinTexture(scene, skinId);

        super(scene, x, y, `player-skin-${skinId}`);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
    }

    setSkin (skinId: string): void
    {
        Player.ensureSkinTexture(this.scene, skinId);
        this.setTexture(`player-skin-${skinId}`);
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

        // Invincibility flashing tween (1.4s)
        this.scene.tweens.add({
            targets: this,
            alpha: 0.25,
            duration: 100,
            yoyo: true,
            repeat: 6,
            onComplete: () =>
            {
                this.alpha = 1;
                this.isInvincible = false;
            },
        });
    }

    activateStar (durationMs = 8000): void
    {
        this.hasStarPower = true;

        const tints = [0xff0000, 0xf97316, 0xfacc15, 0x10b981, 0x06b6d4, 0x8b5cf6, 0xec4899];
        let tintIndex = 0;

        const rainbowTimer = this.scene.time.addEvent({
            delay: 90,
            repeat: Math.floor(durationMs / 90),
            callback: () =>
            {
                this.setTint(tints[tintIndex % tints.length]);
                tintIndex++;
            },
        });

        this.scene.time.delayedCall(durationMs, () =>
        {
            this.hasStarPower = false;
            this.clearTint();
            rainbowTimer.remove();
        });
    }

    activateSpring (durationMs = 10000): void
    {
        this.hasSpringPower = true;
        this.jumpSpeed = SPRING_JUMP_SPEED;

        if (!this.hasStarPower)
        {
            this.setTint(0x38bdf8);
        }

        this.scene.time.delayedCall(durationMs, () =>
        {
            this.hasSpringPower = false;
            this.jumpSpeed = JUMP_SPEED;
            if (!this.hasStarPower)
            {
                this.clearTint();
            }
        });
    }

    update (cursors: Phaser.Types.Input.Keyboard.CursorKeys)
    {
        if (this.isKnockedBack) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        const onGround = body.blocked.down;

        // Landing detection
        if (this.wasInAir && onGround)
        {
            this.onLand?.(this.x, this.y + HEIGHT / 2);

            // Subtle landing squash
            this.scene.tweens.add({
                targets: this,
                scaleY: 0.88,
                scaleX: 1.12,
                duration: 90,
                yoyo: true,
                ease: 'Quad.easeOut',
            });
        }
        this.wasInAir = !onGround;

        // Horizontal movement
        if (cursors.left.isDown)
        {
            this.setVelocityX(-MOVE_SPEED);
            this.setFlipX(true);
        }
        else if (cursors.right.isDown)
        {
            this.setVelocityX(MOVE_SPEED);
            this.setFlipX(false);
        }
        else
        {
            this.setVelocityX(0);
        }

        // Jump action
        if (cursors.up.isDown && onGround)
        {
            this.setVelocityY(-this.jumpSpeed);
            soundManager.playJump();
            this.onJump?.(this.x, this.y + HEIGHT / 2);

            // Subtle jump stretch
            this.scene.tweens.add({
                targets: this,
                scaleY: 1.15,
                scaleX: 0.9,
                duration: 110,
                yoyo: true,
                ease: 'Quad.easeOut',
            });
        }
    }
}
