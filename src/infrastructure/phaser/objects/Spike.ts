import { Physics, Scene } from 'phaser';

const TEXTURE_KEY = 'spike-texture';
const FALLBACK_KEY = 'hazard-spike';
const WIDTH = 64;
const HEIGHT = 28;

/**
 * A static hazard spike object — pure geometry hazard with no domain entity.
 * Damaging rules are handled via PlayerTakeDamageUseCase upon collision.
 * Lives in infrastructure layer — see CONTEXT.md.
 */
export class Spike extends Physics.Arcade.Sprite
{
    constructor (scene: Scene, x: number, y: number)
    {
        Spike.ensureTexture(scene);
        const textureToUse = scene.textures.exists(TEXTURE_KEY) ? TEXTURE_KEY : FALLBACK_KEY;

        super(scene, x, y, textureToUse);

        scene.add.existing(this);
        scene.physics.add.existing(this, true);

        // Tight collision box on the sharp teeth so it feels fair to jump near
        const body = this.body as Phaser.Physics.Arcade.StaticBody;
        if (body)
        {
            body.setSize(WIDTH - 12, 14);
            body.setOffset(6, 14);
        }
    }

    private static ensureTexture (scene: Scene)
    {
        if (scene.textures.exists(TEXTURE_KEY)) return;

        const graphics = scene.make.graphics({ x: 0, y: 0 });

        // Base plate (dark metallic steel)
        graphics.fillStyle(0x334155, 1);
        graphics.fillRect(0, HEIGHT - 6, WIDTH, 6);

        // Base border line (dark slate)
        graphics.fillStyle(0x0f172a, 1);
        graphics.fillRect(0, HEIGHT - 2, WIDTH, 2);

        // Draw 4 sharp triangular spikes
        const spikeCount = 4;
        const spikeWidth = WIDTH / spikeCount; // 16px each

        for (let i = 0; i < spikeCount; i++)
        {
            const startX = i * spikeWidth;
            const midX = startX + spikeWidth / 2;
            const endX = startX + spikeWidth;

            // Shaded left face (steel highlight)
            graphics.fillStyle(0xe2e8f0, 1);
            graphics.beginPath();
            graphics.moveTo(midX, 2);
            graphics.lineTo(startX + 2, HEIGHT - 6);
            graphics.lineTo(midX, HEIGHT - 6);
            graphics.closePath();
            graphics.fillPath();

            // Shaded right face (darker metallic)
            graphics.fillStyle(0x94a3b8, 1);
            graphics.beginPath();
            graphics.moveTo(midX, 2);
            graphics.lineTo(midX, HEIGHT - 6);
            graphics.lineTo(endX - 2, HEIGHT - 6);
            graphics.closePath();
            graphics.fillPath();

            // Glowing danger crimson tip (apex warning)
            graphics.fillStyle(0xef4444, 1);
            graphics.beginPath();
            graphics.moveTo(midX, 2);
            graphics.lineTo(midX - 3, 8);
            graphics.lineTo(midX + 3, 8);
            graphics.closePath();
            graphics.fillPath();
        }

        graphics.generateTexture(TEXTURE_KEY, WIDTH, HEIGHT);
        graphics.destroy();
    }
}
