import { Physics, Scene } from 'phaser';

const TEXTURE_KEY = 'coin-placeholder';
const DIAMETER = 24;

/**
 * A collectible coin sprite — pure spatial/visual representation with no domain rules
 * of its own. When collected, the Game scene calls collectCoinUseCase.
 * See "Pairing is optional, not automatic" in CONTEXT.md.
 */
export class Coin extends Physics.Arcade.Sprite
{
    private isCollected = false;

    constructor (scene: Scene, x: number, y: number)
    {
        Coin.ensureTexture(scene);

        super(scene, x, y, TEXTURE_KEY);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        // Gentle floating animation
        scene.tweens.add({
            targets: this,
            y: y - 6,
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
        const radius = DIAMETER / 2;

        // Outer golden rim
        graphics.fillStyle(0xd4af37, 1);
        graphics.fillCircle(radius, radius, radius);

        // Inner coin face
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(radius, radius, radius - 2);

        // Center detail (emboss ring)
        graphics.lineStyle(1.5, 0xc59b27, 1);
        graphics.strokeCircle(radius, radius, radius - 5);

        // Specular highlight
        graphics.fillStyle(0xffffff, 0.7);
        graphics.fillEllipse(radius - 3, radius - 4, 3, 2);

        graphics.generateTexture(TEXTURE_KEY, DIAMETER, DIAMETER);
        graphics.destroy();
    }

    collect ()
    {
        if (this.isCollected) return;
        this.isCollected = true;

        this.disableBody(true, false);

        this.scene.tweens.add({
            targets: this,
            y: this.y - 30,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () =>
            {
                this.destroy();
            },
        });
    }
}
