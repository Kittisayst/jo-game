import { Physics, Scene } from 'phaser';

const PLASMA_TEXTURE = 'projectile-plasma-bolt';
const DISC_TEXTURE = 'projectile-cyber-disc';

export interface ProjectileConfig
{
    weaponId: string;
    damage: number;
    dir: number; // -1 for left, 1 for right
    speed: number;
    maxDistance?: number;
    pierce?: boolean;
    isBoomerang?: boolean;
}

export class Projectile extends Physics.Arcade.Sprite
{
    damage = 1;
    weaponId = 'plasma-blaster';
    startX = 0;
    maxDistance = 500;
    isBoomerang = false;
    isReturning = false;
    pierce = false;
    private travelDir = 1;

    constructor (scene: Scene, x: number, y: number, config: ProjectileConfig)
    {
        Projectile.ensureTextures(scene);

        const textureKey = config.weaponId === 'boomerang-disc' ? DISC_TEXTURE : PLASMA_TEXTURE;
        super(scene, x, y, textureKey);

        this.startX = x;
        this.damage = config.damage;
        this.weaponId = config.weaponId;
        this.travelDir = config.dir;
        this.maxDistance = config.maxDistance ?? (config.weaponId === 'boomerang-disc' ? 320 : 540);
        this.pierce = Boolean(config.pierce);
        this.isBoomerang = Boolean(config.isBoomerang);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDepth(12);

        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.setAllowGravity(false);
            if (config.weaponId === 'boomerang-disc')
            {
                body.setSize(18, 18);
            }
            else
            {
                body.setSize(22, 10);
            }
        }

        this.setVelocityX(this.travelDir * config.speed);
        if (config.dir < 0 && config.weaponId !== 'boomerang-disc')
        {
            this.setFlipX(true);
        }

        // Disc spinning tween
        if (config.weaponId === 'boomerang-disc')
        {
            scene.tweens.add({
                targets: this,
                angle: 360 * config.dir,
                duration: 250,
                repeat: -1,
                ease: 'Linear',
            });
        }
    }

    private static ensureTextures (scene: Scene)
    {
        if (!scene.textures.exists(PLASMA_TEXTURE))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            // Plasma glow outer
            g.fillStyle(0x06b6d4, 0.6);
            g.fillRoundedRect(0, 0, 24, 10, 5);
            // Plasma laser core
            g.fillStyle(0x38bdf8, 0.9);
            g.fillRoundedRect(3, 2, 18, 6, 3);
            g.fillStyle(0xffffff, 1);
            g.fillRoundedRect(6, 3, 12, 4, 2);
            g.generateTexture(PLASMA_TEXTURE, 24, 10);
            g.destroy();
        }

        if (!scene.textures.exists(DISC_TEXTURE))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            // Glowing cyan disc ring
            g.fillStyle(0x06b6d4, 1);
            g.fillCircle(10, 10, 10);
            // Golden inner saw
            g.fillStyle(0xf59e0b, 1);
            g.fillCircle(10, 10, 6);
            // Core
            g.fillStyle(0xffffff, 1);
            g.fillCircle(10, 10, 3);
            g.generateTexture(DISC_TEXTURE, 20, 20);
            g.destroy();
        }
    }

    preUpdate (time: number, delta: number)
    {
        super.preUpdate(time, delta);

        const dist = Math.abs(this.x - this.startX);

        if (this.isBoomerang)
        {
            if (!this.isReturning && dist >= this.maxDistance)
            {
                this.isReturning = true;
                const body = this.body as Phaser.Physics.Arcade.Body;
                if (body)
                {
                    body.setVelocityX(-this.travelDir * 380);
                }
            }
            else if (this.isReturning && ((this.travelDir > 0 && this.x <= this.startX) || (this.travelDir < 0 && this.x >= this.startX)))
            {
                this.destroy();
                return;
            }
        }
        else if (dist >= this.maxDistance)
        {
            this.destroy();
            return;
        }

        // Screen boundary safety
        if (this.x < 0 || this.x > 5000)
        {
            this.destroy();
        }
    }
}
