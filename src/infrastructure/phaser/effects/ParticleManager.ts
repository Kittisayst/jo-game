import { Scene } from 'phaser';

const SPARK_KEY = 'fx-spark-particle';
const DUST_KEY = 'fx-dust-particle';

/**
 * Manages visual particle effects in the Phaser scene.
 * Generates lightweight textures lazily and controls burst particle emitters.
 * Lives in infrastructure layer — see CONTEXT.md.
 */
export class ParticleManager
{
    private scene: Scene;
    private coinEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private stompEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private celebrationEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor (scene: Scene)
    {
        this.scene = scene;
        ParticleManager.ensureTextures(scene);
        this.createEmitters();
    }

    private static ensureTextures (scene: Scene)
    {
        // Sparkle / Star particle (8x8)
        if (!scene.textures.exists(SPARK_KEY))
        {
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 1);
            // 4-point star shape
            graphics.beginPath();
            graphics.moveTo(4, 0);
            graphics.lineTo(5, 3);
            graphics.lineTo(8, 4);
            graphics.lineTo(5, 5);
            graphics.lineTo(4, 8);
            graphics.lineTo(3, 5);
            graphics.lineTo(0, 4);
            graphics.lineTo(3, 3);
            graphics.closePath();
            graphics.fillPath();

            graphics.generateTexture(SPARK_KEY, 8, 8);
            graphics.destroy();
        }

        // Dust puff particle (6x6 soft circle)
        if (!scene.textures.exists(DUST_KEY))
        {
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0xffffff, 0.9);
            graphics.fillCircle(3, 3, 3);

            graphics.generateTexture(DUST_KEY, 6, 6);
            graphics.destroy();
        }
    }

    private createEmitters ()
    {
        // Coin collect sparkles (golden yellow / amber)
        this.coinEmitter = this.scene.add.particles(0, 0, SPARK_KEY, {
            emitting: false,
            lifespan: { min: 250, max: 450 },
            speed: { min: 80, max: 200 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xffd700, 0xfacc15, 0xffffff, 0xf59e0b],
            gravityY: 100,
        });

        // Dust puffs for jumping and landing
        this.dustEmitter = this.scene.add.particles(0, 0, DUST_KEY, {
            emitting: false,
            lifespan: { min: 200, max: 350 },
            speedX: { min: -60, max: 60 },
            speedY: { min: -20, max: -60 },
            scale: { start: 0.8, end: 1.5 },
            alpha: { start: 0.6, end: 0 },
            tint: 0xe2e8f0,
        });

        // Stomp impact burst (electric magenta / cyan)
        this.stompEmitter = this.scene.add.particles(0, 0, SPARK_KEY, {
            emitting: false,
            lifespan: { min: 300, max: 500 },
            speed: { min: 120, max: 260 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xd946ef, 0x06b6d4, 0xffffff, 0xec4899],
            gravityY: 120,
        });

        // Celebration confetti burst (rainbow / festive)
        this.celebrationEmitter = this.scene.add.particles(0, 0, SPARK_KEY, {
            emitting: false,
            lifespan: { min: 600, max: 1000 },
            speed: { min: 140, max: 320 },
            scale: { start: 1.6, end: 0.2 },
            alpha: { start: 1, end: 0 },
            tint: [0x10b981, 0xfbbf24, 0x38bdf8, 0xf43f5e, 0xa855f7],
            gravityY: 180,
        });

        this.coinEmitter.setDepth(20);
        this.dustEmitter.setDepth(20);
        this.stompEmitter.setDepth(20);
        this.celebrationEmitter.setDepth(20);
    }

    emitCoinSparkle (x: number, y: number): void
    {
        this.coinEmitter.explode(12, x, y);
    }

    emitJumpDust (x: number, y: number): void
    {
        this.dustEmitter.explode(6, x, y);
    }

    emitLandingDust (x: number, y: number): void
    {
        this.dustEmitter.explode(10, x, y);
    }

    emitStompBurst (x: number, y: number): void
    {
        this.stompEmitter.explode(16, x, y);
    }

    emitCelebration (x: number, y: number): void
    {
        this.celebrationEmitter.explode(36, x, y);

        // Additional delayed secondary burst
        this.scene.time.delayedCall(180, () =>
        {
            this.celebrationEmitter.explode(24, x + (Math.random() * 40 - 20), y - 30);
        });
    }

    emitPowerUpBurst (x: number, y: number, type: 'heart' | 'star' | 'spring'): void
    {
        if (type === 'heart')
        {
            this.celebrationEmitter.explode(18, x, y);
        }
        else if (type === 'star')
        {
            this.celebrationEmitter.explode(28, x, y);
        }
        else
        {
            this.stompEmitter.explode(18, x, y);
        }
    }

    emitSpikeHit (x: number, y: number): void
    {
        this.stompEmitter.explode(14, x, y);
    }
}

