import { EventBus } from '../../EventBus';
import { Input, Scene } from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Spike } from '../objects/Spike';
import { MovingPlatform } from '../objects/MovingPlatform';
import { Boss } from '../objects/Boss';
import { NPC } from '../objects/NPC';
import { ParticleManager } from '../effects/ParticleManager';
import { describeDrops, showLootNotification } from '../effects/FloatingText';
import { CombatController } from '../controllers/CombatController';
import { InteractionController } from '../controllers/InteractionController';
import { soundManager } from '../../audio/SoundManager';
import { Level } from '../Level';
import { getGameContent } from '../../content/ContentCatalog';
import { HeldItemSprite } from '../objects/HeldItemSprite';
import { findTool } from '../../../domain/entities/HeldItem';
import {
    getStageBossSpawn,
    getStageDefinition,
    getStageEnemySpawns,
    getStageExit,
    StageDefinition,
} from '../stages/StageDefinition';
import { buildStageScenery, BrokenGate, ResourceNodeView, WaypointView } from '../scenery/StageBuilder';
import { buildVillageScenery, InteractiveBuilding } from '../scenery/VillageBuilder';
import {
    createGround,
    createMovingPlatforms,
    createPlatforms,
    createSky,
    createSpikes,
    GROUND_HEIGHT,
    GROUND_Y,
    SkyBackdrop,
    WORLD_HEIGHT,
} from '../scenery/WorldBuilder';
import { enqueueGameAssets } from './Preloader';
import { DomainEvents } from '../../../domain/DomainEvents';
import { Health } from '../../../domain/entities/Health';
import { PLAYER_DIED_EVENT } from '../../../application/PlayerTakeDamageUseCase';
import { SKIN_CHANGED_EVENT, SkinChangedPayload } from '../../../application/SelectSkinUseCase';
import { GAME_PAUSED_EVENT, GAME_RESUMED_EVENT } from '../../../application/TogglePauseUseCase';
import { entities } from '../../composition';
import { EnemyDefinition } from '../../../domain/entities/Enemy';
import { scaleEnemyDefinition } from '../../../domain/entities/StageScaling';
import { GROUND_SINK } from '../physicsConstants';
import { notifyTutorial } from '../../tutorial';
import { ITEM_BROKEN_EVENT, ITEM_WORN_EVENT, ItemBrokenPayload, ItemWornPayload } from '../../../application/WearItemUseCase';

/** How far from the start the hero has walked when the hint "walk" counts as done (px). */
const MOVED_AWAY_DISTANCE = 120;
import { awardBossRewardUseCase, reviveBossAfterFailedFinisherUseCase } from '../../../application/AwardBossRewardUseCase';

/**
 * Hosts both the Village Hub and a Stage (chosen by `levelKey`). The scene builds the world,
 * wires physics and events, and runs the frame loop; fighting and "press E" interactions live
 * in `CombatController` and `InteractionController`.
 */
export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    player: Player;
    heldItem: HeldItemSprite;
    ground: Phaser.Physics.Arcade.StaticGroup;
    platforms: Phaser.Physics.Arcade.StaticGroup;
    movingPlatforms: Phaser.Physics.Arcade.Group;
    spikes: Phaser.Physics.Arcade.StaticGroup;
    enemies: Phaser.Physics.Arcade.Group;
    enemyProjectiles: Phaser.Physics.Arcade.Group;
    boss?: Boss;
    /** Everyone in the village the hero can talk to (the elder, Mina). */
    villagers: NPC[] = [];
    isDialogueActive = false;
    particleManager: ParticleManager;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    wasdKeys?: Record<string, Phaser.Input.Keyboard.Key>;
    touchControls = { left: false, right: false, up: false };
    skyBackdrop?: SkyBackdrop;
    level: Level;
    /** Zones, resource nodes, enemies and gate of the current Stage; undefined in the village. */
    stage?: StageDefinition;
    /** True once the stage boss is beaten and the stage-cleared event has been sent. */
    isStageCleared = false;
    /** True once the hero has walked far enough from the start to count for the first tutorial hint. */
    private hasMovedAway = false;
    /** Walking past this x clears a Stage that has no boss (see `exit` in stages.json). */
    private stageExitX?: number;
    health: Health;
    currentLevelKey = 'village';
    currentSkinId = 'cyber-blue';

    private combat: CombatController;
    private interaction: InteractionController;
    private interactiveBuildings: InteractiveBuilding[] = [];
    private resourceNodes: ResourceNodeView[] = [];
    private waypoints: WaypointView[] = [];
    private brokenGate?: BrokenGate;
    private bossBgmStarted = false;

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
        this.villagers = [];
        this.isDialogueActive = false;
        this.touchControls = { left: false, right: false, up: false };

        this.currentLevelKey = data?.levelKey ?? 'village';
        this.currentSkinId = data?.skinId ?? 'cyber-blue';

        this.interactiveBuildings = [];
        this.resourceNodes = [];
        this.waypoints = [];
        this.brokenGate = undefined;
        this.stage = undefined;
        this.stageExitX = undefined;
        this.bossBgmStarted = false;
    }

    preload ()
    {
        // Fallback load in case Game scene is loaded directly without Preloader
        enqueueGameAssets(this);
    }

    create ()
    {
        this.boss = undefined;
        this.villagers = [];

        this.level = this.cache.json.get(this.currentLevelKey) as Level;
        this.stage = getStageDefinition(getGameContent().stages, this.currentLevelKey);
        this.stageExitX = this.stage ? getStageExit(this.stage)?.x : undefined;
        this.isStageCleared = false;
        this.hasMovedAway = false;
        // One Health for the whole session so the backpack UI can heal the same hearts the scene damages
        this.health = entities.health;
        this.health.reset();

        this.combat = new CombatController(this);

        this.physics.world.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x87ceeb);
        this.camera.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        const isVillage = this.level.scenery === 'village' || this.currentLevelKey === 'village';
        const backdropKey = isVillage ? 'bg-village' : (this.level.scenery === 'cave' ? 'bg-cavern' : 'bg-plains');
        this.bossBgmStarted = false;
        this.skyBackdrop = createSky(this, this.level, backdropKey);

        this.ground = createGround(this, this.level);
        this.platforms = createPlatforms(this, this.level);
        this.movingPlatforms = createMovingPlatforms(this, this.level);
        this.spikes = createSpikes(this, this.level);
        this.enemies = this.createEnemies();

        this.particleManager = new ParticleManager(this);

        if (isVillage)
        {
            this.interactiveBuildings = buildVillageScenery(
                this,
                GROUND_Y,
                Boolean(entities.forgeUnlocked || entities.books['book-ch1']?.examPassed)
            );
            const baseY = WORLD_HEIGHT - GROUND_HEIGHT - 24;
            const elder = new NPC(this, 460, baseY + GROUND_SINK, 'npc-elder', '💬 [E] ລົມກັບຫົວໜ້າໝູ່ບ້ານ');
            elder.onInteract = () => EventBus.emit('start-dialogue', 'village_elder');

            // Mina runs the Skin shop at the little market between the Forge and the World Gate
            const mina = new NPC(this, 1290, baseY + GROUND_SINK, 'npc-mina', '🛍️ [E] ລົມກັບ Mina (ຮ້ານຊຸດ)');
            mina.onInteract = () => EventBus.emit('start-dialogue', 'skin_shop');

            this.villagers = [elder, mina];
        }
        else if (this.stage)
        {
            const built = buildStageScenery(this, this.stage, GROUND_Y, entities.repairedGates);
            this.resourceNodes = built.resourceNodes;
            this.waypoints = built.waypoints;
            this.brokenGate = built.brokenGate;
        }

        this.interaction = new InteractionController(this, {
            buildings: this.interactiveBuildings,
            waypoints: this.waypoints,
            resourceNodes: this.resourceNodes,
            brokenGate: this.brokenGate,
            villagers: this.villagers,
        });

        const eKey = this.input.keyboard?.addKey('E');
        eKey?.on('down', () => this.interaction.interact());

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
        this.heldItem = new HeldItemSprite(this, this.player, getGameContent().playerAnimations, getGameContent().heldArt);
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
            this.combat.onPlayerTouchesSpike(spikeObj as Spike);
        });

        this.physics.add.overlap(this.player, this.enemies, (playerObj, enemyObj) =>
        {
            this.combat.onPlayerTouchesEnemy(playerObj as Player, enemyObj as Enemy);
        });

        // Spawn Boss if the stage has one
        const bossSpawn = this.stage ? getStageBossSpawn(this.stage) : undefined;
        if (bossSpawn)
        {
            const bossDefinition = this.getEnemyDefinition(bossSpawn.enemyId);
            this.boss = new Boss(this, bossSpawn.x, bossSpawn.y, bossDefinition?.maxHp ?? 5);
            this.boss.awaitFinisher = true;
            this.combat.bindBoss(this.boss, () =>
            {
                EventBus.emit('open-quiz-finisher');
            });

            this.physics.add.collider(this.boss, this.ground);
            this.physics.add.collider(this.boss, this.platforms);
            this.physics.add.collider(this.boss, this.movingPlatforms);

            this.physics.add.overlap(this.player, this.boss, (playerObj, bossObj) =>
            {
                this.combat.onPlayerTouchesBoss(playerObj as Player, bossObj as Boss);
            });
        }

        // Enemy spit: breaks on terrain, hurts the hero on contact
        this.enemyProjectiles = this.physics.add.group();

        const destroyOnHit = (proj: unknown) =>
        {
            (proj as Phaser.Physics.Arcade.Sprite).destroy();
        };
        this.physics.add.collider(this.enemyProjectiles, this.ground, destroyOnHit);
        this.physics.add.collider(this.enemyProjectiles, this.platforms, destroyOnHit);
        this.physics.add.collider(this.enemyProjectiles, this.movingPlatforms, destroyOnHit);

        this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, proj) =>
        {
            this.combat.onSpitHitsPlayer(proj as Phaser.Physics.Arcade.Sprite);
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

        jKey?.on('down', () => this.combat.attack());
        zKey?.on('down', () => this.combat.attack());
        qKey?.on('down', () => this.combat.cycleWeapon());
        f2Key?.on('down', () => this.togglePhysicsDebug());

        const onVirtualInput = (inputs: { left?: boolean; right?: boolean; up?: boolean }) =>
        {
            if (typeof inputs.left === 'boolean') this.touchControls.left = inputs.left;
            if (typeof inputs.right === 'boolean') this.touchControls.right = inputs.right;
            if (typeof inputs.up === 'boolean') this.touchControls.up = inputs.up;
        };

        const onVirtualInteract = () => this.interaction.interact();
        const onVirtualAttack = () => this.combat.attack();
        const onVirtualCycleWeapon = () => this.combat.cycleWeapon();
        const onTogglePhysicsDebug = () => this.togglePhysicsDebug();

        const onQuizFinisherPassed = () =>
        {
            this.boss?.playDefeatTween();
            const reward = awardBossRewardUseCase(entities.backpack);
            EventBus.emit('backpack-changed');
            const rewardText = describeDrops(reward.collected, ' & ');
            showLootNotification(
                this,
                this.player.x,
                this.player.y - 40,
                reward.overflow.length > 0 ? `${rewardText} 🎒 ກະເປົາເຕັມ!` : rewardText,
                '#a855f7'
            );
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
                showLootNotification(this, this.boss.x, this.boss.y - 30, `⚠️ Boss ຟື້ນຟູ ${healAmount} HP!`, '#ef4444');
                soundManager.playPowerUp();
            }
        };

        const onGateRepaired = (gateId: string) =>
        {
            if (this.brokenGate && this.brokenGate.gateId === gateId)
            {
                this.heldItem.useTool(findTool(entities.backpack, this.brokenGate.requirements.requiredTool));
                this.player.swingToolToward(this.brokenGate.x);
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

        // Village hub gets warm pastoral-cyber theme; Stages start with adventure and crossfade to boss in Zone C
        soundManager.startBgm(isVillage ? 'village' : (bossSpawn && !this.stage ? 'boss' : 'adventure'));

        const onSkinChanged = (payload: SkinChangedPayload) =>
        {
            this.currentSkinId = payload.skinId;
            this.player.setSkin(payload.skinId);
            this.particleManager.emitCelebration(this.player.x, this.player.y);
        };
        DomainEvents.on<SkinChangedPayload>(SKIN_CHANGED_EVENT, onSkinChanged);

        const itemName = (itemId: string) => entities.itemCatalog.get(itemId)?.name ?? itemId;
        const onItemWorn = (payload: ItemWornPayload) =>
        {
            if (payload.state !== 'low' || payload.previousState !== 'ok') return;
            soundManager.playClink();
            showLootNotification(this, this.player.x, this.player.y - 70, `⚠️ ${itemName(payload.itemId)} ເກືອບພັງ (${payload.current}/${payload.max})`, '#f59e0b');
        };
        DomainEvents.on<ItemWornPayload>(ITEM_WORN_EVENT, onItemWorn);

        const onItemBroken = (payload: ItemBrokenPayload) =>
        {
            soundManager.playHurt();
            showLootNotification(this, this.player.x, this.player.y - 70, `💥 ${itemName(payload.itemId)} ພັງ! ອ່ອນລົງ ສ້ອມໄດ້ທີ່ Forge`, '#ef4444');
        };
        DomainEvents.on<ItemBrokenPayload>(ITEM_BROKEN_EVENT, onItemBroken);

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
            this.player.playFaint();
        };
        DomainEvents.on(PLAYER_DIED_EVENT, onGameOver);

        this.events.on('shutdown', () =>
        {
            DomainEvents.off<SkinChangedPayload>(SKIN_CHANGED_EVENT, onSkinChanged);
            DomainEvents.off<ItemWornPayload>(ITEM_WORN_EVENT, onItemWorn);
            DomainEvents.off<ItemBrokenPayload>(ITEM_BROKEN_EVENT, onItemBroken);
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
            this.villagers = [];
            this.skyBackdrop = undefined;
            this.bossBgmStarted = false;
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

        for (const npc of this.villagers)
        {
            if (npc.active) npc.updateProximity(this.player.x, this.player.y);
        }

        this.interaction.update();

        if (!this.hasMovedAway && Math.abs(this.player.x - this.level.spawn.x) > MOVED_AWAY_DISTANCE)
        {
            this.hasMovedAway = true;
            notifyTutorial('moved');
        }

        if (this.stageExitX !== undefined && this.player.x >= this.stageExitX)
        {
            this.handleStageExit();
            return;
        }

        const isLeft = Boolean(this.cursors.left.isDown || this.wasdKeys?.left?.isDown || this.touchControls.left);
        const isRight = Boolean(this.cursors.right.isDown || this.wasdKeys?.right?.isDown || this.touchControls.right);
        const isUp = Boolean(this.cursors.up.isDown || this.wasdKeys?.up?.isDown || this.wasdKeys?.space?.isDown || this.touchControls.up);

        this.heldItem.setContext(this.currentLevelKey === 'village', entities.equipment.equippedWeaponId);
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

        this.skyBackdrop?.update(this.cameras.main.scrollX);

        if (
            !this.bossBgmStarted &&
            this.stage &&
            this.boss &&
            !this.boss.entity.isDefeated &&
            this.player.x >= 2280
        )
        {
            this.bossBgmStarted = true;
            soundManager.startBgm('boss');
        }

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

    /**
     * The hero walked out of a Stage. A Stage with lessons asks its question first (React answers it and then
     * clears the Stage); one without clears at once. The scene freezes either way.
     */
    private handleStageExit ()
    {
        if (this.isStageCleared) return;
        if (!this.stage || this.stage.lessons.length === 0)
        {
            this.handleStageCleared();
            return;
        }

        this.isStageCleared = true;
        this.physics.pause();
        soundManager.stopBgm();
        soundManager.playLevelComplete();
        EventBus.emit('open-stage-question', { stageId: this.currentLevelKey });
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

    private getEnemyDefinition (enemyId: string): EnemyDefinition | undefined
    {
        const definition = getGameContent().enemies.find(e => e.id === enemyId);
        if (!definition || !this.stage) return definition;
        return scaleEnemyDefinition(definition, this.stage.number, getGameContent().scaling);
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
                this.combat.spawnEnemySpit(x, y, dirX, dirY);
            };
            enemy.onThrowRock = (x, y, dirX, speed) =>
            {
                this.combat.spawnEnemyRock(x, y, dirX, speed);
            };
            enemies.add(enemy);
        }

        return enemies;
    }
}
