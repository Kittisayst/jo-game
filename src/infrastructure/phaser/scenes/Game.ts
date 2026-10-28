import { EventBus } from '../../EventBus';
import { Geom, Input, Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Platform } from '../objects/Platform';
import { Coin } from '../objects/Coin';
import { GoalFlag } from '../objects/GoalFlag';
import { Door } from '../objects/Door';
import { Enemy, SPIT_PROJECTILE_KEY } from '../objects/Enemy';
import { PowerUp } from '../objects/PowerUp';
import { Spike } from '../objects/Spike';
import { MovingPlatform } from '../objects/MovingPlatform';
import { Boss } from '../objects/Boss';
import { NPC } from '../objects/NPC';
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
import {
    playerTakeDamageUseCase,
    GAME_OVER_EVENT,
} from '../../../application/PlayerTakeDamageUseCase';
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
import { Projectile } from '../objects/Projectile';
import { entities } from '../../composition';
import { performAttackUseCase } from '../../../application/PerformAttackUseCase';
import { trackAchievementUseCase } from '../../../application/TrackAchievementUseCase';

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
    playerProjectiles: Phaser.Physics.Arcade.Group;
    enemyProjectiles: Phaser.Physics.Arcade.Group;
    boss?: Boss;
    goalFlag?: GoalFlag;
    door?: Door;
    elderNpc?: NPC;
    merchantNpc?: NPC;
    isDialogueActive = false;
    particleManager: ParticleManager;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    wasdKeys?: Record<string, Phaser.Input.Keyboard.Key>;
    touchControls = { left: false, right: false, up: false };
    bgTileSprite?: Phaser.GameObjects.TileSprite;
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
    private damageTakenInLevel = 0;
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
        // Reset per-run references to prevent lingering stale objects across restarts
        this.boss = undefined;
        this.door = undefined;
        this.goalFlag = undefined;
        this.elderNpc = undefined;
        this.merchantNpc = undefined;
        this.isDialogueActive = false;
        this.touchControls = { left: false, right: false, up: false };

        this.currentLevelKey = data?.levelKey ?? 'village';
        this.initialScoreValue = typeof data?.score === 'number' ? data.score : 0;
        this.initialLivesValue = typeof data?.lives === 'number' ? data.lives : 3;
        this.currentSkinId = data?.skinId ?? 'cyber-blue';
        this.initialCoinsValue = typeof data?.coins === 'number' ? data.coins : 0;
        this.initialElapsedMs = typeof data?.elapsedMs === 'number' ? data.elapsedMs : 0;
    }

    preload ()
    {
        // Fallback load in case Game scene is loaded directly without Preloader
        for (const item of LEVEL_CATALOG)
        {
            if (!this.cache.json.exists(item.key))
            {
                this.load.json(item.key, item.assetPath);
            }
        }

        const bgAssets = [
            { key: 'bg-village', path: 'assets/backgrounds/bg_village.jpg' },
            { key: 'bg-plains', path: 'assets/backgrounds/bg_plains.jpg' },
            { key: 'bg-sky-islands', path: 'assets/backgrounds/bg_sky_islands.jpg' },
            { key: 'bg-boss-arena', path: 'assets/backgrounds/bg_boss_arena.jpg' },
        ];
        for (const bg of bgAssets)
        {
            if (!this.textures.exists(bg.key))
            {
                this.load.image(bg.key, bg.path);
            }
        }

        const envAssets = [
            { key: 'ground-tile', path: 'assets/environment/tile_ground.png' },
            { key: 'platform-texture', path: 'assets/environment/platform.png' },
            { key: 'door-texture', path: 'assets/environment/door.png' },
            { key: 'goal-flag-texture', path: 'assets/environment/goal_flag.png' },
            { key: 'spike-texture', path: 'assets/environment/spikes.png' },
        ];
        for (const env of envAssets)
        {
            if (!this.textures.exists(env.key))
            {
                this.load.image(env.key, env.path);
            }
        }

        const itemAssets = [
            { key: 'coin-texture', path: 'assets/items/coin.png' },
            { key: 'powerup-heart', path: 'assets/items/heart.png' },
            { key: 'powerup-star', path: 'assets/items/star.png' },
            { key: 'powerup-spring', path: 'assets/items/spring.png' },
        ];
        for (const item of itemAssets)
        {
            if (!this.textures.exists(item.key))
            {
                this.load.image(item.key, item.path);
            }
        }

        const skinAssets = [
            { key: 'player-skin-cyber-blue', path: 'assets/characters/player-skin-cyber-blue.png' },
            { key: 'player-skin-neon-ninja', path: 'assets/characters/player-skin-neon-ninja.png' },
            { key: 'player-skin-cyber-knight', path: 'assets/characters/player-skin-cyber-knight.png' },
            { key: 'player-skin-golden-runner', path: 'assets/characters/player-skin-golden-runner.png' },
        ];
        for (const skin of skinAssets)
        {
            if (!this.textures.exists(skin.key))
            {
                this.load.spritesheet(skin.key, skin.path, { frameWidth: 32, frameHeight: 48 });
            }
        }

        const enemyAssets = [
            { key: 'enemy-slime', path: 'assets/characters/enemy_slime.png' },
            { key: 'boss-king-slime', path: 'assets/characters/boss_king_slime.png' },
            { key: 'npc-elder', path: 'assets/characters/npc_elder.png' },
        ];
        for (const enemy of enemyAssets)
        {
            if (!this.textures.exists(enemy.key))
            {
                this.load.image(enemy.key, enemy.path);
            }
        }
    }

    create ()
    {
        this.boss = undefined;
        this.door = undefined;
        this.goalFlag = undefined;
        this.elderNpc = undefined;
        this.merchantNpc = undefined;

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
        this.damageTakenInLevel = 0;

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
            const baseY = WORLD_HEIGHT - GROUND_HEIGHT - 24;
            this.elderNpc = new NPC(this, 460, baseY, 'npc-elder');
            this.elderNpc.onInteract = () =>
            {
                EventBus.emit('start-dialogue', 'village_elder');
            };

            this.merchantNpc = new NPC(this, 820, baseY, 'npc-merchant', '🛒 [E] ຮ້ານຄ້າ (Shop)');
            this.merchantNpc.onInteract = () =>
            {
                EventBus.emit('start-dialogue', 'cyber_merchant');
            };
        }
        else if (this.level.scenery === 'sky-islands' || this.currentLevelKey === 'level-2')
        {
            this.createSkyIslandsScenery();
        }
        else if (this.level.scenery === 'boss-arena' || this.currentLevelKey === 'level-3' || Boolean(this.level.boss))
        {
            this.createBossArenaScenery();
        }
        else if (this.level.scenery === 'plains' || this.currentLevelKey === 'level-1')
        {
            this.createPlainsScenery();
        }

        const eKey = this.input.keyboard?.addKey('E');
        eKey?.on('down', () =>
        {
            if (this.elderNpc && this.elderNpc.isInteractable && !this.isDialogueActive)
            {
                this.elderNpc.triggerInteraction();
            }
            else if (this.merchantNpc && this.merchantNpc.isInteractable && !this.isDialogueActive)
            {
                this.merchantNpc.triggerInteraction();
            }
        });

        const onDialogueState = (isActive: boolean) =>
        {
            this.isDialogueActive = isActive;
            if (isActive)
            {
                this.touchControls = { left: false, right: false, up: false };
                if (this.player && this.player.body)
                {
                    this.player.setVelocityX(0);
                }
            }
        };
        EventBus.on('dialogue-open-state', onDialogueState);

        this.player = new Player(this, this.level.spawn.x, this.level.spawn.y, this.currentSkinId);
        this.player.setDepth(10);
        this.player.onJump = (x, y) => this.particleManager.emitJumpDust(x, y);
        this.player.onLand = (x, y) =>
        {
            soundManager.playLand();
            this.particleManager.emitLandingDust(x, y);
        };
        this.player.onRunStep = (x, y, dir) => this.particleManager.emitRunDust(x, y, dir);
        this.player.onWallSlide = (x, y, dir) => this.particleManager.emitRunDust(x, y, -dir);

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
            trackAchievementUseCase(entities.achievementManager, 'coin-collector', 1);
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
            this.boss.onLanding = (x, y) =>
            {
                this.particleManager.emitLandingDust(x, y);
                this.cameras.main.shake(140, 0.007);
            };
            this.boss.onDefeated = (x, y) =>
            {
                trackAchievementUseCase(entities.achievementManager, 'boss-slayer', 1);
                this.particleManager.emitCelebration(x, y);
                this.cameras.main.shake(450, 0.018);
                this.cameras.main.flash(200, 255, 255, 255, true);
                this.time.delayedCall(1200, () =>
                {
                    this.handleGoalReached();
                });
            };
            this.boss.onSummonMinion = (x, y) =>
            {
                if (this.enemies.countActive(true) < 3)
                {
                    const minion = new Enemy(this, x, y, 140, 85, 50);
                    minion.setScale(0.75);
                    this.enemies.add(minion);
                    this.particleManager.emitCelebration(x, y);
                    soundManager.playPowerUp();
                }
            };
            this.boss.onPhaseChanged = (newPhase) =>
            {
                soundManager.playStomp();
                if (newPhase === 2)
                {
                    this.particleManager.emitSpikeHit(this.boss!.x, this.boss!.y);
                }
                else if (newPhase === 3)
                {
                    this.particleManager.emitCelebration(this.boss!.x, this.boss!.y);
                }
            };

            this.physics.add.collider(this.boss, this.ground);
            this.physics.add.collider(this.boss, this.platforms);
            this.physics.add.collider(this.boss, this.movingPlatforms);

            this.physics.add.overlap(this.player, this.boss, (playerObj, bossObj) =>
            {
                this.handlePlayerBossCollision(playerObj as Player, bossObj as Boss);
            });
        }

        // Setup player projectile pool & collisions
        this.playerProjectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: true,
        });

        this.physics.add.collider(this.playerProjectiles, this.ground, (proj) =>
        {
            (proj as Projectile).destroy();
        });
        this.physics.add.collider(this.playerProjectiles, this.platforms, (proj) =>
        {
            (proj as Projectile).destroy();
        });
        this.physics.add.collider(this.playerProjectiles, this.movingPlatforms, (proj) =>
        {
            (proj as Projectile).destroy();
        });
        this.physics.add.overlap(this.playerProjectiles, this.enemies, (proj, enemy) =>
        {
            this.handleProjectileEnemyHit(proj as Projectile, enemy as Enemy);
        });
        if (this.boss)
        {
            this.physics.add.overlap(this.playerProjectiles, this.boss, (proj, boss) =>
            {
                this.handleProjectileBossHit(proj as Projectile, boss as Boss);
            });
        }

        // Setup enemy projectile pool & collisions
        this.enemyProjectiles = this.physics.add.group();

        this.physics.add.collider(this.enemyProjectiles, this.ground, (proj) =>
        {
            (proj as Phaser.Physics.Arcade.Sprite).destroy();
        });
        this.physics.add.collider(this.enemyProjectiles, this.platforms, (proj) =>
        {
            (proj as Phaser.Physics.Arcade.Sprite).destroy();
        });
        this.physics.add.collider(this.enemyProjectiles, this.movingPlatforms, (proj) =>
        {
            (proj as Phaser.Physics.Arcade.Sprite).destroy();
        });

        // Player takes damage on enemy spit contact
        this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, proj) =>
        {
            (proj as Phaser.Physics.Arcade.Sprite).destroy();
            if (this.player.isInvincible || this.player.hasStarPower) return;

            this.player.triggerDamage(this.player.x);
            this.damageTakenInLevel++;
            this.particleManager.emitSpikeHit(this.player.x, this.player.y);
            this.cameras.main.shake(150, 0.007);
            this.cameras.main.flash(100, 34, 197, 94, true);
            playerTakeDamageUseCase(this.lives);
        });

        // Player projectiles destroy enemy spit projectiles
        this.physics.add.overlap(this.playerProjectiles, this.enemyProjectiles, (playerProj, spit) =>
        {
            (spit as Phaser.Physics.Arcade.Sprite).destroy();
            this.particleManager.emitStompBurst((spit as Phaser.Physics.Arcade.Sprite).x, (spit as Phaser.Physics.Arcade.Sprite).y);
            if (!(playerProj as Projectile).pierce)
            {
                (playerProj as Projectile).destroy();
            }
        });

        this.camera.startFollow(this.player, true, 0.1, 0.1);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasdKeys = this.input.keyboard!.addKeys({
            up: Input.Keyboard.KeyCodes.W,
            down: Input.Keyboard.KeyCodes.S,
            left: Input.Keyboard.KeyCodes.A,
            right: Input.Keyboard.KeyCodes.D,
            space: Input.Keyboard.KeyCodes.SPACE,
        }) as Record<string, Phaser.Input.Keyboard.Key>;

        const jKey = this.input.keyboard?.addKey('J');
        const zKey = this.input.keyboard?.addKey('Z');
        const qKey = this.input.keyboard?.addKey('Q');
        const shiftKey = this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.SHIFT);
        const f2Key = this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.F2);

        jKey?.on('down', () => this.handlePlayerAttack());
        zKey?.on('down', () => this.handlePlayerAttack());
        qKey?.on('down', () => this.handleCycleWeapon());
        shiftKey?.on('down', () => this.handlePlayerDash());
        f2Key?.on('down', () => this.togglePhysicsDebug());

        const onVirtualInput = (inputs: { left?: boolean; right?: boolean; up?: boolean }) =>
        {
            if (typeof inputs.left === 'boolean') this.touchControls.left = inputs.left;
            if (typeof inputs.right === 'boolean') this.touchControls.right = inputs.right;
            if (typeof inputs.up === 'boolean') this.touchControls.up = inputs.up;
        };

        const onVirtualInteract = () =>
        {
            if (this.elderNpc && this.elderNpc.isInteractable && !this.isDialogueActive)
            {
                this.elderNpc.triggerInteraction();
            }
            else if (this.merchantNpc && this.merchantNpc.isInteractable && !this.isDialogueActive)
            {
                this.merchantNpc.triggerInteraction();
            }
        };

        const onVirtualAttack = () => this.handlePlayerAttack();
        const onVirtualCycleWeapon = () => this.handleCycleWeapon();
        const onVirtualDash = () => this.handlePlayerDash();
        const onTriggerBomb = () => this.handleTriggerBombAoE(2);
        const onTogglePhysicsDebug = () => this.togglePhysicsDebug();

        EventBus.on('virtual-input', onVirtualInput);
        EventBus.on('virtual-interact', onVirtualInteract);
        EventBus.on('virtual-attack', onVirtualAttack);
        EventBus.on('virtual-cycle-weapon', onVirtualCycleWeapon);
        EventBus.on('virtual-dash', onVirtualDash);
        EventBus.on('trigger-bomb', onTriggerBomb);
        EventBus.on('toggle-physics-debug', onTogglePhysicsDebug);

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

        const onGameOver = () =>
        {
            this.physics.pause();
        };
        DomainEvents.on(GAME_OVER_EVENT, onGameOver);

        this.events.on('shutdown', () =>
        {
            DomainEvents.off<SkinChangedPayload>(SKIN_CHANGED_EVENT, onSkinChanged);
            DomainEvents.off(GAME_PAUSED_EVENT, onGamePaused);
            DomainEvents.off(GAME_RESUMED_EVENT, onGameResumed);
            DomainEvents.off(GAME_OVER_EVENT, onGameOver);
            EventBus.removeListener('dialogue-open-state', onDialogueState);
            EventBus.removeListener('virtual-input', onVirtualInput);
            EventBus.removeListener('virtual-interact', onVirtualInteract);
            EventBus.removeListener('virtual-attack', onVirtualAttack);
            EventBus.removeListener('virtual-cycle-weapon', onVirtualCycleWeapon);
            EventBus.removeListener('virtual-dash', onVirtualDash);
            EventBus.removeListener('trigger-bomb', onTriggerBomb);
            EventBus.removeListener('toggle-physics-debug', onTogglePhysicsDebug);
            soundManager.stopBgm();
            this.boss = undefined;
            this.door = undefined;
            this.goalFlag = undefined;
            this.elderNpc = undefined;
            this.merchantNpc = undefined;
            this.bgTileSprite = undefined;
        });

        EventBus.emit('current-scene-ready', this);
    }

    update (_time: number, delta: number)
    {
        if (this.levelProgress.isComplete || this.lives.isDead)
        {
            return;
        }

        if (this.isDialogueActive)
        {
            if (this.player && this.player.body)
            {
                this.player.setVelocityX(0);
            }
            return;
        }

        if (this.elderNpc && this.elderNpc.active)
        {
            this.elderNpc.updateProximity(this.player.x, this.player.y);
        }
        if (this.merchantNpc && this.merchantNpc.active)
        {
            this.merchantNpc.updateProximity(this.player.x, this.player.y);
        }

        const tickResult = tickSessionUseCase(this.session, delta, this.tickCache);

        if (tickResult.starExpired)
        {
            this.player.setStarPower(false);
        }
        if (tickResult.springExpired)
        {
            this.player.setSpringPower(false);
        }

        const isLeft = Boolean(this.cursors.left.isDown || this.wasdKeys?.left?.isDown || this.touchControls.left);
        const isRight = Boolean(this.cursors.right.isDown || this.wasdKeys?.right?.isDown || this.touchControls.right);
        const isUp = Boolean(this.cursors.up.isDown || this.wasdKeys?.up?.isDown || this.wasdKeys?.space?.isDown || this.touchControls.up);

        this.player.update({
            left: { isDown: isLeft },
            right: { isDown: isRight },
            up: { isDown: isUp },
        }, delta);

        for (const child of this.enemies.getChildren())
        {
            const enemy = child as Enemy;
            if (enemy.active)
            {
                enemy.update(this.player.x, this.player.y, delta);
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
            this.boss.update(this.player.x, this.player.y, delta);
        }

        if (this.bgTileSprite)
        {
            this.bgTileSprite.tilePositionX = this.cameras.main.scrollX * 0.25;
        }

        if (this.player.x >= this.level.finishX)
        {
            if (!this.boss || this.boss.entity.isDefeated)
            {
                this.handleGoalReached();
            }
        }
    }

    showDamageNumber (x: number, y: number, amount: number, isCrit = false): void
    {
        const text = this.add.text(x, y - 24, isCrit ? `-${amount} CRIT!` : `-${amount}`, {
            fontFamily: 'monospace, sans-serif',
            fontSize: isCrit ? '18px' : '15px',
            fontStyle: 'bold',
            color: isCrit ? '#ef4444' : '#facc15',
            stroke: '#000000',
            strokeThickness: 3,
        }).setDepth(25).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 56,
            alpha: 0,
            scale: isCrit ? 1.3 : 1.1,
            duration: 480,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy(),
        });
    }

    handlePlayerAttack (): void
    {
        if (this.isDialogueActive || this.lives.isDead || this.levelProgress.isComplete) return;

        const attack = performAttackUseCase(
            entities.weaponLoadout,
            entities.upgradeTree,
            entities.attackCooldown
        );

        if (!attack) return;

        const { weapon, damage } = attack;
        this.player.triggerSlashVfx(weapon.id);

        if (weapon.id === 'cyber-saber') soundManager.playSlash();
        else if (weapon.id === 'thunder-hammer') soundManager.playHammer();
        else if (weapon.id === 'plasma-blaster') soundManager.playBlaster();
        else if (weapon.id === 'boomerang-disc') soundManager.playDisc();

        if (weapon.type === 'melee')
        {
            this.resolveMeleeAttack(weapon.id, damage, weapon.range);
        }
        else if (weapon.type === 'ranged')
        {
            this.spawnPlayerProjectile(weapon.id, damage, weapon.projectileSpeed ?? 520);
        }
    }

    private resolveMeleeAttack (weaponId: string, damage: number, range: number): void
    {
        const dir = this.player.facingDir;
        const hitBoxX = this.player.x + (dir * (range / 2 + 10));
        const hitBoxY = this.player.y;
        const hitBoxWidth = range + 24;
        const hitBoxHeight = 56;

        const bounds = new Geom.Rectangle(
            hitBoxX - hitBoxWidth / 2,
            hitBoxY - hitBoxHeight / 2,
            hitBoxWidth,
            hitBoxHeight
        );

        let hitAny = false;

        // Melee slash destroys incoming enemy projectiles
        for (const child of this.enemyProjectiles.getChildren())
        {
            const spit = child as Phaser.Physics.Arcade.Sprite;
            if (!spit.active) continue;
            if (Geom.Intersects.RectangleToRectangle(bounds, spit.getBounds()))
            {
                spit.destroy();
                this.particleManager.emitStompBurst(spit.x, spit.y);
                trackAchievementUseCase(entities.achievementManager, 'spit-deflector', 1);
            }
        }

        const isHeavyWeapon = weaponId === 'thunder-hammer';

        for (const child of this.enemies.getChildren())
        {
            const enemy = child as Enemy;
            if (!enemy.active || enemy.entity.isDefeated) continue;

            if (Geom.Intersects.RectangleToRectangle(bounds, enemy.getBounds()))
            {
                hitAny = true;
                const res = enemy.takeDamage(damage, dir, isHeavyWeapon);
                this.showDamageNumber(enemy.x, enemy.y, damage, isHeavyWeapon);
                this.particleManager.emitStompBurst(enemy.x, enemy.y);

                if (res.defeated)
                {
                    this.handleEnemyDefeated(enemy);
                }
            }
        }

        if (this.boss && this.boss.active && !this.boss.entity.isDefeated && !this.boss.isInvulnerable)
        {
            if (Geom.Intersects.RectangleToRectangle(bounds, this.boss.getBounds()))
            {
                hitAny = true;
                this.boss.takeDamage(this.score, damage);
                this.showDamageNumber(this.boss.x, this.boss.y, damage, weaponId === 'thunder-hammer');
                this.particleManager.emitStompBurst(this.boss.x, this.boss.y);
            }
        }

        if (hitAny)
        {
            this.triggerHitStop(weaponId === 'thunder-hammer' ? 65 : 45);
            this.cameras.main.shake(120, weaponId === 'thunder-hammer' ? 0.008 : 0.004);
        }
    }

    private spawnPlayerProjectile (weaponId: string, damage: number, speed: number): void
    {
        const dir = this.player.facingDir;
        const spawnX = this.player.x + (dir * 26);
        const spawnY = this.player.y;

        const proj = new Projectile(this, spawnX, spawnY, {
            weaponId,
            damage,
            dir,
            speed,
            isBoomerang: weaponId === 'boomerang-disc',
        });

        this.playerProjectiles.add(proj);
    }

    private handleProjectileEnemyHit (proj: Projectile, enemy: Enemy): void
    {
        if (!proj.active || !enemy.active || enemy.entity.isDefeated) return;

        const dir = proj.body?.velocity.x ? Math.sign(proj.body.velocity.x) : this.player.facingDir;
        const res = enemy.takeDamage(proj.damage, dir);
        this.showDamageNumber(enemy.x, enemy.y, proj.damage, false);
        this.particleManager.emitStompBurst(enemy.x, enemy.y);

        if (res.defeated)
        {
            this.handleEnemyDefeated(enemy);
        }

        if (!proj.pierce && !proj.isBoomerang)
        {
            proj.destroy();
        }
    }

    private handleProjectileBossHit (proj: Projectile, boss: Boss): void
    {
        if (!proj.active || !boss.active || boss.entity.isDefeated || boss.isInvulnerable) return;

        boss.takeDamage(this.score, proj.damage);
        this.showDamageNumber(boss.x, boss.y, proj.damage, false);
        this.particleManager.emitStompBurst(boss.x, boss.y);

        if (!proj.pierce && !proj.isBoomerang)
        {
            proj.destroy();
        }
    }

    private handleCycleWeapon (): void
    {
        const nextWeapon = entities.weaponLoadout.cycleNext();
        soundManager.playSelect();
        EventBus.emit('weapon-changed', nextWeapon);
    }

    private handlePlayerDash (): void
    {
        if (this.isDialogueActive || this.lives.isDead || this.levelProgress.isComplete) return;
        if (!entities.upgradeTree.hasDash) return;

        this.player.dash(this.player.facingDir);
    }

    togglePhysicsDebug (): void
    {
        const world = this.physics.world;
        if (!world.debugGraphic)
        {
            world.createDebugGraphic();
        }
        world.debugGraphic.setDepth(999);
        world.drawDebug = !world.drawDebug;
        if (!world.drawDebug)
        {
            world.debugGraphic.clear();
        }
        soundManager.playSelect();
    }

    private handleTriggerBombAoE (damage = 2): void
    {
        soundManager.playBombExplode();
        trackAchievementUseCase(entities.achievementManager, 'bomb-expert', 1);
        this.cameras.main.shake(320, 0.015);
        this.cameras.main.flash(180, 255, 200, 50, true);

        for (const child of this.enemies.getChildren())
        {
            const enemy = child as Enemy;
            if (enemy.active && !enemy.entity.isDefeated)
            {
                this.particleManager.emitCelebration(enemy.x, enemy.y);
                const res = enemy.takeDamage(damage, 0, true);
                this.showDamageNumber(enemy.x, enemy.y, damage, true);
                if (res.defeated)
                {
                    this.handleEnemyDefeated(enemy);
                }
            }
        }

        if (this.boss && this.boss.active && !this.boss.entity.isDefeated && !this.boss.isInvulnerable)
        {
            this.particleManager.emitCelebration(this.boss.x, this.boss.y);
            this.boss.takeDamage(this.score, damage);
            this.showDamageNumber(this.boss.x, this.boss.y, damage, true);
        }
    }

    private hitStopCounter = 0;

    private triggerHitStop (durationMs = 50): void
    {
        this.hitStopCounter++;
        const currentId = this.hitStopCounter;
        this.physics.world.isPaused = true;
        this.time.delayedCall(durationMs, () =>
        {
            if (currentId === this.hitStopCounter && !this.isDialogueActive && !this.scene.isPaused())
            {
                this.physics.world.isPaused = false;
            }
        });
    }

    private handlePlayerEnemyCollision (player: Player, enemy: Enemy)
    {
        if (enemy.entity.isDefeated) return;

        // Invincible star power knocks out enemies on contact
        if (player.hasStarPower)
        {
            player.setVelocityY(-260);
            this.particleManager.emitStompBurst(enemy.x, enemy.y);
            this.cameras.main.shake(100, 0.0035);
            this.handleEnemyDefeated(enemy);
            enemy.squashAndDefeat();
            return;
        }

        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const isFalling = playerBody.velocity.y > 0;
        const isAbove = player.y < enemy.y - 4;

        if (isFalling && isAbove)
        {
            // Armored slime stomp immunity check
            if (!enemy.entity.canStomp)
            {
                soundManager.playClink();
                this.particleManager.emitSpikeHit(enemy.x, enemy.y - 12);
                player.setVelocityY(-240);
                this.cameras.main.shake(130, 0.006);
                if (!player.isInvincible)
                {
                    player.triggerDamage(enemy.x);
                    this.damageTakenInLevel++;
                    this.cameras.main.flash(100, 239, 68, 68, true);
                    playerTakeDamageUseCase(this.lives);
                }
                return;
            }

            // Stomp victory: bounce, emit particle burst, freeze frame, camera shake, and defeat enemy
            player.setVelocityY(-340);
            this.particleManager.emitStompBurst(enemy.x, enemy.y);
            this.triggerHitStop(45);
            this.cameras.main.shake(100, 0.0035);
            this.handleEnemyDefeated(enemy);
            enemy.squashAndDefeat();
        }
        else
        {
            // Player hit by enemy
            if (!player.isInvincible)
            {
                player.triggerDamage(enemy.x);
                this.damageTakenInLevel++;
                this.cameras.main.shake(160, 0.008);
                this.cameras.main.flash(110, 239, 68, 68, true);
                playerTakeDamageUseCase(this.lives);
            }
        }
    }

    private handlePlayerSpikeCollision (spike: Spike)
    {
        if (this.player.isInvincible || this.player.hasStarPower) return;

        this.player.triggerDamage(spike.x);
        this.damageTakenInLevel++;
        this.particleManager.emitSpikeHit(spike.x, spike.y);
        this.cameras.main.shake(180, 0.009);
        this.cameras.main.flash(110, 239, 68, 68, true);
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
            this.triggerHitStop(60);
            this.cameras.main.shake(160, 0.008);
            boss.takeDamage(this.score);
            return;
        }

        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const isFalling = playerBody.velocity.y > 0;
        const isAbove = player.y < boss.y - 8;

        if (isFalling && isAbove && !boss.isInvulnerable)
        {
            // High bounce when stomping boss with impact hit-stop, punchy camera shake, and impact flash
            player.setVelocityY(-420);
            this.particleManager.emitStompBurst(boss.x, boss.y);
            this.triggerHitStop(75);
            this.cameras.main.shake(200, 0.012);
            this.cameras.main.flash(70, 255, 255, 255, true);
            soundManager.playStomp();
            boss.takeDamage(this.score);
        }
        else
        {
            // Player hit by boss
            if (!player.isInvincible)
            {
                player.triggerDamage(boss.x);
                this.cameras.main.shake(220, 0.012);
                this.cameras.main.flash(140, 239, 68, 68, true);
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

        this.physics.pause();

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

        if (this.damageTakenInLevel === 0 && this.currentLevelKey !== 'village')
        {
            trackAchievementUseCase(entities.achievementManager, 'untouchable', 1);
        }
        trackAchievementUseCase(
            entities.achievementManager,
            'arsenal-master',
            entities.weaponLoadout.ownedWeapons.length,
            true
        );

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

    private createPlainsScenery ()
    {
        const baseY = WORLD_HEIGHT - GROUND_HEIGHT;

        // Rolling green background hills
        const hillDefs = [
            { x: 300, radius: 140, color: 0x166534 },
            { x: 700, radius: 170, color: 0x15803d },
            { x: 1150, radius: 150, color: 0x166534 },
            { x: 1600, radius: 180, color: 0x15803d },
        ];
        for (const hill of hillDefs)
        {
            const g = this.add.graphics();
            g.setDepth(1);
            g.fillStyle(hill.color, 0.45);
            g.fillCircle(hill.x, baseY + hill.radius - 40, hill.radius);
        }

        // Windmills with rotating blades at x = 720 and x = 1450
        const windmillPositions = [720, 1450];
        for (const wx of windmillPositions)
        {
            const tower = this.add.graphics();
            tower.setDepth(1);
            tower.fillStyle(0x334155, 0.9);
            tower.beginPath();
            tower.moveTo(wx - 18, baseY);
            tower.lineTo(wx - 10, baseY - 90);
            tower.lineTo(wx + 10, baseY - 90);
            tower.lineTo(wx + 18, baseY);
            tower.closePath();
            tower.fillPath();

            tower.fillStyle(0xd97706, 1);
            tower.fillTriangle(wx - 14, baseY - 90, wx, baseY - 110, wx + 14, baseY - 90);

            const rotor = this.add.container(wx, baseY - 90);
            rotor.setDepth(2);
            const blades = this.add.graphics();
            blades.fillStyle(0xf8fafc, 0.85);
            for (let i = 0; i < 4; i++)
            {
                const angle = (i * Math.PI) / 2;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                blades.fillRoundedRect(cos * 4 - 3, sin * 4 - 3, 34 * (cos !== 0 ? Math.sign(cos) : 0.2), 6, 2);
            }
            rotor.add(blades);

            this.tweens.add({
                targets: rotor,
                angle: 360,
                duration: 7000,
                repeat: -1,
                ease: 'Linear',
            });
        }

        // Wildflower patches along the pathway
        const flowerX = [180, 260, 480, 560, 840, 920, 1220, 1340, 1680, 1760];
        const flowerColors = [0x38bdf8, 0xfacc15, 0xf472b6, 0xa855f7];
        for (let i = 0; i < flowerX.length; i++)
        {
            const fx = flowerX[i];
            const flower = this.add.graphics();
            flower.setDepth(2);
            flower.fillStyle(0x16a34a, 1);
            flower.fillRect(fx - 1, baseY - 12, 2, 12);
            flower.fillStyle(flowerColors[i % flowerColors.length], 0.95);
            flower.fillCircle(fx, baseY - 14, 4);
        }

        // Instructional Signposts
        const startSign = this.add.text(140, baseY - 70, '🌿 ທົ່ງຫຍ້າ Green Plains\n[A] [D] ແລ່ນ | [Space] ໂດດ', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '13px',
            color: '#bbf7d0',
            stroke: '#064e3b',
            strokeThickness: 3,
            align: 'center',
        });
        startSign.setOrigin(0.5, 0.5);
        startSign.setDepth(2);

        const midSign = this.add.text(820, baseY - 70, '⚔️ ລະວັງ Slime!\n(ໂດດຢຽບເພື່ອປາບ)', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '13px',
            color: '#fef08a',
            stroke: '#713f12',
            strokeThickness: 3,
            align: 'center',
        });
        midSign.setOrigin(0.5, 0.5);
        midSign.setDepth(2);
    }

    private createSkyIslandsScenery ()
    {
        const baseY = WORLD_HEIGHT - GROUND_HEIGHT;

        // Distant floating islands with stalactite underside
        const islands = [
            { x: 380, y: baseY - 160, width: 140, height: 35 },
            { x: 880, y: baseY - 220, width: 170, height: 42 },
            { x: 1420, y: baseY - 190, width: 150, height: 38 },
            { x: 1980, y: baseY - 240, width: 160, height: 40 },
        ];

        for (const isl of islands)
        {
            const g = this.add.graphics();
            g.setDepth(1);

            g.fillStyle(0x334155, 0.75);
            g.fillRoundedRect(isl.x - isl.width / 2, isl.y, isl.width, isl.height, 10);

            g.beginPath();
            g.moveTo(isl.x - isl.width / 3, isl.y + isl.height);
            g.lineTo(isl.x, isl.y + isl.height + 40);
            g.lineTo(isl.x + isl.width / 3, isl.y + isl.height);
            g.closePath();
            g.fillPath();

            g.fillStyle(0x22c55e, 0.85);
            g.fillRect(isl.x - isl.width / 2, isl.y, isl.width, 6);

            this.tweens.add({
                targets: g,
                y: g.y - 14,
                duration: 2400 + Math.random() * 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        // Hovering Floating Power Crystals
        const crystalPositions = [
            { x: 550, y: baseY - 260, color: 0x38bdf8 },
            { x: 1050, y: baseY - 280, color: 0xa855f7 },
            { x: 1550, y: baseY - 270, color: 0x38bdf8 },
            { x: 2050, y: baseY - 290, color: 0xf59e0b },
        ];

        for (const cry of crystalPositions)
        {
            const crystal = this.add.graphics();
            crystal.setDepth(2);
            crystal.fillStyle(cry.color, 0.85);
            crystal.beginPath();
            crystal.moveTo(cry.x, cry.y - 20);
            crystal.lineTo(cry.x + 10, cry.y - 6);
            crystal.lineTo(cry.x + 7, cry.y + 14);
            crystal.lineTo(cry.x, cry.y + 22);
            crystal.lineTo(cry.x - 7, cry.y + 14);
            crystal.lineTo(cry.x - 10, cry.y - 6);
            crystal.closePath();
            crystal.fillPath();

            crystal.fillStyle(0xffffff, 0.9);
            crystal.fillCircle(cry.x, cry.y, 4);

            this.tweens.add({
                targets: crystal,
                y: cry.y - 12,
                angle: 15,
                duration: 1800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        // Signposts
        const sign1 = this.add.text(160, baseY - 70, '☁️ ເກາະລອຍຟ້າ Sky Islands\n(ລະວັງຕົກເຫວ & ດົງໜາມ!)', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '13px',
            color: '#bae6fd',
            stroke: '#0369a1',
            strokeThickness: 3,
            align: 'center',
        });
        sign1.setOrigin(0.5, 0.5);
        sign1.setDepth(2);

        const hazardSign = this.add.text(1050, baseY - 70, '⚠️ ດົງໜາມອັນຕະລາຍ!\n(ໂດດຂ້າມເທິງພື້ນເລື່ອນ)', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '13px',
            color: '#fca5a5',
            stroke: '#991b1b',
            strokeThickness: 3,
            align: 'center',
        });
        hazardSign.setOrigin(0.5, 0.5);
        hazardSign.setDepth(2);
    }

    private createBossArenaScenery ()
    {
        const baseY = WORLD_HEIGHT - GROUND_HEIGHT;

        // Fortified Obsidian Arena Gate Towers at Left and Right edges
        const gates = [
            { x: 50, width: 80, height: 320 },
            { x: 1550, width: 80, height: 320 },
        ];

        for (const gate of gates)
        {
            const g = this.add.graphics();
            g.setDepth(2);

            g.fillStyle(0x0f172a, 1);
            g.fillRect(gate.x - gate.width / 2, baseY - gate.height, gate.width, gate.height);

            g.fillStyle(0x1e293b, 1);
            g.fillRect(gate.x - gate.width / 2 + 6, baseY - gate.height + 10, gate.width - 12, gate.height - 20);

            g.fillStyle(0xef4444, 0.9);
            for (let yOffset = 40; yOffset < gate.height - 30; yOffset += 45)
            {
                g.fillRect(gate.x - 16, baseY - gate.height + yOffset, 32, 6);
            }

            g.fillStyle(0x7c3aed, 1);
            g.fillCircle(gate.x, baseY - gate.height - 8, 14);
            g.fillStyle(0xa855f7, 0.9);
            g.fillCircle(gate.x, baseY - gate.height - 8, 7);
        }

        // Royal Purple Torchstands with pulsating plasma flame
        const torchX = [200, 520, 1080, 1400];
        for (const tx of torchX)
        {
            const stand = this.add.graphics();
            stand.setDepth(2);
            stand.fillStyle(0x334155, 1);
            stand.fillRect(tx - 4, baseY - 65, 8, 65);
            stand.fillStyle(0xf59e0b, 1);
            stand.fillRoundedRect(tx - 12, baseY - 78, 24, 14, 4);

            const flame = this.add.graphics();
            flame.setDepth(3);
            flame.fillStyle(0xa855f7, 0.95);
            flame.fillTriangle(tx - 8, baseY - 78, tx, baseY - 100, tx + 8, baseY - 78);
            flame.fillStyle(0xfbbf24, 0.9);
            flame.fillTriangle(tx - 4, baseY - 78, tx, baseY - 90, tx + 4, baseY - 78);

            this.tweens.add({
                targets: flame,
                scaleY: 1.25,
                scaleX: 0.88,
                alpha: 0.8,
                duration: 250 + Math.random() * 150,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });
        }

        // Grand Holographic Arena Banner
        const bannerContainer = this.add.container(800, 115);
        bannerContainer.setDepth(2);

        const bannerBg = this.add.graphics();
        bannerBg.fillStyle(0x0f172a, 0.88);
        bannerBg.lineStyle(2, 0xf59e0b, 1);
        bannerBg.fillRoundedRect(-220, -32, 440, 64, 12);
        bannerBg.strokeRoundedRect(-220, -32, 440, 64, 12);

        const bannerText = this.add.text(0, 0, '👑 ຫ້ອງສູ້ບອສໃຫຍ່: KING SLIME 👑\n(ຫຼົບການກະໂດດ & ໂດດຢຽບມົງກຸດ!)', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '15px',
            color: '#fef08a',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#7c3aed',
            strokeThickness: 3,
        });
        bannerText.setOrigin(0.5, 0.5);

        bannerContainer.add([bannerBg, bannerText]);

        this.tweens.add({
            targets: bannerContainer,
            y: 122,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private createSky ()
    {
        let bgKey = 'bg-plains';
        if (this.currentLevelKey === 'village' || this.level.scenery === 'village')
        {
            bgKey = 'bg-village';
        }
        else if (this.currentLevelKey === 'level-2' || this.level.scenery === 'sky-islands')
        {
            bgKey = 'bg-sky-islands';
        }
        else if (this.currentLevelKey === 'level-3' || this.level.scenery === 'boss-arena' || Boolean(this.level.boss))
        {
            bgKey = 'bg-boss-arena';
        }

        if (this.textures.exists(bgKey))
        {
            // TileSprite pinned to camera viewport with parallax scrolling in update
            const bg = this.add.tileSprite(0, 0, 1280, WORLD_HEIGHT, bgKey);
            bg.setOrigin(0, 0);
            bg.setScrollFactor(0);
            bg.setDepth(-10);
            this.bgTileSprite = bg;
        }
        else
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
            sky.setDepth(-10);
        }
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

    private handleEnemyDefeated (enemy: Enemy): void
    {
        defeatEnemyUseCase(enemy.entity, this.score);

        // Track achievements
        trackAchievementUseCase(entities.achievementManager, 'first-blood', 1);
        trackAchievementUseCase(entities.achievementManager, 'slime-slayer', 1);
        if (enemy.enemyType === 'slime-flying')
        {
            trackAchievementUseCase(entities.achievementManager, 'flying-ace', 1);
        }
        else if (enemy.enemyType === 'slime-armored')
        {
            trackAchievementUseCase(entities.achievementManager, 'tank-breaker', 1);
        }

        // Roll dynamic coin drops based on archetype
        if (Math.random() <= enemy.entity.coinDropChance)
        {
            const amount = enemy.entity.coinDropAmount;
            for (let i = 0; i < amount; i++)
            {
                const offsetX = amount > 1 ? (i * 20 - (amount - 1) * 10) : 0;
                const coin = new Coin(this, enemy.x + offsetX, enemy.y - 10);
                this.coins.add(coin);
                this.particleManager.emitCoinSparkle(coin.x, coin.y);
            }
        }
    }

    private spawnEnemySpit (x: number, y: number, dirX: number, dirY = 0): void
    {
        const spit = this.physics.add.sprite(x, y, SPIT_PROJECTILE_KEY);
        this.enemyProjectiles.add(spit);

        const body = spit.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.allowGravity = false;
            spit.setVelocity(dirX * 220, dirY * 220);
        }

        this.time.delayedCall(3500, () =>
        {
            if (spit.active) spit.destroy();
        });
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
                    item.speed,
                    undefined,
                    item.type ?? 'slime'
                );
                enemy.onSpit = (x, y, dirX, dirY) =>
                {
                    this.spawnEnemySpit(x, y, dirX, dirY);
                };
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
