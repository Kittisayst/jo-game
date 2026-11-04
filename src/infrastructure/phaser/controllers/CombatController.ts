import { Geom } from 'phaser';
import { collectEnemyDropsUseCase } from '../../../application/CollectEnemyDropsUseCase';
import { cycleEquippedWeaponUseCase } from '../../../application/CycleEquippedWeaponUseCase';
import { performAttackUseCase } from '../../../application/PerformAttackUseCase';
import { grantXpUseCase } from '../../../application/GrantXpUseCase';
import { recordQuestProgressUseCase } from '../../../application/QuestUseCases';
import { autoSaveGame } from '../../saveSnapshot';
import { getGameContent } from '../../content/ContentCatalog';
import { playerTakeDamageUseCase } from '../../../application/PlayerTakeDamageUseCase';
import { armorContext, entities, random } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { describeDrops, showDamageNumber, showLootNotification } from '../effects/FloatingText';
import { Boss } from '../objects/Boss';
import { Enemy, ROCK_PROJECTILE_KEY, SPIT_PROJECTILE_KEY } from '../objects/Enemy';
import type { Player } from '../objects/Player';
import type { Spike } from '../objects/Spike';
import type { Game } from '../scenes/Game';
import { notifyShardsCollected, notifyTutorial } from '../../tutorial';
import { stashStoryOverflowUseCase } from '../../../application/PendingRewardsUseCases';

/** Most enemies the Boss can have alive at once when it summons minions. */
const MAX_ENEMIES_FOR_SUMMON = 3;

export const PROJECTILE_PACKET_LASER = 'boss-packet-laser';
export const PROJECTILE_EMP_PULSE = 'boss-emp-pulse';
export const PROJECTILE_SEISMIC_WAVE = 'boss-seismic-wave';
export const PROJECTILE_DEBRIS = 'boss-falling-debris';
export const PROJECTILE_BOOK_KEY = 'projectile-textbook';

/**
 * Everything that hurts or is hurt in the scene: the hero's sword attacks, contact
 * damage from enemies, spikes, spit and the Boss, enemy drops, and hit-stop. The damage
 * numbers and rules themselves come from use cases; this class turns them into physics
 * checks, camera shake, particles and sound.
 */
export class CombatController
{
    private hitStopCounter = 0;
    private lastBookThrowTime = 0;

    constructor (private readonly scene: Game)
    {}

    static ensureBookTexture (scene: Phaser.Scene): void
    {
        if (scene.textures.exists(PROJECTILE_BOOK_KEY)) return;
        const g = scene.make.graphics({ x: 0, y: 0 });
        g.fillStyle(0x1e3a8a, 1);
        g.fillRoundedRect(2, 2, 18, 18, 3);
        g.fillStyle(0xfbbf24, 1);
        g.fillRect(2, 2, 4, 18);
        g.fillRect(17, 3, 2, 2);
        g.fillRect(17, 17, 2, 2);
        g.fillStyle(0xfef08a, 1);
        g.fillRect(6, 4, 12, 14);
        g.fillStyle(0xef4444, 1);
        g.fillRect(10, 14, 3, 6);
        g.generateTexture(PROJECTILE_BOOK_KEY, 22, 22);
        g.destroy();
    }

    /** ປາປື້ມຕຳລາ: Throws a spinning magical textbook at enemies. */
    throwBook (): void
    {
        const { scene } = this;
        if (scene.isDialogueActive || scene.health.isDead || scene.isStageCleared) return;
        const now = scene.time.now;
        if (now - this.lastBookThrowTime < 420) return;
        this.lastBookThrowTime = now;

        CombatController.ensureBookTexture(scene);

        const dir = scene.player.facingDir || 1;
        const spawnX = scene.player.x + dir * 18;
        const spawnY = scene.player.y - 8;

        const book = scene.physics.add.sprite(spawnX, spawnY, PROJECTILE_BOOK_KEY);
        scene.playerProjectiles.add(book);

        const body = book.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.allowGravity = true;
            body.gravity.y = 520;
            book.setVelocity(dir * 380, -110);
            book.setAngularVelocity(dir * 720);
        }

        soundManager.playSlash();

        scene.tweens.add({
            targets: scene.player,
            scaleX: 1.08,
            duration: 60,
            yoyo: true,
        });

        scene.time.delayedCall(2500, () =>
        {
            if (book.active) book.destroy();
        });
    }

    bindPlayerProjectiles (): void
    {
        const { scene } = this;

        const destroyBook = (proj: unknown) =>
        {
            const book = proj as Phaser.Physics.Arcade.Sprite;
            if (!book.active) return;
            scene.particleManager.emitStompBurst(book.x, book.y);
            book.destroy();
        };

        scene.physics.add.collider(scene.playerProjectiles, scene.ground, destroyBook);
        scene.physics.add.collider(scene.playerProjectiles, scene.platforms, destroyBook);
        scene.physics.add.collider(scene.playerProjectiles, scene.movingPlatforms, destroyBook);

        scene.physics.add.overlap(scene.playerProjectiles, scene.enemies, (bookObj, enemyObj) =>
        {
            const book = bookObj as Phaser.Physics.Arcade.Sprite;
            const enemy = enemyObj as Enemy;
            if (!book.active || !enemy.active || enemy.entity.isDefeated) return;

            const dir = (book.body && 'velocity' in book.body) ? (Math.sign(book.body.velocity.x) || 1) : 1;
            book.destroy();
            scene.particleManager.emitStompBurst(enemy.x, enemy.y);
            const damage = Math.round(20 * entities.heroStats.attackMultiplier(getGameContent().statsTuning));
            this.strikeEnemy(enemy, damage, dir);
        });

        if (scene.boss)
        {
            scene.physics.add.overlap(scene.playerProjectiles, scene.boss, (bookObj, bossObj) =>
            {
                const book = bookObj as Phaser.Physics.Arcade.Sprite;
                const boss = bossObj as Boss;
                if (!book.active || !boss.active || boss.entity.isDefeated || boss.isInvulnerable) return;

                book.destroy();
                scene.particleManager.emitStompBurst(boss.x, boss.y);
                const damage = Math.round(20 * entities.heroStats.attackMultiplier(getGameContent().statsTuning));
                this.strikeBoss(boss, damage);
            });
        }
    }

    /** J / Z / the touch attack button. */
    attack (): void
    {
        const { scene } = this;
        if (scene.isDialogueActive || scene.health.isDead || scene.isStageCleared) return;

        const attack = performAttackUseCase(
            entities.equipment, entities.attackCooldown, entities.backpack, entities.effects,
            entities.heroStats.attackMultiplier(getGameContent().statsTuning)
        );
        if (!attack) return;

        const { weaponId, damage, range } = attack;
        const upgradeLevel = entities.equipment.getUpgradeLevel(weaponId);
        scene.player.triggerSlashVfx(weaponId, upgradeLevel);
        soundManager.playSlash();
        this.resolveMeleeAttack(damage, range);
    }

    /** Q / the touch swap button: next sword the hero carries. */
    cycleWeapon (): void
    {
        const nextWeapon = cycleEquippedWeaponUseCase(entities.equipment, entities.backpack);
        soundManager.playSelect();
        EventBus.emit('weapon-changed', nextWeapon);
    }

    /** Overlap callback: touching an enemy always costs a heart; the answer is the sword, from a distance. */
    onPlayerTouchesEnemy (player: Player, enemy: Enemy): void
    {
        const { scene } = this;
        if (enemy.entity.isDefeated || enemy.isStunned || !player.canBeHurt) return;

        player.triggerDamage(enemy.x);
        scene.cameras.main.shake(160, 0.008);
        scene.cameras.main.flash(110, 239, 68, 68, true);
        this.hurtPlayer();
    }

    /**
     * A hit on the hero. The Guard Stat may stop it ("🛡️ ກັນໄດ້!" and nothing is lost); every hit site goes
     * through here.
     */
    private hurtPlayer (): void
    {
        const outcome = playerTakeDamageUseCase(this.scene.health, armorContext, {
            blockChance: entities.heroStats.blockChance(getGameContent().statsTuning),
            random,
        });
        if (outcome === 'blocked')
        {
            showLootNotification(this.scene, this.scene.player.x, this.scene.player.y - 30, '🛡️ ກັນໄດ້!', '#7dd3fc');
            soundManager.playSelect();
        }
    }

    /** Overlap callback: hero touches a spike. */
    onPlayerTouchesSpike (spike: Spike): void
    {
        const { scene } = this;
        if (!scene.player.canBeHurt) return;

        scene.player.triggerDamage(spike.x);
        scene.particleManager.emitSpikeHit(spike.x, spike.y);
        scene.cameras.main.shake(180, 0.009);
        scene.cameras.main.flash(110, 239, 68, 68, true);
        this.hurtPlayer();
    }

    /** Overlap callback: touching the Boss costs a heart. */
    onPlayerTouchesBoss (player: Player, boss: Boss): void
    {
        const { scene } = this;
        if (boss.entity.isDefeated || !player.canBeHurt) return;

        player.triggerDamage(boss.x);
        scene.cameras.main.shake(220, 0.012);
        scene.cameras.main.flash(140, 239, 68, 68, true);
        this.hurtPlayer();
    }

    /** Overlap callback: an enemy spit hits the hero. */
    onSpitHitsPlayer (spit: Phaser.Physics.Arcade.Sprite): void
    {
        const { scene } = this;
        spit.destroy();
        if (!scene.player.canBeHurt) return;

        scene.player.triggerDamage(scene.player.x);
        scene.particleManager.emitSpikeHit(scene.player.x, scene.player.y);
        scene.cameras.main.shake(150, 0.007);
        scene.cameras.main.flash(100, 34, 197, 94, true);
        this.hurtPlayer();
    }

    /** A spitter enemy fires a glob in `(dirX, dirY)`. */
    spawnEnemySpit (x: number, y: number, dirX: number, dirY = 0): void
    {
        const { scene } = this;
        const spit = scene.physics.add.sprite(x, y, SPIT_PROJECTILE_KEY);
        scene.enemyProjectiles.add(spit);

        const body = spit.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.allowGravity = false;
            spit.setVelocity(dirX * 220, dirY * 220);
        }

        scene.time.delayedCall(3500, () =>
        {
            if (spit.active) spit.destroy();
        });
    }

    /** The Cave Guardian throws a rock along the ground in `dirX`; the hero jumps over it. */
    spawnEnemyRock (x: number, y: number, dirX: number, speed: number): void
    {
        const { scene } = this;
        const rock = scene.physics.add.sprite(x, y, ROCK_PROJECTILE_KEY);
        scene.enemyProjectiles.add(rock);

        const body = rock.body as Phaser.Physics.Arcade.Body;
        if (body)
        {
            body.allowGravity = false;
            body.setCircle(8, 2, 2);
            rock.setVelocity(dirX * speed, 0);
        }
        scene.tweens.add({ targets: rock, angle: dirX * 360, duration: 700, repeat: -1 });

        scene.time.delayedCall(3500, () =>
        {
            if (rock.active) rock.destroy();
        });
    }

    private static ensureBossProjectileTextures (scene: Phaser.Scene): void
    {
        if (!scene.textures.exists(PROJECTILE_PACKET_LASER))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x06b6d4, 0.4);
            g.fillRoundedRect(0, 0, 20, 10, 4);
            g.fillStyle(0x38bdf8, 0.9);
            g.fillRoundedRect(2, 1, 16, 8, 3);
            g.fillStyle(0xffffff, 1);
            g.fillRoundedRect(5, 3, 10, 4, 2);
            g.generateTexture(PROJECTILE_PACKET_LASER, 20, 10);
            g.destroy();
        }

        if (!scene.textures.exists(PROJECTILE_EMP_PULSE))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x0284c7, 0.4);
            g.fillRoundedRect(0, 0, 16, 28, 6);
            g.fillStyle(0x38bdf8, 0.85);
            g.fillRoundedRect(2, 2, 12, 24, 4);
            g.fillStyle(0xffffff, 1);
            g.fillRect(6, 4, 4, 20);
            g.generateTexture(PROJECTILE_EMP_PULSE, 16, 28);
            g.destroy();
        }

        if (!scene.textures.exists(PROJECTILE_SEISMIC_WAVE))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x78350f, 1);
            g.fillTriangle(0, 24, 13, 0, 26, 24);
            g.fillStyle(0xb45309, 1);
            g.fillTriangle(4, 24, 13, 4, 22, 24);
            g.fillStyle(0xfde047, 1);
            g.fillTriangle(9, 24, 13, 8, 17, 24);
            g.generateTexture(PROJECTILE_SEISMIC_WAVE, 26, 24);
            g.destroy();
        }

        if (!scene.textures.exists(PROJECTILE_DEBRIS))
        {
            const g = scene.make.graphics({ x: 0, y: 0 });
            g.fillStyle(0x92400e, 1);
            g.fillRoundedRect(0, 0, 22, 22, 3);
            g.fillStyle(0x78350f, 1);
            g.fillRoundedRect(3, 3, 16, 16, 2);
            g.fillStyle(0xf59e0b, 1);
            g.fillRect(5, 5, 5, 5);
            g.fillRect(12, 12, 6, 6);
            g.generateTexture(PROJECTILE_DEBRIS, 22, 22);
            g.destroy();
        }
    }

    /** Hooks the Boss's own events (landing shake, minions, phase changes, unique attacks) up to scene effects. */
    bindBoss (boss: Boss, onDefeated: () => void): void
    {
        const { scene } = this;
        CombatController.ensureBossProjectileTextures(scene);

        boss.onLanding = (x, y) =>
        {
            scene.particleManager.emitLandingDust(x, y);
            scene.cameras.main.shake(160, 0.008);
        };
        boss.onDefeated = onDefeated;
        boss.onSummonMinion = (x, y) =>
        {
            if (scene.enemies.countActive(true) < MAX_ENEMIES_FOR_SUMMON)
            {
                const minion = new Enemy(scene, x, y, 140, 85);
                minion.setScale(0.75);
                scene.enemies.add(minion);
                scene.particleManager.emitCelebration(x, y);
                soundManager.playPowerUp();
            }
        };
        boss.onPhaseChanged = (newPhase) =>
        {
            soundManager.playStomp();
            if (newPhase === 2)
            {
                scene.particleManager.emitSpikeHit(boss.x, boss.y);
                scene.cameras.main.shake(250, 0.012);
            }
            else if (newPhase === 3)
            {
                scene.particleManager.emitCelebration(boss.x, boss.y);
                scene.cameras.main.shake(360, 0.016);
            }
        };

        boss.onPacketBurst = (x, y, dir) =>
        {
            for (const vy of [-25, 0, 25])
            {
                const laser = scene.physics.add.sprite(x, y, PROJECTILE_PACKET_LASER);
                scene.enemyProjectiles.add(laser);
                const body = laser.body as Phaser.Physics.Arcade.Body;
                if (body)
                {
                    body.setAllowGravity(false);
                    body.setVelocity(dir * 320, vy);
                }
            }
            soundManager.playSpit();
            scene.cameras.main.shake(80, 0.003);
        };

        boss.onEmpShockwave = (x, y) =>
        {
            for (const dirX of [-1, 1])
            {
                const pulse = scene.physics.add.sprite(x + dirX * 24, y, PROJECTILE_EMP_PULSE);
                scene.enemyProjectiles.add(pulse);
                const body = pulse.body as Phaser.Physics.Arcade.Body;
                if (body)
                {
                    body.setAllowGravity(false);
                    body.setVelocity(dirX * 210, 0);
                }
            }
            soundManager.playDroneBuzz();
            scene.cameras.main.shake(150, 0.007);
        };

        boss.onGroundStomp = (x, y, dir) =>
        {
            const wave = scene.physics.add.sprite(x + dir * 32, y - 18, PROJECTILE_SEISMIC_WAVE);
            scene.enemyProjectiles.add(wave);
            const body = wave.body as Phaser.Physics.Arcade.Body;
            if (body)
            {
                body.setAllowGravity(false);
                body.setVelocity(dir * 240, 0);
            }
            scene.particleManager.emitLandingDust(x, y);
            soundManager.playStomp();
            scene.cameras.main.shake(220, 0.011);
            scene.time.delayedCall(2000, () =>
            {
                if (wave.active) wave.destroy();
            });
        };

        boss.onDebrisDrop = (targetX) =>
        {
            const floorY = 624;
            const warning = scene.add.circle(targetX, floorY, 18, 0xef4444, 0.45).setDepth(4);
            scene.tweens.add({
                targets: warning,
                alpha: 0.85,
                scale: 1.35,
                duration: 350,
                yoyo: true,
                onComplete: () =>
                {
                    warning.destroy();
                    if (!boss.active || boss.entity.isDefeated) return;
                    const debris = scene.physics.add.sprite(targetX, 200, PROJECTILE_DEBRIS);
                    scene.enemyProjectiles.add(debris);
                    const body = debris.body as Phaser.Physics.Arcade.Body;
                    if (body)
                    {
                        body.setAllowGravity(false);
                        body.setVelocity(0, 390);
                    }
                },
            });
        };
    }

    triggerHitStop (durationMs = 50): void
    {
        const { scene } = this;
        this.hitStopCounter++;
        const currentId = this.hitStopCounter;
        scene.physics.world.isPaused = true;
        scene.time.delayedCall(durationMs, () =>
        {
            if (currentId === this.hitStopCounter && !scene.isDialogueActive && !scene.scene.isPaused())
            {
                scene.physics.world.isPaused = false;
            }
        });
    }

    /** `damage` lands on an enemy (the sword or a skill): number, burst, and drops when it falls. */
    strikeEnemy (enemy: Enemy, damage: number, dir: number): void
    {
        const { scene } = this;
        const res = enemy.takeDamage(damage, dir);
        showDamageNumber(scene, enemy.x, enemy.y, damage);
        scene.particleManager.emitStompBurst(enemy.x, enemy.y);
        if (res.defeated)
        {
            this.awardXp(enemy.entity.xp, enemy.x, enemy.y);
            this.onEnemyDefeated(enemy);
        }
    }

    /** `damage` lands on the Boss (nothing while it is invulnerable). */
    strikeBoss (boss: Boss, damage: number): void
    {
        const { scene } = this;
        if (!boss.active || boss.entity.isDefeated || boss.isInvulnerable) return;
        const fell = boss.takeDamage(damage);
        showDamageNumber(scene, boss.x, boss.y, damage);
        scene.particleManager.emitStompBurst(boss.x, boss.y);
        scene.cameras.main.shake(140, 0.006);
        this.triggerHitStop(55);
        if (fell) { this.awardXp(boss.xp, boss.x, boss.y); recordQuestProgressUseCase(entities.questBoard, 'defeat', boss.bossId, 1); }
    }

    /** XP for a monster that fell, whichever way it fell (sword or skill): a number, and a banner on a new level. */
    private awardXp (enemyXp: number, x: number, y: number): void
    {
        const result = grantXpUseCase(
            entities.heroLevel,
            getGameContent().progression,
            enemyXp,
            this.scene.stage?.number ?? 1
        );
        if (result.xp <= 0) return;

        showLootNotification(this.scene, x, y - 10, `+${result.xp} XP`, '#a5b4fc');
        if (result.levelsGained > 0)
        {
            showLootNotification(this.scene, this.scene.player.x, this.scene.player.y - 40, `⬆️ Level ${entities.heroLevel.level}!`, '#fde047');
            soundManager.playPowerUp();
        }
        autoSaveGame();
    }

    private resolveMeleeAttack (damage: number, range: number): void
    {
        const { scene } = this;
        const dir = scene.player.facingDir;
        const hitBoxX = scene.player.x + (dir * (range / 2 + 10));
        const hitBoxY = scene.player.y;
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
        for (const child of scene.enemyProjectiles.getChildren())
        {
            const spit = child as Phaser.Physics.Arcade.Sprite;
            if (!spit.active) continue;
            if (Geom.Intersects.RectangleToRectangle(bounds, spit.getBounds()))
            {
                spit.destroy();
                scene.particleManager.emitStompBurst(spit.x, spit.y);
            }
        }

        for (const child of scene.enemies.getChildren())
        {
            const enemy = child as Enemy;
            if (!enemy.active || enemy.entity.isDefeated) continue;

            if (Geom.Intersects.RectangleToRectangle(bounds, enemy.getBounds()))
            {
                hitAny = true;
                this.strikeEnemy(enemy, damage, dir);
            }
        }

        const boss = scene.boss;
        if (boss && boss.active && !boss.entity.isDefeated && !boss.isInvulnerable)
        {
            if (Geom.Intersects.RectangleToRectangle(bounds, boss.getBounds()))
            {
                hitAny = true;
                this.strikeBoss(boss, damage);
            }
        }

        if (hitAny)
        {
            this.triggerHitStop(45);
            scene.cameras.main.shake(120, 0.004);
        }
    }

    private onEnemyDefeated (enemy: Enemy): void
    {
        soundManager.playStomp();
        notifyTutorial('enemy-defeated');
        recordQuestProgressUseCase(entities.questBoard, 'defeat', enemy.entity.type, 1);

        // Materials from the enemy's drop table go straight into the backpack
        const drops = collectEnemyDropsUseCase(enemy.entity, entities.backpack);
        // Story Materials that did not fit wait for room instead of being lost
        const stash = stashStoryOverflowUseCase(drops.overflow, entities.pendingRewards, entities.itemCatalog);
        notifyShardsCollected([...drops.collected, ...stash.stashed]);
        if (drops.collected.length === 0 && drops.overflow.length === 0) return;

        const parts = [describeDrops(drops.collected)].filter(Boolean);
        if (drops.overflow.length > 0) parts.push(stash.stashed.length > 0 ? '🎒 ກະເປົາເຕັມ! ເກັບໄວ້ໃຫ້ກ່ອນ' : '🎒 ກະເປົາເຕັມ!');
        showLootNotification(
            this.scene,
            enemy.x,
            enemy.y - 30,
            parts.join(', '),
            drops.overflow.length > 0 ? '#f59e0b' : '#22c55e'
        );
        soundManager.playCoin();
        EventBus.emit('backpack-changed');
    }
}
