import { Physics, Scene } from 'phaser';
import { soundManager } from '../../audio/SoundManager';

const TEXTURE_KEY = 'player-placeholder';
const WIDTH = 32;
const HEIGHT = 48;

const MOVE_SPEED = 220;
const JUMP_SPEED = 420;

export class Player extends Physics.Arcade.Sprite
{
    isInvincible = false;
    private isKnockedBack = false;
    private wasInAir = false;

    onJump?: (x: number, y: number) => void;
    onLand?: (x: number, y: number) => void;

    constructor (scene: Scene, x: number, y: number)
    {
        Player.ensureTexture(scene);

        super(scene, x, y, TEXTURE_KEY);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Body suit (vibrant cyan-blue)
        graphics.fillStyle(0x0284c7, 1);
        graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);

        // Head/Helmet visor band (dark navy)
        graphics.fillStyle(0x0f172a, 1);
        graphics.fillRect(4, 8, WIDTH - 8, 12);

        // Glowing visor eye (bright electric cyan)
        graphics.fillStyle(0x38bdf8, 1);
        graphics.fillRect(8, 11, WIDTH - 16, 6);

        // Chest core / badge (amber gold)
        graphics.fillStyle(0xf59e0b, 1);
        graphics.fillCircle(WIDTH / 2, 28, 4);

        // Belt (dark slate)
        graphics.fillStyle(0x1e293b, 1);
        graphics.fillRect(2, 34, WIDTH - 4, 4);

        // Boots (dark blue)
        graphics.fillStyle(0x0369a1, 1);
        graphics.fillRect(2, HEIGHT - 8, 12, 8);
        graphics.fillRect(WIDTH - 14, HEIGHT - 8, 12, 8);

        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }

    triggerDamage (sourceX: number): void
    {
        if (this.isInvincible) return;

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
            this.setVelocityY(-JUMP_SPEED);
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
