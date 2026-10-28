import { EventBus } from '../../EventBus';
import { Geom, Input, Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Platform } from '../objects/Platform';
import { Enemy, SPIT_PROJECTILE_KEY } from '../objects/Enemy';
import { Spike } from '../objects/Spike';
import { MovingPlatform } from '../objects/MovingPlatform';
import { Boss } from '../objects/Boss';
import { NPC } from '../objects/NPC';
import { ParticleManager } from '../effects/ParticleManager';
import { soundManager } from '../../audio/SoundManager';
import { Level } from '../Level';
import { getGameContent } from '../../content/ContentCatalog';
import {
    getStageBossSpawn,
    getStageDefinition,
    getStageEnemySpawns,
    StageDefinition,
} from '../stages/StageDefinition';
import {
    BrokenGate,
    buildStageScenery,
    ResourceNodeView,
    WaypointView,
} from '../scenery/StageBuilder';
import { buildVillageScenery, InteractiveBuilding } from '../scenery/VillageBuilder';
import { LEVEL_CATALOG } from '../levelCatalog';
import { DomainEvents } from '../../../domain/DomainEvents';
import { Health } from '../../../domain/entities/Health';
import {
    playerTakeDamageUseCase,
    PLAYER_DIED_EVENT,
} from '../../../application/PlayerTakeDamageUseCase';
import {
    SKIN_CHANGED_EVENT,
    SkinChangedPayload,
} from '../../../application/SelectSkinUseCase';
import {
    GAME_PAUSED_EVENT,
    GAME_RESUMED_EVENT,
} from '../../../application/TogglePauseUseCase';
import { entities } from '../../composition';
import { performAttackUseCase } from '../../../application/PerformAttackUseCase';
import { cycleEquippedWeaponUseCase } from '../../../application/CycleEquippedWeaponUseCase';
import { collectEnemyDropsUseCase } from '../../../application/CollectEnemyDropsUseCase';
import { EnemyDefinition } from '../../../domain/entities/Enemy';
import { awardBossRewardUseCase, reviveBossAfterFailedFinisherUseCase } from '../../../application/AwardBossRewardUseCase';
import { harvestResourceNodeUseCase } from '../../../application/HarvestResourceNodeUseCase';

const WORLD_HEIGHT = 720;
const GROUND_HEIGHT = 64;
/** Top of the ground: where buildings, trees and nodes stand. */
const GROUND_Y = WORLD_HEIGHT - GROUND_HEIGHT;
const GROUND_TILE_SIZE = 64;

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    ground: Phaser.Physics.Arcade.StaticGroup;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    movingPlatforms: Phaser.Physics.Arcade.Group;
    spikes: Phaser.Physics.Arcade.StaticGroup;
    enemies: Phaser.Physics.Arcade.Group;
    enemyProjectiles: Phaser.Physics.Arcade.Group;
    boss?: Boss;
    elderNpc?: NPC;
    isDialogueActive = false;
    particleManager: ParticleManager;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    wasdKeys?: Record<string, Phaser.Input.Keyboard.Key>;
    touchControls = { left: false, right: false, up: false };
    bgTileSprite?: Phaser.GameObjects.TileSprite;
    level: Level;
    /** Zones, resource nodes, enemies and gate of the current Stage; undefined in the village. */
    stage?: StageDefinition;
    /** True once the stage boss is beaten and the stage-cleared event has been sent. */
    isStageCleared = false;
    health: Health;
    currentLevelKey = 'village';
    currentSkinId = 'cyber-blue';

    // Knowledge Quest: Village Hub & 4-Zone Stage fields
    private interactiveBuildings: InteractiveBuilding[] = [];
    private resourceNodes: ResourceNodeView[] = [];
    private waypoints: WaypointView[] = [];
    private brokenGate?: BrokenGate;
    private interactionPromptText?: Phaser.GameObjects.Text;
    private activeInteraction: (() => void) | null = null;

    constructor ()
    {
        super('Game');
    }

    init (data?: {
        levelKey?: string;
        score?: number;
        lives?: number;
        skinId?: string;
        elapsedMs?: number;
    })
    {
        // Reset per-run references to prevent lingering stale objects across restarts
        this.boss = undefined;
        this.elderNpc = undefined;
        this.isDialogueActive = false;
        this.touchControls = { left: false, right: false, up: false };

        this.currentLevelKey = data?.levelKey ?? 'village';
        this.currentSkinId = data?.skinId ?? 'cyber-blue';

        this.interactiveBuildings = [];
        this.resourceNodes = [];
        this.waypoints = [];
        this.brokenGate = undefined;
        this.stage = undefined;
        this.interactionPromptText = undefined;
        this.activeInteraction = null;
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
        this.elderNpc = undefined;

        this.level = this.cache.json.get(this.currentLevelKey) as Level;
        this.stage = getStageDefinition(getGameContent().stages, this.currentLevelKey);
        this.isStageCleared = false;
        // One Health for the whole session so the backpack UI can heal the same hearts the scene damages
        this.health = entities.health;
        this.health.reset();

        this.physics.world.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87ceeb);
        this.camera.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        this.createSky();

        this.ground = this.createGround();
        this.platforms = this.createPlatforms();
        this.movingPlatforms = this.createMovingPlatforms();
        this.spikes = this.createSpikes();
        this.enemies = this.createEnemies();

        this.particleManager = new ParticleManager(this);

        if (this.level.scenery === 'village' || this.currentLevelKey === 'village')
        {
            this.interactiveBuildings = buildVillageScenery(
                this,
                GROUND_Y,
                Boolean(entities.forgeUnlocked || entities.books['book-ch1']?.examPassed)
            );
            const baseY = WORLD_HEIGHT - GROUND_HEIGHT - 24;
            this.elderNpc = new NPC(this, 460, baseY, 'npc-elder');
            this.elderNpc.onInteract = () =>
            {
                EventBus.emit('start-dialogue', 'village_elder');
            };
        }
        else if (this.stage)
        {
            const built = buildStageScenery(this, this.stage, GROUND_Y, entities.repairedGates);
            this.resourceNodes = built.resourceNodes;
            this.waypoints = built.waypoints;
            this.brokenGate = built.brokenGate;
        }

        // Floating interaction prompt text
        this.interactionPromptText = this.add.text(0, 0, '', {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '13px',
            color: '#fef08a',
            stroke: '#0f172a',
            strokeThickness: 3,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            padding: { x: 8, y: 4 },
        });
        this.interactionPromptText.setOrigin(0.5, 1);
        this.interactionPromptText.setDepth(30);
        this.interactionPromptText.setVisible(false);

        const handleInteract = () =>
        {
            if (this.isDialogueActive) return;

            if (this.activeInteraction)
            {
                this.activeInteraction();
                return;
            }

            if (this.elderNpc && this.elderNpc.isInteractable)
            {
                this.elderNpc.triggerInteraction();
            }
        };

        const eKey = this.input.keyboard?.addKey('E');
        eKey?.on('down', handleInteract);

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

        this.physics.add.collider(this.player, this.ground);
        this.physics.add.collider(this.player, this.platforms);
        // The gate wall is built with the scenery, before the player exists, so it is hooked up here
        if (this.brokenGate?.wall)
        {
            this.physics.add.collider(this.player, this.brokenGate.wall);
        }
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

        this.physics.add.overlap(this.player, this.enemies, (playerObj, enemyObj) =>
        {
            this.handlePlayerEnemyCollision(playerObj as Player, enemyObj as Enemy);
        });

        // Spawn Boss if the stage has one
        const bossSpawn = this.stage ? getStageBossSpawn(this.stage) : undefined;
        if (bossSpawn)
        {
            const bossDefinition = this.getEnemyDefinition(bossSpawn.enemyId);
            this.boss = new Boss(this, bossSpawn.x, bossSpawn.y, bossDefinition?.maxHp ?? 5);
            this.boss.awaitFinisher = this.currentLevelKey === 'stage-ch1';
            this.boss.onLanding = (x, y) =>
            {
                this.particleManager.emitLandingDust(x, y);
                this.cameras.main.shake(140, 0.007);
            };
            this.boss.onDefeated = () =>
            {
                if (this.currentLevelKey === 'stage-ch1')
                {
                    EventBus.emit('open-quiz-finisher');
                }
            };
            this.boss.onSummonMinion = (x, y) =>
            {
                if (this.enemies.countActive(true) < 3)
                {
                    const minion = new Enemy(this, x, y, 140, 85);
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
            if (this.player.isInvincible) return;

            this.player.triggerDamage(this.player.x);
            this.particleManager.emitSpikeHit(this.player.x, this.player.y);
            this.cameras.main.shake(150, 0.007);
            this.cameras.main.flash(100, 34, 197, 94, true);
            playerTakeDamageUseCase(this.health);
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
        const f2Key = this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.F2);

        jKey?.on('down', () => this.handlePlayerAttack());
        zKey?.on('down', () => this.handlePlayerAttack());
        qKey?.on('down', () => this.handleCycleWeapon());
        f2Key?.on('down', () => this.togglePhysicsDebug());

        const onVirtualInput = (inputs: { left?: boolean; right?: boolean; up?: boolean }) =>
        {
            if (typeof inputs.left === 'boolean') this.touchControls.left = inputs.left;
            if (typeof inputs.right === 'boolean') this.touchControls.right = inputs.right;
            if (typeof inputs.up === 'boolean') this.touchControls.up = inputs.up;
        };

        const onVirtualInteract = () => handleInteract();

        const onVirtualAttack = () => this.handlePlayerAttack();
        const onVirtualCycleWeapon = () => this.handleCycleWeapon();
        const onTogglePhysicsDebug = () => this.togglePhysicsDebug();

        const onQuizFinisherPassed = () =>
        {
            this.boss?.playDefeatTween();
            const reward = awardBossRewardUseCase(entities.backpack);
            EventBus.emit('backpack-changed');
            const rewardText = reward.collected.map(d => `+${d.count} ${this.getItemEmoji(d.itemId)} ${d.itemId}`).join(' & ');
            this.showLootNotification(this.player.x, this.player.y - 40, reward.overflow.length > 0 ? `${rewardText} 🎒 ກະເປົາເຕັມ!` : rewardText, '#a855f7');
            this.particleManager.emitCelebration(this.player.x, this.player.y);
            this.cameras.main.shake(450, 0.018);
            this.cameras.main.flash(200, 255, 255, 255, true);
            this.time.delayedCall(1500, () =>
            {
                this.handleStageCleared();
            });
        };

        const onQuizFinisherFailed = () =>
        {
            if (this.boss)
            {
                const healAmount = reviveBossAfterFailedFinisherUseCase(this.boss.entity);
                this.boss.reviveAfterFailedFinisher();
                this.particleManager.emitSpikeHit(this.boss.x, this.boss.y);
                this.showLootNotification(this.boss.x, this.boss.y - 30, `⚠️ Boss ຟື້ນຟູ ${healAmount} HP!`, '#ef4444');
                soundManager.playPowerUp();
            }
        };

        const onGateRepaired = (gateId: string) =>
        {
            if (this.brokenGate && this.brokenGate.gateId === gateId)
            {
                this.brokenGate.repair();
                this.particleManager.emitCelebration(this.brokenGate.x, this.brokenGate.y - 40);
                soundManager.playPowerUp();
            }
        };

        EventBus.on('virtual-input', onVirtualInput);
        EventBus.on('virtual-interact', onVirtualInteract);
        EventBus.on('virtual-attack', onVirtualAttack);
        EventBus.on('virtual-cycle-weapon', onVirtualCycleWeapon);
        EventBus.on('toggle-physics-debug', onTogglePhysicsDebug);
        EventBus.on('quiz-finisher-passed', onQuizFinisherPassed);
        EventBus.on('quiz-finisher-failed', onQuizFinisherFailed);
        EventBus.on('gate-repaired', onGateRepaired);

        // Start BGM (boss theme for level-3, adventure theme for levels 1 & 2)
        const isBossStage = Boolean(bossSpawn);
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
        DomainEvents.on(PLAYER_DIED_EVENT, onGameOver);

        this.events.on('shutdown', () =>
        {
            DomainEvents.off<SkinChangedPayload>(SKIN_CHANGED_EVENT, onSkinChanged);
            DomainEvents.off(GAME_PAUSED_EVENT, onGamePaused);
            DomainEvents.off(GAME_RESUMED_EVENT, onGameResumed);
            DomainEvents.off(PLAYER_DIED_EVENT, onGameOver);
            EventBus.removeListener('dialogue-open-state', onDialogueState);
            EventBus.removeListener('virtual-input', onVirtualInput);
            EventBus.removeListener('virtual-interact', onVirtualInteract);
            EventBus.removeListener('virtual-attack', onVirtualAttack);
            EventBus.removeListener('virtual-cycle-weapon', onVirtualCycleWeapon);
            EventBus.removeListener('toggle-physics-debug', onTogglePhysicsDebug);
            EventBus.removeListener('quiz-finisher-passed', onQuizFinisherPassed);
            EventBus.removeListener('quiz-finisher-failed', onQuizFinisherFailed);
            EventBus.removeListener('gate-repaired', onGateRepaired);
            soundManager.stopBgm();
            this.boss = undefined;
            this.elderNpc = undefined;
            this.bgTileSprite = undefined;
            entities.attackCooldown.reset();
            this.input.keyboard?.removeAllKeys(true);
        });

        entities.attackCooldown.reset();
        EventBus.emit('current-scene-ready', this);
    }

    update (_time: number, delta: number)
    {
        entities.attackCooldown.tick(delta);

        if (this.isStageCleared || this.health.isDead)
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

        this.updateInteractionPrompt();

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
        if (this.isDialogueActive || this.health.isDead || this.isStageCleared) return;

        const attack = performAttackUseCase(entities.equipment, entities.attackCooldown);

        if (!attack) return;

        const { weaponId, damage, range } = attack;
        this.player.triggerSlashVfx(weaponId);
        soundManager.playSlash();
        this.resolveMeleeAttack(weaponId, damage, range);
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
                this.boss.takeDamage(damage);
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

    private handleCycleWeapon (): void
    {
        const nextWeapon = cycleEquippedWeaponUseCase(entities.equipment, entities.backpack);
        soundManager.playSelect();
        EventBus.emit('weapon-changed', nextWeapon);
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
                    this.cameras.main.flash(100, 239, 68, 68, true);
                    playerTakeDamageUseCase(this.health);
                }
                return;
            }

            // Stomp victory: bounce, emit particle burst, freeze frame, camera shake, and defeat enemy
            const stompDamage = entities.equipment.equippedStats.damage;
            player.setVelocityY(-340);
            this.particleManager.emitStompBurst(enemy.x, enemy.y);
            this.triggerHitStop(45);
            this.cameras.main.shake(100, 0.0035);
            this.showDamageNumber(enemy.x, enemy.y, stompDamage, false);
            if (enemy.takeDamage(stompDamage, 0).defeated)
            {
                this.handleEnemyDefeated(enemy);
            }
        }
        else
        {
            // Player hit by enemy
            if (!player.isInvincible)
            {
                player.triggerDamage(enemy.x);
                this.cameras.main.shake(160, 0.008);
                this.cameras.main.flash(110, 239, 68, 68, true);
                playerTakeDamageUseCase(this.health);
            }
        }
    }

    private handlePlayerSpikeCollision (spike: Spike)
    {
        if (this.player.isInvincible) return;

        this.player.triggerDamage(spike.x);
        this.particleManager.emitSpikeHit(spike.x, spike.y);
        this.cameras.main.shake(180, 0.009);
        this.cameras.main.flash(110, 239, 68, 68, true);
        playerTakeDamageUseCase(this.health);
    }

    private handlePlayerBossCollision (player: Player, boss: Boss)
    {
        if (boss.entity.isDefeated) return;

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
            boss.takeDamage(entities.equipment.equippedStats.damage);
        }
        else
        {
            // Player hit by boss
            if (!player.isInvincible)
            {
                player.triggerDamage(boss.x);
                this.cameras.main.shake(220, 0.012);
                this.cameras.main.flash(140, 239, 68, 68, true);
                playerTakeDamageUseCase(this.health);
            }
        }
    }

    private handleStageCleared ()
    {
        if (this.isStageCleared) return;
        this.isStageCleared = true;

        this.physics.pause();
        soundManager.stopBgm();
        soundManager.playLevelComplete();
        EventBus.emit('stage-cleared', { stageId: this.currentLevelKey });
    }

    private updateInteractionPrompt (): void
    {
        if (!this.player || !this.interactionPromptText || this.isDialogueActive || this.health.isDead)
        {
            if (this.interactionPromptText) this.interactionPromptText.setVisible(false);
            this.activeInteraction = null;
            return;
        }

        const px = this.player.x;
        const py = this.player.y;

        // 1. Check Village Buildings
        if (this.currentLevelKey === 'village')
        {
            for (const b of this.interactiveBuildings)
            {
                if (Math.abs(px - b.x) < 70)
                {
                    this.interactionPromptText.setText(b.label);
                    this.interactionPromptText.setPosition(b.x, py - 40);
                    this.interactionPromptText.setVisible(true);
                    this.activeInteraction = b.action;
                    return;
                }
            }
        }

        // 2. Check Stage Ch1 Waypoints
        for (const wp of this.waypoints)
        {
            if (Math.abs(px - wp.x) < 70)
            {
                this.interactionPromptText.setText(`🌀 [E] ${wp.name}`);
                this.interactionPromptText.setPosition(wp.x, py - 40);
                this.interactionPromptText.setVisible(true);
                this.activeInteraction = () => EventBus.emit('open-waypoint', wp.name);
                return;
            }
        }

        // 3. Check Broken Gate
        if (this.brokenGate && !entities.repairedGates.has(this.brokenGate.gateId))
        {
            if (Math.abs(px - this.brokenGate.x) < 80)
            {
                this.interactionPromptText.setText('🚪 [E] ສ້ອມແປງປະຕູໃຫຍ່ (Repair Gate)');
                this.interactionPromptText.setPosition(this.brokenGate.x, py - 40);
                this.interactionPromptText.setVisible(true);
                this.activeInteraction = () => EventBus.emit('open-gate-repair', this.brokenGate!.gateId, this.brokenGate!.requirements);
                return;
            }
        }

        // 4. Check Resource Nodes
        for (const node of this.resourceNodes)
        {
            if (!node.harvested && Math.abs(px - node.x) < 65)
            {
                this.interactionPromptText.setText(node.label);
                this.interactionPromptText.setPosition(node.x, py - 40);
                this.interactionPromptText.setVisible(true);
                this.activeInteraction = () => this.handleHarvestResourceNode(node);
                return;
            }
        }

        // 5. Check NPCs
        if (this.elderNpc && this.elderNpc.isInteractable)
        {
            this.interactionPromptText.setText('💬 [E] ລົມກັບຫົວໜ້າໝູ່ບ້ານ');
            this.interactionPromptText.setPosition(this.elderNpc.x, py - 40);
            this.interactionPromptText.setVisible(true);
            this.activeInteraction = () => this.elderNpc!.triggerInteraction();
            return;
        }

        this.interactionPromptText.setVisible(false);
        this.activeInteraction = null;
    }

    private handleHarvestResourceNode (node: ResourceNodeView): void
    {
        const result = harvestResourceNodeUseCase(node, entities.backpack);
        if (result.success)
        {
            soundManager.playCoin();
            node.harvested = true;
            node.graphic.clear();
            this.particleManager.emitCelebration(node.x, node.y - 20);

            EventBus.emit('backpack-changed');
            const dropTexts = result.drops.map(d => `+${d.count} ${this.getItemEmoji(d.itemId)} ${d.itemId}`).join(', ');
            this.showLootNotification(node.x, node.y - 30, `🎒 ${dropTexts}`, '#22c55e');
        }
        else
        {
            soundManager.playClink();
            if (result.reason === 'missing_tool')
            {
                this.showLootNotification(node.x, node.y - 30, `⚠️ ຕ້ອງການ ${node.requiredTool?.toUpperCase()}!`, '#f59e0b');
            }
            else if (result.reason === 'backpack_full')
            {
                this.showLootNotification(node.x, node.y - 30, '⚠️ ກະເປົາເຕັມ (20/20)!', '#ef4444');
            }
        }
    }

    showLootNotification (x: number, y: number, textStr: string, color = '#22c55e'): void
    {
        const text = this.add.text(x, y - 24, textStr, {
            fontFamily: '"Noto Sans Lao", sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            color,
            stroke: '#000000',
            strokeThickness: 3,
        }).setDepth(26).setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            scale: 1.15,
            duration: 1200,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy(),
        });
    }

    private createSky ()
    {
        let bgKey = 'bg-plains';
        if (this.currentLevelKey === 'village' || this.level.scenery === 'village')
        {
            bgKey = 'bg-village';
        }
        else if (this.stage)
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

    private getItemEmoji (itemId: string): string
    {
        const itemEmojiMap: Record<string, string> = {
            'wood': '🪵',
            'stone': '🪨',
            'iron-ore': '⛏️',
            'herb': '🌿',
            'fiber': '🌾',
            'crystal': '💎',
            'boss-core': '🔮',
        };
        return itemEmojiMap[itemId] || '📦';
    }

    private handleEnemyDefeated (enemy: Enemy): void
    {
        soundManager.playStomp();

        // Materials from the enemy's drop table go straight into the backpack
        const drops = collectEnemyDropsUseCase(enemy.entity, entities.backpack);
        if (drops.collected.length > 0 || drops.overflow.length > 0)
        {
            const parts = drops.collected.map(d => `+${d.count} ${this.getItemEmoji(d.itemId)} ${d.itemId}`);
            if (drops.overflow.length > 0) parts.push('🎒 ກະເປົາເຕັມ!');
            this.showLootNotification(enemy.x, enemy.y - 30, parts.join(', '), drops.overflow.length > 0 ? '#f59e0b' : '#22c55e');
            soundManager.playCoin();
            EventBus.emit('backpack-changed');
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

    private getEnemyDefinition (enemyId: string): EnemyDefinition | undefined
    {
        return getGameContent().enemies.find(e => e.id === enemyId);
    }

    private createEnemies ()
    {
        const enemies = this.physics.add.group();

        for (const spawn of this.stage ? getStageEnemySpawns(this.stage) : [])
        {
            const enemy = new Enemy(
                this,
                spawn.x,
                spawn.y,
                spawn.patrolDistance,
                spawn.speed,
                spawn.type ?? 'slime',
                this.getEnemyDefinition(spawn.enemyId)
            );
            if (spawn.scale) enemy.setScale(spawn.scale);
            enemy.onSpit = (x, y, dirX, dirY) =>
            {
                this.spawnEnemySpit(x, y, dirX, dirY);
            };
            enemies.add(enemy);
        }

        return enemies;
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
