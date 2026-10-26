import { EventBus } from '../../EventBus';
import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Platform } from '../objects/Platform';
import { Level } from '../Level';
import { LevelProgress } from '../../../domain/entities/LevelProgress';
import { completeLevelUseCase } from '../../../application/CompleteLevelUseCase';

const LEVEL_KEY = 'level-1';
const WORLD_HEIGHT = 720;
const GROUND_HEIGHT = 64;
const GROUND_TILE_SIZE = 64;

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    ground: Phaser.Physics.Arcade.StaticGroup;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    level: Level;
    levelProgress: LevelProgress;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.json(LEVEL_KEY, `assets/levels/${LEVEL_KEY}.json`);
    }

    create ()
    {
        this.level = this.cache.json.get(LEVEL_KEY) as Level;
        this.levelProgress = new LevelProgress();

        this.physics.world.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87ceeb);
        this.camera.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        this.createSky();

        this.ground = this.createGround();
        this.platforms = this.createPlatforms();

        this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.platforms);

        this.camera.startFollow(this.player, true, 0.1, 0.1);

        this.cursors = this.input.keyboard!.createCursorKeys();

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        this.player.update(this.cursors);

        if (this.player.x >= this.level.finishX)
        {
            completeLevelUseCase(this.levelProgress);
        }
    }

    private createSky ()
    {
        const textureKey = 'sky-tile';
        const tileSize = 256;

        if (!this.textures.exists(textureKey))
        {
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0x87ceeb, 1);
            graphics.fillRect(0, 0, tileSize, tileSize);
            graphics.fillStyle(0xffffff, 0.6);
            graphics.fillEllipse(64, 70, 70, 26);
            graphics.fillEllipse(190, 150, 90, 30);
            graphics.generateTexture(textureKey, tileSize, tileSize);
            graphics.destroy();
        }

        const sky = this.add.tileSprite(this.level.worldWidth / 2, WORLD_HEIGHT / 2, this.level.worldWidth, WORLD_HEIGHT, textureKey);
        sky.setScrollFactor(0.3);
    }

    private createGround ()
    {
        const textureKey = 'ground-tile';

        if (!this.textures.exists(textureKey))
        {
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0x4a7c2a, 1);
            graphics.fillRect(0, 0, GROUND_TILE_SIZE, GROUND_HEIGHT);
            graphics.fillStyle(0x3f6b23, 1);
            graphics.fillRect(0, 0, GROUND_TILE_SIZE, 6);
            graphics.fillRect(0, 0, 2, GROUND_HEIGHT);
            graphics.generateTexture(textureKey, GROUND_TILE_SIZE, GROUND_HEIGHT);
            graphics.destroy();
        }

        const groundY = WORLD_HEIGHT - GROUND_HEIGHT / 2;
        const tileSprite = this.add.tileSprite(this.level.worldWidth / 2, groundY, this.level.worldWidth, GROUND_HEIGHT, textureKey);

        this.physics.add.existing(tileSprite, true);

        const ground = this.physics.add.staticGroup();
        ground.add(tileSprite);

        return ground;
    }

    private createPlatforms ()
    {
        // Pure geometry — no domain entity, see "Pairing is optional, not automatic" in CONTEXT.md.
        const platforms = this.physics.add.staticGroup();

        for (const { x, y } of this.level.platforms)
        {
            platforms.add(new Platform(this, x, y));
        }

        return platforms;
    }
}
