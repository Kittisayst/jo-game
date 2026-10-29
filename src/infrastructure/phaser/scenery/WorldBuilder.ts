import { MovingPlatform } from '../objects/MovingPlatform';
import { Platform } from '../objects/Platform';
import { Spike } from '../objects/Spike';
import type { Level } from '../Level';
import type { StageDefinition } from '../stages/StageDefinition';

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
 * Builds the sky or multi-zone stage backdrop. Returns a controller whose `update(scrollX)`
 * drives parallax scrolling and smooth biome crossfades across Stage zones.
 */
export function createSky (
    scene: Phaser.Scene,
    level: Level,
    backdropKey: string,
    stage?: StageDefinition
): SkyBackdrop | undefined
{
    // Multi-zone Stage backdrop (Forest -> Cavern -> Boss Arena)
    if (
        stage &&
        scene.textures.exists('bg-plains') &&
        scene.textures.exists('bg-cavern') &&
        scene.textures.exists('bg-boss-arena')
    )
    {
        const plains = scene.add.tileSprite(0, 0, 1280, WORLD_HEIGHT, 'bg-plains')
            .setOrigin(0, 0).setScrollFactor(0).setDepth(-12);
        const cavern = scene.add.tileSprite(0, 0, 1280, WORLD_HEIGHT, 'bg-cavern')
            .setOrigin(0, 0).setScrollFactor(0).setDepth(-11).setAlpha(0);
        const arena = scene.add.tileSprite(0, 0, 1280, WORLD_HEIGHT, 'bg-boss-arena')
            .setOrigin(0, 0).setScrollFactor(0).setDepth(-10).setAlpha(0);

        return {
            update (scrollX: number)
            {
                const parallaxX = scrollX * 0.25;
                plains.tilePositionX = parallaxX;
                cavern.tilePositionX = parallaxX;
                arena.tilePositionX = parallaxX;

                const centerX = scrollX + 640;
                cavern.setAlpha(clamp01((centerX - 900) / 240));
                arena.setAlpha(clamp01((centerX - 2200) / 240));
            },
        };
    }

    if (scene.textures.exists(backdropKey))
    {
        // TileSprite pinned to camera viewport with parallax scrolling in update
        const bg = scene.add.tileSprite(0, 0, 1280, WORLD_HEIGHT, backdropKey);
        bg.setOrigin(0, 0);
        bg.setScrollFactor(0);
        bg.setDepth(-10);
        return {
            update (scrollX: number)
            {
                bg.tilePositionX = scrollX * 0.25;
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
    level: Level,
    stage?: StageDefinition
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

    // Visual biome ground overlays aligned on 64px tile boundaries for Stages
    if (stage && level.worldWidth >= 2304)
    {
        if (scene.textures.exists('ground-tile-cavern'))
        {
            const cavernStart = 1024;
            const cavernWidth = 2304 - cavernStart;
            scene.add.tileSprite(cavernStart + cavernWidth / 2, groundY, cavernWidth, GROUND_HEIGHT, 'ground-tile-cavern')
                .setDepth(4.1);
        }
        if (scene.textures.exists('ground-tile-arena'))
        {
            const arenaStart = 2304;
            const arenaWidth = level.worldWidth - arenaStart;
            if (arenaWidth > 0)
            {
                scene.add.tileSprite(arenaStart + arenaWidth / 2, groundY, arenaWidth, GROUND_HEIGHT, 'ground-tile-arena')
                    .setDepth(4.2);
            }
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
