import { Physics, Scene } from 'phaser';

const TEXTURE_KEY = 'player-placeholder';
const WIDTH = 32;
const HEIGHT = 48;

const MOVE_SPEED = 220;
const JUMP_SPEED = 420;

export class Player extends Physics.Arcade.Sprite
{
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
        graphics.fillStyle(0x3ea8ff, 1);
        graphics.fillRect(0, 0, WIDTH, HEIGHT);
        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }

    update (cursors: Phaser.Types.Input.Keyboard.CursorKeys)
    {
        const body = this.body as Phaser.Physics.Arcade.Body;

        if (cursors.left.isDown)
        {
            this.setVelocityX(-MOVE_SPEED);
        }
        else if (cursors.right.isDown)
        {
            this.setVelocityX(MOVE_SPEED);
        }
        else
        {
            this.setVelocityX(0);
        }

        if (cursors.up.isDown && body.blocked.down)
        {
            this.setVelocityY(-JUMP_SPEED);
        }
    }
}
