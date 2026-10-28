import { Geom } from 'phaser';
import { collectEnemyDropsUseCase } from '../../../application/CollectEnemyDropsUseCase';
import { cycleEquippedWeaponUseCase } from '../../../application/CycleEquippedWeaponUseCase';
import { performAttackUseCase } from '../../../application/PerformAttackUseCase';
import { playerTakeDamageUseCase } from '../../../application/PlayerTakeDamageUseCase';
import { entities } from '../../composition';
import { soundManager } from '../../audio/SoundManager';
import { EventBus } from '../../EventBus';
import { describeDrops, showDamageNumber, showLootNotification } from '../effects/FloatingText';
import { Boss } from '../objects/Boss';
import { Enemy, SPIT_PROJECTILE_KEY } from '../objects/Enemy';
import type { Player } from '../objects/Player';
import type { Spike } from '../objects/Spike';
import type { Game } from '../scenes/Game';

/** Most enemies the Boss can have alive at once when it summons minions. */
const MAX_ENEMIES_FOR_SUMMON = 3;

/**
 * Everything that hurts or is hurt in the scene: the hero's attacks and stomps, contact
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

        const attack = performAttackUseCase(entities.equipment, entities.attackCooldown);
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

    /** Overlap callback: hero touches an enemy (stomp it, or get hurt). */
    onPlayerTouchesEnemy (player: Player, enemy: Enemy): void
    {
        const { scene } = this;
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
                scene.particleManager.emitSpikeHit(enemy.x, enemy.y - 12);
                player.setVelocityY(-240);
                scene.cameras.main.shake(130, 0.006);
                if (!player.isInvincible)
                {
                    player.triggerDamage(enemy.x);
                    scene.cameras.main.flash(100, 239, 68, 68, true);
                    playerTakeDamageUseCase(scene.health);
                }
                return;
            }

            // Stomp victory: bounce, emit particle burst, freeze frame, camera shake, and defeat enemy
            const stompDamage = entities.equipment.equippedStats.damage;
            player.setVelocityY(-340);
            scene.particleManager.emitStompBurst(enemy.x, enemy.y);
            this.triggerHitStop(45);
            scene.cameras.main.shake(100, 0.0035);
            showDamageNumber(scene, enemy.x, enemy.y, stompDamage, false);
            if (enemy.takeDamage(stompDamage, 0).defeated)
            {
                this.onEnemyDefeated(enemy);
            }
            return;
        }

        // Player hit by enemy
        if (!player.isInvincible)
        {
            player.triggerDamage(enemy.x);
            scene.cameras.main.shake(160, 0.008);
            scene.cameras.main.flash(110, 239, 68, 68, true);
            playerTakeDamageUseCase(scene.health);
        }
    }

    /** Overlap callback: hero touches a spike. */
    onPlayerTouchesSpike (spike: Spike): void
    {
        const { scene } = this;
        if (scene.player.isInvincible) return;

        scene.player.triggerDamage(spike.x);
        scene.particleManager.emitSpikeHit(spike.x, spike.y);
        scene.cameras.main.shake(180, 0.009);
        scene.cameras.main.flash(110, 239, 68, 68, true);
        playerTakeDamageUseCase(scene.health);
    }

    /** Overlap callback: hero touches the Boss (stomp it, or get hurt). */
    onPlayerTouchesBoss (player: Player, boss: Boss): void
    {
        const { scene } = this;
        if (boss.entity.isDefeated) return;

        const playerBody = player.body as Phaser.Physics.Arcade.Body;
        const isFalling = playerBody.velocity.y > 0;
        const isAbove = player.y < boss.y - 8;

        if (isFalling && isAbove && !boss.isInvulnerable)
        {
            // High bounce when stomping boss with impact hit-stop, punchy camera shake, and impact flash
            player.setVelocityY(-420);
            scene.particleManager.emitStompBurst(boss.x, boss.y);
            this.triggerHitStop(75);
            scene.cameras.main.shake(200, 0.012);
            scene.cameras.main.flash(70, 255, 255, 255, true);
            soundManager.playStomp();
            boss.takeDamage(entities.equipment.equippedStats.damage);
            return;
        }

        if (!player.isInvincible)
        {
            player.triggerDamage(boss.x);
            scene.cameras.main.shake(220, 0.012);
            scene.cameras.main.flash(140, 239, 68, 68, true);
            playerTakeDamageUseCase(scene.health);
        }
    }

    /** Overlap callback: an enemy spit hits the hero. */
    onSpitHitsPlayer (spit: Phaser.Physics.Arcade.Sprite): void
    {
        const { scene } = this;
        spit.destroy();
        if (scene.player.isInvincible) return;

        scene.player.triggerDamage(scene.player.x);
        scene.particleManager.emitSpikeHit(scene.player.x, scene.player.y);
        scene.cameras.main.shake(150, 0.007);
        scene.cameras.main.flash(100, 34, 197, 94, true);
        playerTakeDamageUseCase(scene.health);
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
                const res = enemy.takeDamage(damage, dir);
                showDamageNumber(scene, enemy.x, enemy.y, damage);
                scene.particleManager.emitStompBurst(enemy.x, enemy.y);

                if (res.defeated)
                {
                    this.onEnemyDefeated(enemy);
                }
            }
        }

        const boss = scene.boss;
        if (boss && boss.active && !boss.entity.isDefeated && !boss.isInvulnerable)
        {
            if (Geom.Intersects.RectangleToRectangle(bounds, boss.getBounds()))
            {
                hitAny = true;
                boss.takeDamage(damage);
                showDamageNumber(scene, boss.x, boss.y, damage);
                scene.particleManager.emitStompBurst(boss.x, boss.y);
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

        // Materials from the enemy's drop table go straight into the backpack
        const drops = collectEnemyDropsUseCase(enemy.entity, entities.backpack);
        if (drops.collected.length === 0 && drops.overflow.length === 0) return;

        const parts = [describeDrops(drops.collected)].filter(Boolean);
        if (drops.overflow.length > 0) parts.push('🎒 ກະເປົາເຕັມ!');
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
