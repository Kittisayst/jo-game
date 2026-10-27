import { Physics, Scene } from 'phaser';
import { PowerUpType } from '../../../domain/entities/PowerUp';

const SIZE = 28;

/**
 * Collectible power-up sprite (Heart, Star, Spring Boot).
 * Pure spatial/geometry game object — see "Pairing is optional, not automatic" in CONTEXT.md.
 */
export class PowerUp extends Physics.Arcade.Sprite
{
    readonly powerUpType: PowerUpType;
    private isCollected = false;

    constructor (scene: Scene, x: number, y: number, type: PowerUpType)
    {
        const textureKey = PowerUp.ensureTexture(scene, type);

        super(scene, x, y, textureKey);
        this.powerUpType = type;

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        // Floating animation
        scene.tweens.add({
            targets: this,
            y: y - 8,
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        // Pulsing glow
        scene.tweens.add({
            targets: this,
            scale: { from: 1, to: 1.12 },
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Quad.easeInOut',
        });
    }

    private static ensureTexture (scene: Scene, type: PowerUpType): string
    {
        const textureKey = `powerup-${type}`;
        if (scene.textures.exists(textureKey)) return textureKey;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        if (type === 'heart')
        {
            // Heart shape (vibrant ruby red with white shine)
            graphics.fillStyle(0xef4444, 1);
            graphics.fillCircle(10, 10, 8);
            graphics.fillCircle(18, 10, 8);
            graphics.fillTriangle(2, 11, 26, 11, 14, 25);

            // Specular highlight
            graphics.fillStyle(0xffffff, 0.7);
            graphics.fillCircle(8, 8, 2.5);
        }
        else if (type === 'star')
        {
            // Golden Star (5-point star)
            graphics.fillStyle(0xffd700, 1);
            const cx = 14;
            const cy = 14;
            const outerR = 12;
            const innerR = 5;
            const points: { x: number; y: number }[] = [];

            for (let i = 0; i < 10; i++)
            {
                const r = i % 2 === 0 ? outerR : innerR;
                const angle = (i * Math.PI) / 5 - Math.PI / 2;
                points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
            }

            graphics.lineStyle(1.5, 0xf59e0b, 1);
            graphics.beginPath();
            graphics.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++)
            {
                graphics.lineTo(points[i].x, points[i].y);
            }
            graphics.closePath();
            graphics.fillPath();
            graphics.strokePath();

            // Center gleam
            graphics.fillStyle(0xffffff, 0.85);
            graphics.fillCircle(cx - 2, cy - 2, 2.5);
        }
        else if (type === 'spring')
        {
            // Spring Boot (Electric Cyan with amber spring coils)
            graphics.fillStyle(0x06b6d4, 1);
            graphics.fillRoundedRect(4, 4, 20, 12, 3);
            graphics.fillRoundedRect(12, 12, 14, 6, 2);

            // Spring coil underneath
            graphics.lineStyle(2.5, 0xfbbf24, 1);
            graphics.beginPath();
            graphics.moveTo(8, 18);
            graphics.lineTo(20, 18);
            graphics.lineTo(10, 22);
            graphics.lineTo(20, 22);
            graphics.lineTo(12, 26);
            graphics.lineTo(18, 26);
            graphics.strokePath();

            // Wing accent
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillTriangle(4, 6, 0, 1, 4, 10);
        }

        graphics.generateTexture(textureKey, SIZE, SIZE);
        graphics.destroy();

        return textureKey;
    }

    collect ()
    {
        if (this.isCollected) return;
        this.isCollected = true;

        this.disableBody(true, false);

        this.scene.tweens.add({
            targets: this,
            y: this.y - 35,
            scale: 1.6,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () =>
            {
                this.destroy();
            },
        });
    }
}
