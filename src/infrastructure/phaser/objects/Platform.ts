import { Physics, Scene } from 'phaser';

const TEXTURE_KEY = 'platform-placeholder';
const WIDTH = 160;
const HEIGHT = 24;

/**
 * A static floating platform — pure geometry with no rules or state, so it has
 * no paired domain Entity. See "Pairing is optional, not automatic" in CONTEXT.md.
 */
export class Platform extends Physics.Arcade.Sprite
{
    constructor (scene: Scene, x: number, y: number)
    {
        Platform.ensureTexture(scene);

        super(scene, x, y, TEXTURE_KEY);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xc97b4a, 1);
        graphics.fillRect(0, 0, WIDTH, HEIGHT);
        graphics.fillStyle(0xa85f36, 1);
        graphics.fillRect(0, 0, WIDTH, 4);
        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }
}
