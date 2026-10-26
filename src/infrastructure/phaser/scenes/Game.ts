import { EventBus } from '../../EventBus';
import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Platform } from '../objects/Platform';
import { Coin } from '../objects/Coin';
import { GoalFlag } from '../objects/GoalFlag';
import { Enemy } from '../objects/Enemy';
import { PowerUp } from '../objects/PowerUp';
import { Spike } from '../objects/Spike';
import { MovingPlatform } from '../objects/MovingPlatform';
import { Boss } from '../objects/Boss';
import { ParticleManager } from '../effects/ParticleManager';
import { soundManager } from '../../audio/SoundManager';
import { Level } from '../Level';
import { LevelProgress } from '../../../domain/entities/LevelProgress';
import { Score } from '../../../domain/entities/Score';
import { Lives } from '../../../domain/entities/Lives';
import { PowerUpState } from '../../../domain/entities/PowerUp';
import { completeLevelUseCase } from '../../../application/CompleteLevelUseCase';
import { collectCoinUseCase } from '../../../application/CollectCoinUseCase';
import { defeatEnemyUseCase } from '../../../application/DefeatEnemyUseCase';
import { playerTakeDamageUseCase } from '../../../application/PlayerTakeDamageUseCase';
import { collectPowerUpUseCase } from '../../../application/CollectPowerUpUseCase';

const WORLD_HEIGHT = 720;
const GROUND_HEIGHT = 64;
const GROUND_TILE_SIZE = 64;

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    ground: Phaser.Physics.Arcade.StaticGroup;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    movingPlatforms: Phaser.Physics.Arcade.Group;
    spikes: Phaser.Physics.Arcade.StaticGroup;
    coins: Phaser.Physics.Arcade.StaticGroup;
    powerUps: Phaser.Physics.Arcade.StaticGroup;
    enemies: Phaser.Physics.Arcade.Group;
    boss?: Boss;
    goalFlag: GoalFlag;
    particleManager: ParticleManager;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    level: Level;
    levelProgress: LevelProgress;
    score: Score;
    lives: Lives;
    powerUpState: PowerUpState;
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
        this.load.json('level-3', 'assets/levels/level-3.json');
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
        this.movingPlatforms = this.createMovingPlatforms();
        this.spikes = this.createSpikes();
        this.coins = this.createCoins();
        this.powerUps = this.createPowerUps();
        this.enemies = this.createEnemies();
        this.powerUpState = new PowerUpState();

        this.particleManager = new ParticleManager(this);

        // Place GoalFlag at finish line
        const flagY = WORLD_HEIGHT - GROUND_HEIGHT - 70;
        this.goalFlag = new GoalFlag(this, this.level.finishX, flagY);

        this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
        this.player.onJump = (x, y) => this.particleManager.emitJumpDust(x, y);
        this.player.onLand = (x, y) => this.particleManager.emitLandingDust(x, y);

        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatforms);

        // Colliders for enemies
        this.physics.add.collider(this.enemies, this.ground);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.movingPlatforms);

        // Overlaps
        this.physics.add.overlap(this.player, this.spikes, (_player, spikeObj) =>
        {
            this.handlePlayerSpikeCollision(spikeObj as Spike);
        });
        this.physics.add.overlap(this.player, this.coins, (_player, coinObj) =>
        {
            const coin = coinObj as Coin;
            coin.collect();
            this.particleManager.emitCoinSparkle(coin.x, coin.y);
            collectCoinUseCase(this.score, 10);
        });

        this.physics.add.overlap(this.player, this.powerUps, (_player, powerUpObj) =>
        {
            this.handleCollectPowerUp(powerUpObj as PowerUp);
        });

        this.physics.add.overlap(this.player, this.enemies, (playerObj, enemyObj) =>
        {
            this.handlePlayerEnemyCollision(playerObj as Player, enemyObj as Enemy);
        });

        this.physics.add.overlap(this.player, this.goalFlag, () =>
        {
            if (!this.boss || this.boss.entity.isDefeated)
            {
                this.handleGoalReached();
            }
        });

        // Spawn Boss if defined for this level
        if (this.level.boss)
        {
            this.boss = new Boss(this, this.level.boss.x, this.level.boss.y, this.level.boss.hp ?? 5);
            this.boss.onLanding = (x, y) => this.particleManager.emitLandingDust(x, y);
            this.boss.onDefeated = (x, y) =>
            {
                this.particleManager.emitCelebration(x, y);
                this.time.delayedCall(1200, () =>
                {
                    this.handleGoalReached();
                });
            };

            this.physics.add.collider(this.boss, this.ground);
            this.physics.add.collider(this.boss, this.platforms);
            this.physics.add.collider(this.boss, this.movingPlatforms);

            this.physics.add.overlap(this.player, this.boss, (playerObj, bossObj) =>
            {
                this.handlePlayerBossCollision(playerObj as Player, bossObj as Boss);
            });
        }

        this.camera.startFollow(this.player, true, 0.1, 0.1);

        this.cursors = this.input.keyboard!.createCursorKeys();

        // Start BGM (boss theme for level-3, adventure theme for levels 1 & 2)
        const isBossStage = this.currentLevelKey === 'level-3' || Boolean(this.level.boss);
        soundManager.startBgm(isBossStage ? 'boss' : 'adventure');

        this.events.on('shutdown', () =>
        {
            soundManager.stopBgm();
        });

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

        for (const child of this.movingPlatforms.getChildren())
        {
            const mp = child as MovingPlatform;
            if (mp.active)
            {
                mp.update();
            }
        }

        if (this.boss && this.boss.active)
        {
            this.boss.update(this.player.x);
        }

        if (this.player.x >= this.level.finishX)
        {
            if (!this.boss || this.boss.entity.isDefeated)
            {
                this.handleGoalReached();
            }
        }
    }

    private handlePlayerEnemyCollision (player: Player, enemy: Enemy)
    {
        if (enemy.entity.isDefeated) return;

        // Invincible star power knocks out enemies on contact
        if (player.hasStarPower)
        {
            player.setVelocityY(-260);
            this.particleManager.emitStompBurst(enemy.x, enemy.y);
            defeatEnemyUseCase(enemy.entity, this.score);
            enemy.squashAndDefeat();
            return;
        }

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

    private handlePlayerSpikeCollision (spike: Spike)
    {
        if (this.player.isInvincible || this.player.hasStarPower) return;

        this.player.triggerDamage(spike.x);
        this.particleManager.emitSpikeHit(spike.x, spike.y);
        playerTakeDamageUseCase(this.lives);
    }

    private handlePlayerBossCollision (player: Player, boss: Boss)
    {
        if (boss.entity.isDefeated) return;

        // Invincible star power hurts boss
        if (player.hasStarPower)
        {
            player.setVelocityY(-360);
            this.particleManager.emitStompBurst(boss.x, boss.y);
            boss.takeDamage(this.score);
            return;
        }

        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const isFalling = playerBody.velocity.y > 0;
        const isAbove = player.y < boss.y - 8;

        if (isFalling && isAbove && !boss.isInvulnerable)
        {
            // High bounce when stomping boss
            player.setVelocityY(-420);
            this.particleManager.emitStompBurst(boss.x, boss.y);
            boss.takeDamage(this.score);
        }
        else
        {
            // Player hit by boss
            if (!player.isInvincible)
            {
                player.triggerDamage(boss.x);
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

    private handleCollectPowerUp (powerUp: PowerUp)
    {
        const type = powerUp.powerUpType;
        powerUp.collect();
        this.particleManager.emitPowerUpBurst(powerUp.x, powerUp.y, type);

        if (type === 'heart')
        {
            collectPowerUpUseCase(type, this.lives, this.powerUpState);
        }
        else if (type === 'star')
        {
            this.player.activateStar(8000);
            collectPowerUpUseCase(type, this.lives, this.powerUpState);
        }
        else if (type === 'spring')
        {
            this.player.activateSpring(10000);
            collectPowerUpUseCase(type, this.lives, this.powerUpState);
        }
    }

    private createPowerUps ()
    {
        const powerUps = this.physics.add.staticGroup();

        if (this.level.powerUps)
        {
            for (const item of this.level.powerUps)
            {
                powerUps.add(new PowerUp(this, item.x, item.y, item.type));
            }
        }

        return powerUps;
    }

    private createSpikes ()
    {
        const spikes = this.physics.add.staticGroup();

        if (this.level.spikes)
        {
            for (const item of this.level.spikes)
            {
                spikes.add(new Spike(this, item.x, item.y));
            }
        }

        return spikes;
    }

    private createMovingPlatforms ()
    {
        const movingPlatforms = this.physics.add.group();

        if (this.level.movingPlatforms)
        {
            for (const item of this.level.movingPlatforms)
            {
                const mp = new MovingPlatform(this, item.x, item.y, {
                    distanceX: item.distanceX,
                    distanceY: item.distanceY,
                    speed: item.speed,
                });
                movingPlatforms.add(mp);
            }
        }

        return movingPlatforms;
    }
}
