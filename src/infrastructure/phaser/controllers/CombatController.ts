import { Geom } from 'phaser';
import { collectEnemyDropsUseCase } from '../../../application/CollectEnemyDropsUseCase';
import { cycleEquippedWeaponUseCase } from '../../../application/CycleEquippedWeaponUseCase';
import { performAttackUseCase } from '../../../application/PerformAttackUseCase';
import { playerTakeDamageUseCase } from '../../../application/PlayerTakeDamageUseCase';
import { armorContext, entities } from '../../composition';
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

/**
 * Everything that hurts or is hurt in the scene: the hero's sword attacks, contact
 * damage from enemies, spikes, spit and the Boss, enemy drops, and hit-stop. The damage
 * numbers and rules themselves come from use cases; this class turns them into physics
 * checks, camera shake, particles and sound.
 */
export class CombatController
{
    private hitStopCounter = 0;

    constructor (private readonly scene: Game)
    {}

    /** J / Z / the touch attack button. */
    attack (): void
    {
        const { scene } = this;
        if (scene.isDialogueActive || scene.health.isDead || scene.isStageCleared) return;

        const attack = performAttackUseCase(entities.equipment, entities.attackCooldown, entities.backpack, entities.effects);
        if (!attack) return;

        const { weaponId, damage, range } = attack;
        scene.player.triggerSlashVfx(weaponId);
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
        if (enemy.entity.isDefeated || !player.canBeHurt) return;

        player.triggerDamage(enemy.x);
        scene.cameras.main.shake(160, 0.008);
        scene.cameras.main.flash(110, 239, 68, 68, true);
        playerTakeDamageUseCase(scene.health, armorContext);
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
        playerTakeDamageUseCase(scene.health, armorContext);
    }

    /** Overlap callback: touching the Boss costs a heart. */
    onPlayerTouchesBoss (player: Player, boss: Boss): void
    {
        const { scene } = this;
        if (boss.entity.isDefeated || !player.canBeHurt) return;

        player.triggerDamage(boss.x);
        scene.cameras.main.shake(220, 0.012);
        scene.cameras.main.flash(140, 239, 68, 68, true);
        playerTakeDamageUseCase(scene.health, armorContext);
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
        playerTakeDamageUseCase(scene.health, armorContext);
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

    /** Hooks the Boss's own events (landing shake, minions, phase changes) up to scene effects. */
    bindBoss (boss: Boss, onDefeated: () => void): void
    {
        const { scene } = this;

        boss.onLanding = (x, y) =>
        {
            scene.particleManager.emitLandingDust(x, y);
            scene.cameras.main.shake(140, 0.007);
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
            }
            else if (newPhase === 3)
            {
                scene.particleManager.emitCelebration(boss.x, boss.y);
            }
        };
    }

    /** Freezes physics for a few milliseconds so a hit feels heavy. */
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
        if (res.defeated) this.onEnemyDefeated(enemy);
    }

    /** `damage` lands on the Boss (nothing while it is invulnerable). */
    strikeBoss (boss: Boss, damage: number): void
    {
        const { scene } = this;
        if (!boss.active || boss.entity.isDefeated || boss.isInvulnerable) return;
        boss.takeDamage(damage);
        showDamageNumber(scene, boss.x, boss.y, damage);
        scene.particleManager.emitStompBurst(boss.x, boss.y);
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
