import { EventBus } from '../../EventBus';
import { Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Platform } from '../objects/Platform';
import { Coin } from '../objects/Coin';
import { GoalFlag } from '../objects/GoalFlag';
import { Door } from '../objects/Door';
import { Enemy } from '../objects/Enemy';
import { PowerUp } from '../objects/PowerUp';
import { Spike } from '../objects/Spike';
import { MovingPlatform } from '../objects/MovingPlatform';
import { Boss } from '../objects/Boss';
import { ParticleManager } from '../effects/ParticleManager';
import { soundManager } from '../../audio/SoundManager';
import { Level } from '../Level';
import { LEVEL_CATALOG } from '../levelCatalog';
import { LevelProgress } from '../../../domain/entities/LevelProgress';
import { DomainEvents } from '../../../domain/DomainEvents';
import { GameSession } from '../../../domain/entities/GameSession';
import { Score } from '../../../domain/entities/Score';
import { Lives } from '../../../domain/entities/Lives';
import { PowerUpState } from '../../../domain/entities/PowerUp';
import { completeLevelUseCase } from '../../../application/CompleteLevelUseCase';
import { collectCoinUseCase } from '../../../application/CollectCoinUseCase';
import { defeatEnemyUseCase } from '../../../application/DefeatEnemyUseCase';
import { playerTakeDamageUseCase } from '../../../application/PlayerTakeDamageUseCase';
import { collectPowerUpUseCase } from '../../../application/CollectPowerUpUseCase';
import {
    createTickEmitterCache,
    tickSessionUseCase,
} from '../../../application/TickSessionUseCase';
import {
    SKIN_CHANGED_EVENT,
    SkinChangedPayload,
} from '../../../application/SelectSkinUseCase';
import {
    GAME_PAUSED_EVENT,
    GAME_RESUMED_EVENT,
} from '../../../application/TogglePauseUseCase';

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
    goalFlag?: GoalFlag;
    door?: Door;
    particleManager: ParticleManager;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    level: Level;
    levelProgress: LevelProgress;
    session: GameSession;
    score: Score;
    lives: Lives;
    powerUpState: PowerUpState;
    currentLevelKey = 'village';
    currentSkinId = 'cyber-blue';
    initialScoreValue = 0;
    initialLivesValue = 3;
    initialCoinsValue = 0;
    initialElapsedMs = 0;
    private tickCache = createTickEmitterCache();

    constructor ()
    {
        super('Game');
    }

    init (data?: {
        levelKey?: string;
        score?: number;
        lives?: number;
        skinId?: string;
        coins?: number;
        elapsedMs?: number;
    })
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
        if (data?.skinId)
        {
            this.currentSkinId = data.skinId;
        }
        if (typeof data?.coins === 'number')
        {
            this.initialCoinsValue = data.coins;
        }
        if (typeof data?.elapsedMs === 'number')
        {
            this.initialElapsedMs = data.elapsedMs;
        }
    }

    preload ()
    {
        for (const item of LEVEL_CATALOG)
        {
            this.load.json(item.key, item.assetPath);
        }
    }

    create ()
    {
        this.level = this.cache.json.get(this.currentLevelKey) as Level;
        this.levelProgress = new LevelProgress(this.currentLevelKey, this.level.nextLevel || null);
        const trackTime = this.level.trackTime ?? (this.currentLevelKey !== 'village');
        this.session = new GameSession(
            this.currentLevelKey,
            this.initialScoreValue,
            this.initialLivesValue,
            this.initialCoinsValue,
            this.initialElapsedMs,
            trackTime
        );
        this.score = this.session.score;
        this.lives = this.session.lives;
        this.powerUpState = this.session.powerUps;
        this.tickCache = createTickEmitterCache();

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

        this.particleManager = new ParticleManager(this);

        if (this.level.scenery === 'village')
        {
            this.createVillageScenery();
        }

        this.player = new Player(this, this.level.spawn.x, this.level.spawn.y, this.currentSkinId);
        this.player.setDepth(10);
        this.player.onJump = (x, y) => this.particleManager.emitJumpDust(x, y);
        this.player.onLand = (x, y) => this.particleManager.emitLandingDust(x, y);

        // Place GoalFlag or Door at finish line
        const finishY = WORLD_HEIGHT - GROUND_HEIGHT - 70;
        if (this.level.finishType === 'door')
        {
            this.door = new Door(this, this.level.finishX, finishY);
            let doorDebounce = false;
            this.physics.add.overlap(this.player, this.door, () =>
            {
                if (doorDebounce) return;
                doorDebounce = true;
                this.time.delayedCall(1200, () =>
                {
                    doorDebounce = false;
                });
                this.handleDoorReached();
            });
        }
        else
        {
            this.goalFlag = new GoalFlag(this, this.level.finishX, finishY);
            this.physics.add.overlap(this.player, this.goalFlag, () =>
            {
                if (!this.boss || this.boss.entity.isDefeated)
                {
                    this.handleGoalReached();
                }
            });
        }

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
            this.session.addCoin(1);
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

        const onSkinChanged = (payload: SkinChangedPayload) =>
        {
            this.currentSkinId = payload.skinId;
            this.player.setSkin(payload.skinId);
            this.particleManager.emitCelebration(this.player.x, this.player.y);
        };
        DomainEvents.on<SkinChangedPayload>(SKIN_CHANGED_EVENT, onSkinChanged);

        const onGamePaused = () =>
        {
            if (this.scene.isActive())
            {
                this.physics.pause();
                this.scene.pause();
            }
        };
        DomainEvents.on(GAME_PAUSED_EVENT, onGamePaused);

        const onGameResumed = () =>
        {
            if (this.scene.isPaused())
            {
                this.scene.resume();
                this.physics.resume();
            }
        };
        DomainEvents.on(GAME_RESUMED_EVENT, onGameResumed);

        this.events.on('shutdown', () =>
        {
            DomainEvents.off<SkinChangedPayload>(SKIN_CHANGED_EVENT, onSkinChanged);
            DomainEvents.off(GAME_PAUSED_EVENT, onGamePaused);
            DomainEvents.off(GAME_RESUMED_EVENT, onGameResumed);
            soundManager.stopBgm();
        });

        EventBus.emit('current-scene-ready', this);
    }

    update (_time: number, delta: number)
    {
        const tickResult = tickSessionUseCase(this.session, delta, this.tickCache);

        if (tickResult.starExpired)
        {
            this.player.setStarPower(false);
        }
        if (tickResult.springExpired)
        {
            this.player.setSpringPower(false);
        }

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

    private handleDoorReached ()
    {
        if (this.door)
        {
            this.door.celebrate();
            this.particleManager.emitCelebration(this.door.x, this.door.y - 30);
            soundManager.playCoin();
        }

        if (this.currentLevelKey === 'village')
        {
            EventBus.emit('open-stage-map');
        }
        else
        {
            this.handleGoalReached();
        }
    }

    private handleGoalReached ()
    {
        if (this.levelProgress.isComplete) return;

        if (this.door)
        {
            this.door.celebrate();
            this.particleManager.emitCelebration(this.door.x, this.door.y - 30);
        }
        else if (this.goalFlag)
        {
            this.goalFlag.celebrate();
            this.particleManager.emitCelebration(this.goalFlag.x, this.goalFlag.y - 30);
        }

        completeLevelUseCase(this.levelProgress);
    }

    private createVillageScenery ()
    {
        const housePositions = [
            { x: 340, width: 140, height: 160, roofColor: 0xd97706, bodyColor: 0x334155 },
            { x: 580, width: 150, height: 140, roofColor: 0x0284c7, bodyColor: 0x1e293b },
            { x: 820, width: 170, height: 190, roofColor: 0xb91c1c, bodyColor: 0x334155 },
            { x: 1060, width: 150, height: 150, roofColor: 0x15803d, bodyColor: 0x1e293b },
            { x: 1260, width: 140, height: 160, roofColor: 0x7c3aed, bodyColor: 0x334155 },
        ];

        const baseY = WORLD_HEIGHT - GROUND_HEIGHT;

        // Village background trees & shrubs
        const treeXPositions = [220, 460, 700, 940, 1160];
        for (const tx of treeXPositions)
        {
            const tree = this.add.graphics();
            tree.setDepth(1);
            tree.fillStyle(0x78350f, 1);
            tree.fillRect(tx - 6, baseY - 50, 12, 50);
            tree.fillStyle(0x15803d, 0.95);
            tree.fillCircle(tx, baseY - 70, 26);
            tree.fillStyle(0x22c55e, 0.9);
            tree.fillCircle(tx - 6, baseY - 76, 18);
        }

        for (const house of housePositions)
        {
            const graphics = this.add.graphics();
            graphics.setDepth(1);

            // House body
            graphics.fillStyle(house.bodyColor, 0.9);
            graphics.fillRect(house.x - house.width / 2, baseY - house.height, house.width, house.height);

            // Roof
            graphics.fillStyle(house.roofColor, 1);
            graphics.beginPath();
            graphics.moveTo(house.x - house.width / 2 - 16, baseY - house.height);
            graphics.lineTo(house.x, baseY - house.height - 45);
            graphics.lineTo(house.x + house.width / 2 + 16, baseY - house.height);
            graphics.closePath();
            graphics.fillPath();

            // Chimney
            graphics.fillStyle(0x475569, 1);
            graphics.fillRect(house.x + house.width / 4, baseY - house.height - 35, 18, 25);

            // Windows with warm amber light
            graphics.fillStyle(0xfef08a, 0.95);
            graphics.fillRect(house.x - house.width / 3, baseY - house.height + 30, 24, 24);
            graphics.fillRect(house.x + house.width / 3 - 24, baseY - house.height + 30, 24, 24);

            // Window frames
            graphics.lineStyle(2, 0x78350f, 1);
            graphics.strokeRect(house.x - house.width / 3, baseY - house.height + 30, 24, 24);
            graphics.strokeRect(house.x + house.width / 3 - 24, baseY - house.height + 30, 24, 24);

            // Wooden door
            graphics.fillStyle(0x78350f, 1);
            graphics.fillRoundedRect(house.x - 14, baseY - 48, 28, 48, 4);
        }

        // Fences and Lanterns along the pathway
        const lanternXPositions = [280, 520, 760, 1000, 1200, 1370];
        for (const lx of lanternXPositions)
        {
            const post = this.add.graphics();
            post.setDepth(2);
            // Iron pole
            post.fillStyle(0x1e293b, 1);
            post.fillRect(lx - 2, baseY - 50, 4, 50);
            // Lantern head
            post.fillStyle(0xf59e0b, 1);
            post.fillCircle(lx, baseY - 54, 7);
            post.fillStyle(0xfef08a, 0.9);
            post.fillCircle(lx, baseY - 54, 3);
        }

        // Welcome Signpost at spawn
        const welcomeSign = this.add.text(120, baseY - 80, '🏡 ໝູ່ບ້ານ JO RUNNER\n(ຍິນດີຕ້ອນຮັບ!)', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '14px',
            color: '#fef08a',
            stroke: '#0f172a',
            strokeThickness: 3,
            align: 'center',
        });
        welcomeSign.setOrigin(0.5, 0.5);
        welcomeSign.setDepth(2);

        // Signpost pointing to Level 1 Door
        const doorSign = this.add.text(1380, baseY - 85, '🚪 ປະຕູສູ່ Level 1 ➡️\n(Green Plains)', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '15px',
            color: '#38bdf8',
            stroke: '#0284c7',
            strokeThickness: 3,
            align: 'center',
        });
        doorSign.setOrigin(0.5, 0.5);
        doorSign.setDepth(2);

        // Floating pulse on door sign
        this.tweens.add({
            targets: doorSign,
            y: baseY - 92,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
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
        tileSprite.setDepth(4);

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
            this.player.setStarPower(true);
            collectPowerUpUseCase(type, this.lives, this.powerUpState);
        }
        else if (type === 'spring')
        {
            this.player.setSpringPower(true);
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
