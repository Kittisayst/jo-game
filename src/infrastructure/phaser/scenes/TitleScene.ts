import { Cameras, GameObjects, Scene } from 'phaser';
import { EventBus } from '../../EventBus';
import { soundManager } from '../../audio/SoundManager';

interface StarParticle
{
    x: number;
    y: number;
    speedY: number;
    size: number;
    alpha: number;
    color: number;
}

/**
 * Phaser Scene for the Cyberpunk Title / Start Screen.
 * Renders an animated retro synthwave neon perspective grid, floating cyber particles,
 * and handles the transition from Start Menu into the Village Hub.
 */
export class TitleScene extends Scene
{
    private gridGraphics!: GameObjects.Graphics;
    private gridOffset = 0;
    private stars: StarParticle[] = [];
    private starsGraphics!: GameObjects.Graphics;
    private horizonY = 380;
    private isTransitioning = false;

    constructor ()
    {
        super('Title');
    }

    create (): void
    {
        this.isTransitioning = false;
        const width = 1280;
        const height = 720;

        // 1. Gradient Sky Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x030712, 0x030712, 0x0f172a, 0x1e1b4b, 1);
        bg.fillRect(0, 0, width, height);

        // 2. Distant Horizon Glow
        const horizonGlow = this.add.graphics();
        horizonGlow.fillStyle(0x00f0ff, 0.25);
        horizonGlow.fillRect(0, this.horizonY - 4, width, 8);
        horizonGlow.fillStyle(0xa855f7, 0.4);
        horizonGlow.fillRect(0, this.horizonY - 1, width, 3);

        // Neon Horizon line
        horizonGlow.lineStyle(2, 0x00f0ff, 0.9);
        horizonGlow.lineBetween(0, this.horizonY, width, this.horizonY);

        // 3. Floating Neon Cyber Stars
        this.starsGraphics = this.add.graphics();
        this.stars = [];
        const colors = [0x00f0ff, 0xa855f7, 0xfacc15, 0x38bdf8, 0xec4899];
        for (let i = 0; i < 45; i++)
        {
            this.stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                speedY: 0.3 + Math.random() * 0.7,
                size: 1 + Math.random() * 2.5,
                alpha: 0.3 + Math.random() * 0.7,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        // 4. Perspective Grid Graphics (Bottom Half)
        this.gridGraphics = this.add.graphics();

        // 5. Start Title BGM
        soundManager.startBgm('title');

        // 6. Camera Fade-in from black
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Notify React layer that Title scene is ready
        EventBus.emit('current-scene-ready', this);

        // 7. EventBus Listener for Game Start transition
        const onStartGame = (payload?: { levelKey?: string; skinId?: string }) =>
        {
            if (this.isTransitioning) return;
            this.isTransitioning = true;

            soundManager.playGameStart();

            const targetLevel = payload?.levelKey ?? 'village';
            const startGameData = {
                levelKey: targetLevel,
                score: 0,
                lives: 3,
                skinId: payload?.skinId ?? 'cyber-blue',
                elapsedMs: 0,
            };

            // Flash & Fade out transition to Village
            this.cameras.main.flash(180, 0, 240, 255);
            this.time.delayedCall(160, () =>
            {
                this.cameras.main.fade(220, 0, 0, 0);
                this.cameras.main.once(Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
                {
                    this.scene.start('Game', startGameData);
                });
                // Fallback guarantee in case frame drop delays the camera event
                this.time.delayedCall(260, () =>
                {
                    if (this.scene.isActive('Title'))
                    {
                        this.scene.start('Game', startGameData);
                    }
                });
            });
        };

        EventBus.on('start-game', onStartGame);

        this.events.once('shutdown', () =>
        {
            EventBus.off('start-game', onStartGame);
        });
    }

    update (_time: number, delta: number): void
    {
        const width = 1280;
        const height = 720;

        // Animate floating stars rising
        this.starsGraphics.clear();
        for (const star of this.stars)
        {
            star.y -= star.speedY * (delta / 16);
            if (star.y < -10)
            {
                star.y = height + 10;
                star.x = Math.random() * width;
            }
            this.starsGraphics.fillStyle(star.color, star.alpha);
            this.starsGraphics.fillCircle(star.x, star.y, star.size);
        }

        // Animate Perspective Cyber Grid
        this.gridOffset = (this.gridOffset + delta * 0.05) % 40;
        this.renderPerspectiveGrid();
    }

    private renderPerspectiveGrid (): void
    {
        this.gridGraphics.clear();
        const width = 1280;
        const height = 720;
        const horizon = this.horizonY;
        const vanishingX = width / 2;

        // Perspective vertical lines converging to horizon
        this.gridGraphics.lineStyle(1.5, 0xa855f7, 0.45);
        const numColumns = 18;
        for (let i = -numColumns; i <= numColumns; i++)
        {
            const bottomX = vanishingX + (i * width) / (numColumns * 0.7);
            this.gridGraphics.lineBetween(vanishingX, horizon, bottomX, height);
        }

        // Perspective horizontal lines moving forward
        this.gridGraphics.lineStyle(1.5, 0x00f0ff, 0.55);
        const numRows = 12;
        for (let j = 0; j < numRows; j++)
        {
            // Exponential spacing for 3D depth perception
            const normalized = (j + this.gridOffset / 40) / numRows;
            const y = horizon + Math.pow(normalized, 2.2) * (height - horizon);
            if (y >= horizon && y <= height)
            {
                const alpha = Math.min(1, Math.max(0.1, (y - horizon) / (height - horizon)));
                this.gridGraphics.lineStyle(1.5, 0x00f0ff, alpha * 0.65);
                this.gridGraphics.lineBetween(0, y, width, y);
            }
        }
    }
}
