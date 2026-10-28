import { Physics, Scene } from 'phaser';

const TEXTURE_KEY = 'door-texture';
const FALLBACK_KEY = 'village-door-texture';
const WIDTH = 84;
const HEIGHT = 140;

/**
 * A grand Village Doorway / Portal leading into Level 1.
 * Pure spatial/geometry game object — see "Pairing is optional, not automatic" in CONTEXT.md.
 */
export class Door extends Physics.Arcade.Sprite
{
    private isTriggered = false;

    constructor (scene: Scene, x: number, y: number)
    {
        Door.ensureTexture(scene);
        const textureToUse = scene.textures.exists(TEXTURE_KEY) ? TEXTURE_KEY : FALLBACK_KEY;

        super(scene, x, y, textureToUse);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(WIDTH, HEIGHT);
        body.setOffset(0, 0);
        this.setDepth(3);

        // Gentle portal breathing / glow tween
        scene.tweens.add({
            targets: this,
            scaleY: { from: 1, to: 1.04 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Outer stone arch frame
        graphics.fillStyle(0x334155, 1);
        graphics.fillRoundedRect(4, 10, WIDTH - 8, HEIGHT - 10, 16);

        // Stone border highlight
        graphics.lineStyle(3, 0x64748b, 1);
        graphics.strokeRoundedRect(4, 10, WIDTH - 8, HEIGHT - 10, 16);

        // Keystone on top of arch
        graphics.fillStyle(0xf59e0b, 1);
        graphics.fillRect(WIDTH / 2 - 10, 6, 20, 12);
        graphics.lineStyle(1.5, 0xfef3c7, 1);
        graphics.strokeRect(WIDTH / 2 - 10, 6, 20, 12);

        // Inner glowing doorway portal
        graphics.fillStyle(0x0284c7, 0.95);
        graphics.fillRoundedRect(14, 24, WIDTH - 28, HEIGHT - 26, 12);

        // Portal swirl energy
        graphics.fillStyle(0x38bdf8, 0.7);
        graphics.fillCircle(WIDTH / 2, HEIGHT / 2 + 10, 22);
        graphics.fillStyle(0xbae6fd, 0.85);
        graphics.fillCircle(WIDTH / 2, HEIGHT / 2 + 10, 10);

        // Wooden Door planks pattern overlay (semi-translucent mystical door)
        graphics.lineStyle(2, 0x0c4a6e, 0.8);
        graphics.strokeRoundedRect(14, 24, WIDTH - 28, HEIGHT - 26, 12);
        graphics.lineBetween(WIDTH / 2, 24, WIDTH / 2, HEIGHT - 2);

        // Golden door handles / rings
        graphics.fillStyle(0xfbbf24, 1);
        graphics.fillCircle(WIDTH / 2 - 8, HEIGHT / 2 + 14, 4);
        graphics.fillCircle(WIDTH / 2 + 8, HEIGHT / 2 + 14, 4);

        // Torches / lanterns on left and right pillars
        graphics.fillStyle(0x78350f, 1);
        graphics.fillRect(0, 50, 6, 18);
        graphics.fillRect(WIDTH - 6, 50, 6, 18);

        // Lantern flame glow
        graphics.fillStyle(0xf59e0b, 1);
        graphics.fillCircle(3, 48, 5);
        graphics.fillCircle(WIDTH - 3, 48, 5);
        graphics.fillStyle(0xfef08a, 0.9);
        graphics.fillCircle(3, 48, 2.5);
        graphics.fillCircle(WIDTH - 3, 48, 2.5);

        // Base foundation step
        graphics.fillStyle(0x1e293b, 1);
        graphics.fillRect(0, HEIGHT - 10, WIDTH, 10);

        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }

    celebrate ()
    {
        if (this.isTriggered) return;
        this.isTriggered = true;

        this.scene.tweens.add({
            targets: this,
            scaleY: 1.15,
            scaleX: 1.15,
            duration: 250,
            yoyo: true,
            repeat: 2,
            ease: 'Back.easeOut',
        });
    }
}
