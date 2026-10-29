import { Physics, Scene } from 'phaser';

const TEXTURE_KEY = 'moving-platform-texture';
const FALLBACK_KEY = 'moving-platform-hover';
const WIDTH = 140;
const HEIGHT = 24;

export interface MovingPlatformConfig
{
    distanceX?: number;
    distanceY?: number;
    speed?: number;
}

/**
 * A moving hover platform with Arcade Physics.
 * Uses velocity-based translation with friction to allow the player to ride smoothly on top.
 * Lives in infrastructure layer — see CONTEXT.md.
 */
export class MovingPlatform extends Physics.Arcade.Sprite
{
    private startX: number;
    private startY: number;
    private distanceX: number;
    private distanceY: number;
    private speed: number;
    private dirX = 1;
    private dirY = 1;

    constructor (scene: Scene, x: number, y: number, config?: MovingPlatformConfig)
    {
        MovingPlatform.ensureTexture(scene);
        const textureToUse = scene.textures.exists(TEXTURE_KEY) ? TEXTURE_KEY : FALLBACK_KEY;

        super(scene, x, y, textureToUse);

        this.startX = x;
        this.startY = y;
        this.distanceX = config?.distanceX ?? 0;
        this.distanceY = config?.distanceY ?? 0;
        this.speed = config?.speed ?? 75;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.activate();
    }

    /**
     * Makes the platform hover and start moving. Call it again after adding the platform to a
     * physics group: the group applies its own defaults (gravity on, not immovable) and would
     * otherwise let the platform fall out of the world.
     */
    activate (): void
    {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        body.setImmovable(true);
        body.setAllowGravity(false);
        // High friction ensures bodies standing on it move along with the platform
        body.friction.x = 1;
        body.friction.y = 1;

        // One-way jump-through support for hover moving platforms
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        body.checkCollision.up = true;

        // Start initial velocity
        if (this.distanceX > 0)
        {
            body.velocity.x = this.speed;
        }
        if (this.distanceY > 0)
        {
            body.velocity.y = this.speed;
        }
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Outer chassis (dark graphite/slate)
        graphics.fillStyle(0x1e293b, 1);
        graphics.fillRoundedRect(0, 0, WIDTH, HEIGHT, 6);

        // Top metal grip plate
        graphics.fillStyle(0x334155, 1);
        graphics.fillRoundedRect(4, 2, WIDTH - 8, 8, 3);

        // Glowing cyan energy line
        graphics.fillStyle(0x06b6d4, 1);
        graphics.fillRect(8, 3, WIDTH - 16, 2);

        // Center energy core (electric blue)
        graphics.fillStyle(0x38bdf8, 1);
        graphics.fillRoundedRect(WIDTH / 2 - 20, 12, 40, 6, 2);

        // Side hazard/thruster lights (warm amber)
        graphics.fillStyle(0xf59e0b, 1);
        graphics.fillCircle(12, 15, 3);
        graphics.fillCircle(WIDTH - 12, 15, 3);

        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }

    update (): void
    {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        // Horizontal oscillation
        if (this.distanceX > 0)
        {
            if (this.x >= this.startX + this.distanceX)
            {
                this.dirX = -1;
            }
            else if (this.x <= this.startX)
            {
                this.dirX = 1;
            }
            body.velocity.x = this.dirX * this.speed;
        }

        // Vertical oscillation
        if (this.distanceY > 0)
        {
            if (this.y >= this.startY + this.distanceY)
            {
                this.dirY = -1;
            }
            else if (this.y <= this.startY)
            {
                this.dirY = 1;
            }
            body.velocity.y = this.dirY * this.speed;
        }
    }
}
