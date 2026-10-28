import { Physics, Scene } from 'phaser';

const TEXTURE_KEY = 'platform-texture';
const FALLBACK_KEY = 'platform-placeholder';
const WIDTH = 160;
const HEIGHT = 28;

/**
 * A static floating platform — pure geometry with no rules or state, so it has
 * no paired domain Entity. See "Pairing is optional, not automatic" in CONTEXT.md.
 */
export class Platform extends Physics.Arcade.Sprite
{
    constructor (scene: Scene, x: number, y: number)
    {
        Platform.ensureTexture(scene);
        const textureToUse = scene.textures.exists(TEXTURE_KEY) ? TEXTURE_KEY : FALLBACK_KEY;

        super(scene, x, y, textureToUse);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        if (body)
        {
            body.setSize(WIDTH, HEIGHT);
            body.setOffset(0, 0);
            // One-way jump-through platform: player can jump through bottom and land on top
            body.checkCollision.down = false;
            body.checkCollision.left = false;
            body.checkCollision.right = false;
            body.checkCollision.up = true;
        }
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY) || scene.textures.exists(FALLBACK_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xc97b4a, 1);
        graphics.fillRect(0, 0, WIDTH, 24);
        graphics.fillStyle(0xa85f36, 1);
        graphics.fillRect(0, 0, WIDTH, 4);
        graphics.generateTexture(FALLBACK_KEY, WIDTH, 24);
        graphics.destroy();
    }
}
