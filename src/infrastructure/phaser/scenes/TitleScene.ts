import { Cameras, Scene } from 'phaser';
import { EventBus } from '../../EventBus';
import { soundManager } from '../../audio/SoundManager';

/**
 * The Title scene has no artwork of its own: the start menu is drawn by React (`TitleMenu`) over
 * a plain backdrop. This scene plays the title music and, when the player starts a game, flashes
 * and fades into the `Game` scene.
 */
export class TitleScene extends Scene
{
    private isTransitioning = false;

    constructor ()
    {
        super('Title');
    }

    create (): void
    {
        this.isTransitioning = false;
        this.cameras.main.setBackgroundColor(0x0b0720);

        // Start Title BGM
        soundManager.startBgm('title');

        // Camera fade-in from black
        this.cameras.main.fadeIn(300, 0, 0, 0);

        // Notify React layer that Title scene is ready
        EventBus.emit('current-scene-ready', this);

        // Start-game transition
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
}
