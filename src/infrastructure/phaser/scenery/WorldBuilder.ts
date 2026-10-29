import { MovingPlatform } from '../objects/MovingPlatform';
import { Platform } from '../objects/Platform';
import { Spike } from '../objects/Spike';
import type { Level } from '../Level';

/** Design height of the world; must equal the game config height in `main.ts`. */
export const WORLD_HEIGHT = 720;
export const GROUND_HEIGHT = 64;
/** Top of the ground: where buildings, trees and nodes stand. */
export const GROUND_Y = WORLD_HEIGHT - GROUND_HEIGHT;
const GROUND_TILE_SIZE = 64;

export interface SkyBackdrop
{
    update (scrollX: number): void;
}

function clamp01 (v: number): number
{
    return Math.max(0, Math.min(1, v));
}

/**
 * Builds the backdrop of a level. Returns a controller whose `update(scrollX)` drives parallax scrolling;
 * a cave level that ends in a boss arena (`level.arenaFromX`) fades into the arena backdrop from there.
 */
export function createSky (
    scene: Phaser.Scene,
    level: Level,
    backdropKey: string
): SkyBackdrop | undefined
{
    if (scene.textures.exists(backdropKey))
    {
        // TileSprite pinned to camera viewport with parallax scrolling in update
        const bg = scene.add.tileSprite(0, 0, 1280, WORLD_HEIGHT, backdropKey);
        bg.setOrigin(0, 0);
        bg.setScrollFactor(0);
        bg.setDepth(-10);

        const arenaFromX = level.arenaFromX;
        const arena = arenaFromX !== undefined && scene.textures.exists('bg-boss-arena')
            ? scene.add.tileSprite(0, 0, 1280, WORLD_HEIGHT, 'bg-boss-arena')
                .setOrigin(0, 0).setScrollFactor(0).setDepth(-9.5).setAlpha(0)
            : undefined;

        return {
            update (scrollX: number)
            {
                const parallaxX = scrollX * 0.25;
                bg.tilePositionX = parallaxX;
                if (arena && arenaFromX !== undefined)
                {
                    arena.tilePositionX = parallaxX;
                    arena.setAlpha(clamp01((scrollX + 640 - (arenaFromX - 104)) / 240));
                }
            },
        };
    }

    const textureKey = 'sky-tile';
    const tileSize = 256;

    if (!scene.textures.exists(textureKey))
    {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x87ceeb, 1);
        graphics.fillRect(0, 0, tileSize, tileSize);
        graphics.fillStyle(0xffffff, 0.6);
        graphics.fillEllipse(64, 70, 70, 26);
        graphics.fillEllipse(190, 150, 90, 30);
        graphics.generateTexture(textureKey, tileSize, tileSize);
        graphics.destroy();
    }

    const sky = scene.add.tileSprite(level.worldWidth / 2, WORLD_HEIGHT / 2, level.worldWidth, WORLD_HEIGHT, textureKey);
    sky.setScrollFactor(0.3);
    sky.setDepth(-10);
    return undefined;
}

export function createGround (
    scene: Phaser.Scene,
    level: Level
): Phaser.Physics.Arcade.StaticGroup
{
    const textureKey = 'ground-tile';

    if (!scene.textures.exists(textureKey))
    {
        const graphics = scene.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x4a7c2a, 1);
        graphics.fillRect(0, 0, GROUND_TILE_SIZE, GROUND_HEIGHT);
        graphics.fillStyle(0x3f6b23, 1);
        graphics.fillRect(0, 0, GROUND_TILE_SIZE, 6);
        graphics.fillRect(0, 0, 2, GROUND_HEIGHT);
        graphics.generateTexture(textureKey, GROUND_TILE_SIZE, GROUND_HEIGHT);
        graphics.destroy();
    }

    const groundY = WORLD_HEIGHT - GROUND_HEIGHT / 2;
    const tileSprite = scene.add.tileSprite(level.worldWidth / 2, groundY, level.worldWidth, GROUND_HEIGHT, textureKey);
    tileSprite.setDepth(4);

    scene.physics.add.existing(tileSprite, true);

    const ground = scene.physics.add.staticGroup();
    ground.add(tileSprite);

    // Visual biome ground overlays aligned on 64px tile boundaries: cave floor, then the arena floor
    const arenaFromX = level.arenaFromX ?? level.worldWidth;
    if (level.scenery === 'cave' && arenaFromX > 0 && scene.textures.exists('ground-tile-cavern'))
    {
        scene.add.tileSprite(arenaFromX / 2, groundY, arenaFromX, GROUND_HEIGHT, 'ground-tile-cavern')
            .setDepth(4.1);
    }
    if (level.arenaFromX !== undefined && scene.textures.exists('ground-tile-arena'))
    {
        const arenaWidth = level.worldWidth - level.arenaFromX;
        if (arenaWidth > 0)
        {
            scene.add.tileSprite(level.arenaFromX + arenaWidth / 2, groundY, arenaWidth, GROUND_HEIGHT, 'ground-tile-arena')
                .setDepth(4.2);
        }
    }

    return ground;
}

export function createPlatforms (scene: Phaser.Scene, level: Level): Phaser.Physics.Arcade.StaticGroup
{
    // Pure geometry — no domain entity, see "Pairing is optional, not automatic" in CONTEXT.md.
    const platforms = scene.physics.add.staticGroup();

    for (const { x, y } of level.platforms)
    {
        platforms.add(new Platform(scene, x, y));
    }

    return platforms;
}

export function createSpikes (scene: Phaser.Scene, level: Level): Phaser.Physics.Arcade.StaticGroup
{
    const spikes = scene.physics.add.staticGroup();

    for (const item of level.spikes ?? [])
    {
        spikes.add(new Spike(scene, item.x, item.y));
    }

    return spikes;
}

export function createMovingPlatforms (scene: Phaser.Scene, level: Level): Phaser.Physics.Arcade.Group
{
    const movingPlatforms = scene.physics.add.group();

    for (const item of level.movingPlatforms ?? [])
    {
        const mp = new MovingPlatform(scene, item.x, item.y, {
            distanceX: item.distanceX,
            distanceY: item.distanceY,
            speed: item.speed,
        });
        movingPlatforms.add(mp);
        mp.activate();
    }

    return movingPlatforms;
}
