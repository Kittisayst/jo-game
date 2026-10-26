import { Physics, Scene } from 'phaser';
import { Boss as BossEntity } from '../../../domain/entities/Boss';
import { damageBossUseCase } from '../../../application/DamageBossUseCase';
import { Score } from '../../../domain/entities/Score';

const TEXTURE_KEY = 'boss-king-slime';
const WIDTH = 96;
const HEIGHT = 72;

/**
 * Phaser arcade sprite representing the King Slime Boss.
 * Pairs with the Boss domain entity — see CONTEXT.md.
 */
export class Boss extends Physics.Arcade.Sprite
{
    entity: BossEntity;
    isInvulnerable = false;
    private jumpCooldown = 0;
    private wasInAir = false;

    onLanding?: (x: number, y: number) => void;
    onDefeated?: (x: number, y: number) => void;

    constructor (scene: Scene, x: number, y: number, maxHp = 5)
    {
        Boss.ensureTexture(scene);

        super(scene, x, y, TEXTURE_KEY);

        this.entity = new BossEntity(maxHp, 1000);

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
        // Left peak
        graphics.moveTo(crownX, crownY + 12);
        graphics.lineTo(crownX + 4, crownY + 2);
        graphics.lineTo(crownX + 12, crownY + 12);
        // Center peak (tallest)
        graphics.lineTo(crownX + 20, crownY);
        graphics.lineTo(crownX + 28, crownY + 12);
        // Right peak
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

    update (playerX: number): void
    {
        if (this.entity.isDefeated || !this.body) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        const isOnGround = body.blocked.down || body.touching.down;

        // Detect landing
        if (this.wasInAir && isOnGround)
        {
            this.wasInAir = false;
            this.scene.cameras.main.shake(120, 0.004);
            this.onLanding?.(this.x, this.y + HEIGHT / 2);

            // Squash on land
            this.scene.tweens.add({
                targets: this,
                scaleX: 1.25,
                scaleY: 0.8,
                duration: 90,
                yoyo: true,
            });
        }
        else if (!isOnGround)
        {
            this.wasInAir = true;
        }

        // Periodic jump attack towards player
        this.jumpCooldown += 16;
        const jumpInterval = this.entity.currentHp <= 2 ? 1800 : 2500;

        if (isOnGround && this.jumpCooldown >= jumpInterval && !this.isInvulnerable)
        {
            this.jumpCooldown = 0;
            const dir = playerX < this.x ? -1 : 1;
            const isEnraged = this.entity.currentHp <= 2;

            const jumpVelocityY = isEnraged ? -460 : -380;
            const jumpVelocityX = isEnraged ? dir * 160 : dir * 110;

            this.setVelocity(jumpVelocityX, jumpVelocityY);

            // Stretch when leaping
            this.scene.tweens.add({
                targets: this,
                scaleX: 0.85,
                scaleY: 1.2,
                duration: 100,
                yoyo: true,
            });
        }
    }

    takeDamage (score: Score): boolean
    {
        if (this.isInvulnerable || this.entity.isDefeated) return false;

        this.isInvulnerable = true;

        const isDefeated = damageBossUseCase(this.entity, score, 1);

        // Flash invulnerability tween
        this.scene.tweens.add({
            targets: this,
            alpha: 0.3,
            tint: 0xff4444,
            duration: 100,
            yoyo: true,
            repeat: 5,
            onComplete: () =>
            {
                this.clearTint();
                this.alpha = 1;
                this.isInvulnerable = false;
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
        }

        return true;
    }

    private handleDefeated (): void
    {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.enable = false;
        }

        this.scene.cameras.main.shake(400, 0.015);
        this.onDefeated?.(this.x, this.y);

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
