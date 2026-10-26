import { EventBus } from '../../EventBus';
import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Platform } from '../objects/Platform';
import { Coin } from '../objects/Coin';
import { GoalFlag } from '../objects/GoalFlag';
import { Enemy } from '../objects/Enemy';
import { ParticleManager } from '../effects/ParticleManager';
import { Level } from '../Level';
import { LevelProgress } from '../../../domain/entities/LevelProgress';
import { Score } from '../../../domain/entities/Score';
import { Lives } from '../../../domain/entities/Lives';
import { completeLevelUseCase } from '../../../application/CompleteLevelUseCase';
import { collectCoinUseCase } from '../../../application/CollectCoinUseCase';
import { defeatEnemyUseCase } from '../../../application/DefeatEnemyUseCase';
import { playerTakeDamageUseCase } from '../../../application/PlayerTakeDamageUseCase';

const WORLD_HEIGHT = 720;
const GROUND_HEIGHT = 64;
const GROUND_TILE_SIZE = 64;

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    ground: Phaser.Physics.Arcade.StaticGroup;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    coins: Phaser.Physics.Arcade.StaticGroup;
    enemies: Phaser.Physics.Arcade.Group;
    goalFlag: GoalFlag;
    particleManager: ParticleManager;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    level: Level;
    levelProgress: LevelProgress;
    score: Score;
    lives: Lives;
    currentLevelKey = 'level-1';
    initialScoreValue = 0;
    initialLivesValue = 3;

    constructor ()
    {
        super('Game');
    }

    init (data?: { levelKey?: string; score?: number; lives?: number })
    {
        if (data?.levelKey)
        {
            this.currentLevelKey = data.levelKey;
        }
        if (typeof data?.score === 'number')
        {
            this.initialScoreValue = data.score;
        }
        if (typeof data?.lives === 'number')
        {
            this.initialLivesValue = data.lives;
        }
    }

    preload ()
    {
        this.load.json('level-1', 'assets/levels/level-1.json');
        this.load.json('level-2', 'assets/levels/level-2.json');
    }

    create ()
    {
        this.level = this.cache.json.get(this.currentLevelKey) as Level;
        this.levelProgress = new LevelProgress(this.currentLevelKey, this.level.nextLevel || null);
        this.score = new Score(this.initialScoreValue);
        this.lives = new Lives(this.initialLivesValue);

        this.physics.world.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87ceeb);
        this.camera.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        this.createSky();

        this.ground = this.createGround();
        this.platforms = this.createPlatforms();
        this.coins = this.createCoins();
        this.enemies = this.createEnemies();

        this.particleManager = new ParticleManager(this);

        // Place GoalFlag at finish line
        const flagY = WORLD_HEIGHT - GROUND_HEIGHT - 70;
        this.goalFlag = new GoalFlag(this, this.level.finishX, flagY);

        this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
        this.player.onJump = (x, y) => this.particleManager.emitJumpDust(x, y);
        this.player.onLand = (x, y) => this.particleManager.emitLandingDust(x, y);

        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.platforms);

        // Colliders for enemies
        this.physics.add.collider(this.enemies, this.ground);
        this.physics.add.collider(this.enemies, this.platforms);

        // Overlaps
        this.physics.add.overlap(this.player, this.coins, (_player, coinObj) =>
        {
            const coin = coinObj as Coin;
            coin.collect();
            this.particleManager.emitCoinSparkle(coin.x, coin.y);
            collectCoinUseCase(this.score, 10);
        });

        this.physics.add.overlap(this.player, this.enemies, (playerObj, enemyObj) =>
        {
            this.handlePlayerEnemyCollision(playerObj as Player, enemyObj as Enemy);
        });

        this.physics.add.overlap(this.player, this.goalFlag, () =>
        {
            this.handleGoalReached();
        });

        this.camera.startFollow(this.player, true, 0.1, 0.1);

        this.cursors = this.input.keyboard!.createCursorKeys();

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        this.player.update(this.cursors);

        for (const child of this.enemies.getChildren())
        {
            const enemy = child as Enemy;
            if (enemy.active)
            {
                enemy.update();
            }
        }

        if (this.player.x >= this.level.finishX)
        {
            this.handleGoalReached();
        }
    }

    private handlePlayerEnemyCollision (player: Player, enemy: Enemy)
    {
        if (enemy.entity.isDefeated) return;

        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const isFalling = playerBody.velocity.y > 0;
        const isAbove = player.y < enemy.y - 4;

        if (isFalling && isAbove)
        {
            // Stomp victory: bounce, emit particle burst, and defeat enemy
            player.setVelocityY(-340);
            this.particleManager.emitStompBurst(enemy.x, enemy.y);
            defeatEnemyUseCase(enemy.entity, this.score);
            enemy.squashAndDefeat();
        }
        else
        {
            // Player hit by enemy
            if (!player.isInvincible)
            {
                player.triggerDamage(enemy.x);
                playerTakeDamageUseCase(this.lives);
            }
        }
    }

    private handleGoalReached ()
    {
        if (this.levelProgress.isComplete) return;

        this.goalFlag.celebrate();
        this.particleManager.emitCelebration(this.goalFlag.x, this.goalFlag.y - 30);
        completeLevelUseCase(this.levelProgress);
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

    private createCoins ()
    {
        // Collectible items — pure geometry/visuals, domain state managed via collectCoinUseCase.
        const coins = this.physics.add.staticGroup();

        if (this.level.coins)
        {
            for (const { x, y } of this.level.coins)
            {
                coins.add(new Coin(this, x, y));
            }
        }

        return coins;
    }

    private createEnemies ()
    {
        const enemies = this.physics.add.group();

        if (this.level.enemies)
        {
            for (const item of this.level.enemies)
            {
                const enemy = new Enemy(
                    this,
                    item.x,
                    item.y,
                    item.patrolDistance,
                    item.speed
                );
                enemies.add(enemy);
            }
        }

        return enemies;
    }
}
