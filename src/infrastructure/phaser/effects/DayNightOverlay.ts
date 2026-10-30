import { BlendModes } from 'phaser';
import type { Scene } from 'phaser';

const GLOW_KEY = 'night-glow';
const DARK_COLOR = 0x0b1030;
const WIDTH = 1280;
const HEIGHT = 720;
/** Radius of the lantern light round the hero, in screen pixels. */
const GLOW_RADIUS = 190;

/**
 * The dark layer of the night: a screen-sized tint fixed to the camera, with a soft light that follows the hero
 * so the way ahead can still be seen. It never gets darker than the `darkness` it is given (see
 * `world-time.json` `maxDarkness`), so platforms and spikes stay readable. The React HUD is not covered.
 */
export class DayNightOverlay
{
    private readonly dark: Phaser.GameObjects.Rectangle;
    private readonly glow: Phaser.GameObjects.Image;

    constructor (private readonly scene: Scene)
    {
        DayNightOverlay.ensureGlowTexture(scene);

        this.dark = scene.add.rectangle(0, 0, WIDTH, HEIGHT, DARK_COLOR, 1)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(900);

        this.glow = scene.add.image(0, 0, GLOW_KEY)
            .setScrollFactor(0)
            .setDepth(901)
            .setBlendMode(BlendModes.ADD)
            .setAlpha(0)
            .setDisplaySize(GLOW_RADIUS * 2, GLOW_RADIUS * 2);
    }

    /** `darkness` 0 to 1 (the layer's opacity); `heroX` / `heroY` are world coordinates. */
    update (darkness: number, heroX: number, heroY: number): void
    {
        const camera = this.scene.cameras.main;
        this.dark.setAlpha(darkness);
        // The light brightens the area round the hero a little less than the dark takes away
        this.glow.setAlpha(Math.min(0.45, darkness * 0.8));
        this.glow.setPosition((heroX - camera.scrollX) * camera.zoom, (heroY - camera.scrollY) * camera.zoom);
        this.glow.setVisible(darkness > 0.02);
        this.dark.setVisible(darkness > 0.001);
    }

    private static ensureGlowTexture (scene: Scene): void
    {
        if (scene.textures.exists(GLOW_KEY)) return;

        const size = 256;
        const g = scene.make.graphics({ x: 0, y: 0 }, false);
        // Rings from the edge to the middle, each a little brighter: a soft round light
        const rings = 24;
        for (let i = 0; i < rings; i++)
        {
            const radius = (size / 2) * (1 - i / rings);
            g.fillStyle(0xffd27a, 0.045);
            g.fillCircle(size / 2, size / 2, radius);
        }
        g.generateTexture(GLOW_KEY, size, size);
        g.destroy();
    }
}
