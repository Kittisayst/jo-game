import { Physics, Scene } from 'phaser';
import { Enemy as EnemyEntity } from '../../../domain/entities/Enemy';

const TEXTURE_KEY = 'enemy-slime';
const WIDTH = 32;
const HEIGHT = 28;

/**
 * An Arcade Physics sprite representing an enemy in the level.
 * Pairs directly with the domain Enemy entity — see "Sprite-entity pairing" in CONTEXT.md.
 */
export class Enemy extends Physics.Arcade.Sprite
{
    readonly entity: EnemyEntity;
    private leftBound: number;
    private rightBound: number;
    private speed: number;
    private isDefeated = false;

    constructor (
        scene: Scene,
        x: number,
        y: number,
        patrolDistance = 160,
        speed = 70,
        points = 100
    )
    {
        Enemy.ensureTexture(scene);

        super(scene, x, y, TEXTURE_KEY);

        this.entity = new EnemyEntity(points);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0, 0);

        const halfDistance = patrolDistance / 2;
        this.leftBound = x - halfDistance;
        this.rightBound = x + halfDistance;
        this.speed = speed;

        this.setVelocityX(this.speed);
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Slime body (crimson gradient style)
        graphics.fillStyle(0xd946ef, 1); // Neon magenta-crimson
        graphics.fillRoundedRect(2, 6, WIDTH - 4, HEIGHT - 6, 8);

        // Top cap / horn
        graphics.fillStyle(0xa21caf, 1);
        graphics.fillTriangle(WIDTH / 2 - 4, 6, WIDTH / 2 + 4, 6, WIDTH / 2, 0);

        // Eyes (white with glowing cyan pupils)
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(10, 14, 4);
        graphics.fillCircle(22, 14, 4);

        graphics.fillStyle(0x06b6d4, 1); // Cyan pupils
        graphics.fillCircle(11, 14, 2);
        graphics.fillCircle(23, 14, 2);

        // Angry / determined eyebrows
        graphics.lineStyle(2, 0x4a044e, 1);
        graphics.lineBetween(7, 9, 13, 11);
        graphics.lineBetween(25, 9, 19, 11);

        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }

    update ()
    {
        if (this.isDefeated) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        // Turn around at patrol boundaries or when blocked by wall
        if (this.x >= this.rightBound || body.blocked.right)
        {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        }
        else if (this.x <= this.leftBound || body.blocked.left)
        {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        }
    }

    squashAndDefeat ()
    {
        if (this.isDefeated) return;
        this.isDefeated = true;

        this.disableBody(true, false);

        this.scene.tweens.add({
            targets: this,
            scaleY: 0.15,
            scaleX: 1.4,
            alpha: 0,
            duration: 200,
            ease: 'Cubic.easeOut',
            onComplete: () =>
            {
                this.destroy();
            },
        });
    }
}
