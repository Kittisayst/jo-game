import { Physics, Scene } from 'phaser';

const TEXTURE_KEY = 'goal-flag-texture';
const WIDTH = 48;
const HEIGHT = 140;

/**
 * A visible goal flagpole at the level's finish line.
 * Pure spatial/geometry game object with no domain entity.
 * See "Pairing is optional, not automatic" in CONTEXT.md.
 */
export class GoalFlag extends Physics.Arcade.Sprite
{
    private isTriggered = false;

    constructor (scene: Scene, x: number, y: number)
    {
        GoalFlag.ensureTexture(scene);

        super(scene, x, y, TEXTURE_KEY);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        // Adjust body size to cover the pole area
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(WIDTH, HEIGHT);
        body.setOffset(0, 0);

        // Gentle pole shimmer/glow animation
        scene.tweens.add({
            targets: this,
            alpha: { from: 0.9, to: 1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Base pedestal
        graphics.fillStyle(0x334155, 1);
        graphics.fillRect(8, HEIGHT - 16, 32, 16);
        graphics.fillStyle(0x475569, 1);
        graphics.fillRect(12, HEIGHT - 20, 24, 6);

        // Silver / Gold Pole
        graphics.fillStyle(0xe2e8f0, 1);
        graphics.fillRect(20, 14, 6, HEIGHT - 30);
        graphics.fillStyle(0x94a3b8, 1);
        graphics.fillRect(24, 14, 2, HEIGHT - 30);

        // Golden Ball Finial on top
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(23, 12, 8);
        graphics.fillStyle(0xfffbeb, 0.8);
        graphics.fillCircle(21, 10, 3);

        // Waving Flag (Emerald Green Banner with gold trim)
        graphics.fillStyle(0x10b981, 1);
        graphics.beginPath();
        graphics.moveTo(26, 16);
        graphics.lineTo(46, 28);
        graphics.lineTo(26, 42);
        graphics.closePath();
        graphics.fillPath();

        // Flag gold border
        graphics.lineStyle(1.5, 0xfbbf24, 1);
        graphics.strokeTriangle(26, 16, 46, 28, 26, 42);

        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }

    celebrate ()
    {
        if (this.isTriggered) return;
        this.isTriggered = true;

        // Burst celebration tween: pulse up and shine
        this.scene.tweens.add({
            targets: this,
            scaleY: 1.15,
            scaleX: 1.1,
            duration: 200,
            yoyo: true,
            repeat: 2,
            ease: 'Back.easeOut',
        });
    }
}
