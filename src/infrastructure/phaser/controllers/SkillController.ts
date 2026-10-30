import { Math as PhaserMath } from 'phaser';
import { castSkillUseCase } from '../../../application/SkillUseCases';
import { soundManager } from '../../audio/SoundManager';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import { effectAtRank } from '../../content/SkillCatalog';
import type { ChainEffect, SkillDefinition, WaveEffect } from '../../content/SkillCatalog';
import { showLootNotification } from '../effects/FloatingText';
import type { Boss } from '../objects/Boss';
import type { Enemy } from '../objects/Enemy';
import type { Game } from '../scenes/Game';
import type { CombatController } from './CombatController';

const WAVE_TEXTURE = 'skill-wave';

/**
 * The K and L skill slots: asks `castSkillUseCase` (slot, cooldown) and, when it says yes, makes the skill
 * happen in the scene. Every effect `type` in `skills.json` has its method here.
 */
export class SkillController
{
    constructor (private readonly scene: Game, private readonly combat: CombatController)
    {}

    /** K = slot 0, L = slot 1 (or the touch buttons). */
    use (slot: number): void
    {
        const { scene } = this;
        const player = scene.player;
        if (!player?.body || player.isStunned || scene.isDialogueActive || scene.health.isDead || scene.isStageCleared) return;
        if (scene.scene.isPaused()) return;

        const skills = getGameContent().skills.active;

        // A skill that needs a target does not start its cooldown when there is nothing to hit
        const wanted = skills.find(s => s.id === entities.skills.skillInSlot(slot));
        const wantedEffect = wanted ? effectAtRank(wanted, entities.skills.rankOf(wanted.id)) : undefined;
        if (wanted && wantedEffect?.type === 'chain' && entities.skillCooldowns.remainingMs(wanted.id) <= 0 && this.chainTargets(wantedEffect).length === 0)
        {
            showLootNotification(scene, player.x, player.y - 30, 'ບໍ່ມີເປົ້າໝາຍ', '#fbbf24');
            return;
        }

        const result = castSkillUseCase(entities.skills, entities.skillCooldowns, skills, slot);
        if (!result.success) return;

        const skill = skills.find(s => s.id === result.skillId) as SkillDefinition;
        const effect = effectAtRank(skill, result.rank);
        if (effect.type === 'wave') this.castWave(effect);
        else if (effect.type === 'chain') this.castChain(effect);
    }

    /** The enemies (and the Boss) a chain reaches, in order: the nearest in front of the hero, then the nearest to each one. */
    private chainTargets (effect: ChainEffect): { x: number; y: number; enemy?: Enemy; boss?: Boss }[]
    {
        const { scene } = this;
        const dir = scene.player.facingDir < 0 ? -1 : 1;
        const candidates: { x: number; y: number; enemy?: Enemy; boss?: Boss }[] = [];
        for (const child of scene.enemies.getChildren())
        {
            const enemy = child as Enemy;
            if (enemy.active && !enemy.entity.isDefeated) candidates.push({ x: enemy.x, y: enemy.y, enemy });
        }
        const boss = scene.boss;
        if (boss && boss.active && !boss.entity.isDefeated) candidates.push({ x: boss.x, y: boss.y, boss });

        const chain: typeof candidates = [];
        let from = { x: scene.player.x, y: scene.player.y };
        let reach = effect.rangePx;
        while (chain.length < effect.jumps)
        {
            // The first target is in front of the hero (a little behind is forgiven); the next ones can be any side
            const next = candidates
                .filter(c => !chain.includes(c) && Math.hypot(c.x - from.x, c.y - from.y) <= reach && (chain.length > 0 || (c.x - from.x) * dir >= -40))
                .sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
            if (!next) break;
            chain.push(next);
            from = next;
            reach = effect.jumpRangePx;
        }
        return chain;
    }

    /** Lightning leaps along `chainTargets`: each enemy is hurt and stunned, a Boss only hurt (for part of the damage). */
    private castChain (effect: ChainEffect): void
    {
        const { scene } = this;
        const dir = scene.player.facingDir < 0 ? -1 : 1;
        const damage = Math.max(1, Math.round(entities.equipment.equippedStats.damage * effect.damageMultiplier * entities.effects.damageMultiplier));
        const targets = this.chainTargets(effect);

        const bolt = scene.add.graphics().setDepth(14);
        let from = { x: scene.player.x, y: scene.player.y - 4 };
        for (const target of targets)
        {
            this.drawBolt(bolt, from.x, from.y, target.x, target.y - 4);
            from = { x: target.x, y: target.y - 4 };

            if (target.enemy)
            {
                const enemy = target.enemy;
                this.combat.strikeEnemy(enemy, damage, Math.sign(enemy.x - scene.player.x) || dir);
                if (enemy.active && !enemy.entity.isDefeated) enemy.stun(effect.stunMs);
            }
            else if (target.boss)
            {
                this.combat.strikeBoss(target.boss, Math.max(1, Math.round(damage * effect.bossShare)));
            }
        }

        soundManager.playPowerUp();
        scene.cameras.main.flash(80, 125, 211, 252, true);
        scene.tweens.add({ targets: bolt, alpha: 0, duration: 320, onComplete: () => bolt.destroy() });
    }

    /** A jagged line of light between two points. */
    private drawBolt (g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number): void
    {
        const steps = 6;
        const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
        for (let i = 1; i < steps; i++)
        {
            const t = i / steps;
            points.push({ x: x1 + (x2 - x1) * t + PhaserMath.Between(-9, 9), y: y1 + (y2 - y1) * t + PhaserMath.Between(-9, 9) });
        }
        points.push({ x: x2, y: y2 });
        for (const [width, color, alpha] of [[7, 0x38bdf8, 0.45], [3, 0xe0f2fe, 1]] as const)
        {
            g.lineStyle(width, color, alpha);
            g.beginPath();
            g.moveTo(points[0].x, points[0].y);
            for (const p of points.slice(1)) g.lineTo(p.x, p.y);
            g.strokePath();
        }
    }

    /** A wave of energy flies in front of the hero, through `pierce` enemies, and hits a Boss for part of its damage. */
    private castWave (effect: WaveEffect): void
    {
        const { scene } = this;
        const dir = scene.player.facingDir < 0 ? -1 : 1;
        this.ensureWaveTexture();

        const wave = scene.physics.add.sprite(scene.player.x + dir * 28, scene.player.y - 2, WAVE_TEXTURE);
        wave.setFlipX(dir < 0).setDepth(12).setAlpha(0.95);
        const body = wave.body as Phaser.Physics.Arcade.Body;
        body.allowGravity = false;
        body.setSize(26, 44);
        wave.setVelocityX(dir * effect.speed);

        const damage = Math.max(1, Math.round(entities.equipment.equippedStats.damage * effect.damageMultiplier * entities.effects.damageMultiplier));
        let pierceLeft = effect.pierce;
        const hit = new Set<object>();
        const stop = (): void =>
        {
            if (wave.active) wave.destroy();
        };

        scene.physics.add.overlap(wave, scene.enemies, (_wave, other) =>
        {
            const enemy = other as Enemy;
            if (!wave.active || hit.has(enemy) || !enemy.active || enemy.entity.isDefeated) return;
            hit.add(enemy);
            this.combat.strikeEnemy(enemy, damage, dir);
            if (--pierceLeft <= 0) stop();
        });

        scene.physics.add.overlap(wave, scene.enemyProjectiles, (_wave, projectile) =>
        {
            (projectile as Phaser.GameObjects.GameObject).destroy();
            scene.particleManager.emitStompBurst(wave.x, wave.y);
        });

        const boss = scene.boss;
        if (boss)
        {
            scene.physics.add.overlap(wave, boss, () =>
            {
                if (!wave.active || hit.has(boss)) return;
                hit.add(boss);
                this.combat.strikeBoss(boss, Math.max(1, Math.round(damage * effect.bossShare)));
                stop();
            });
        }

        scene.tweens.add({ targets: wave, scaleY: { from: 0.85, to: 1.15 }, duration: 120, yoyo: true, repeat: -1 });
        scene.time.delayedCall((effect.rangePx / effect.speed) * 1000, stop);
        soundManager.playSlash();
        scene.cameras.main.shake(70, 0.002);
    }

    /** The wave's picture: a bright crescent drawn once. */
    private ensureWaveTexture (): void
    {
        const { scene } = this;
        if (scene.textures.exists(WAVE_TEXTURE)) return;
        const g = scene.make.graphics({ x: 0, y: 0 }, false);
        g.fillStyle(0x0ea5e9, 0.55);
        g.fillEllipse(24, 24, 40, 46);
        g.fillStyle(0x7dd3fc, 0.95);
        g.fillEllipse(20, 24, 26, 42);
        g.fillStyle(0x0f172a, 1);
        g.fillEllipse(10, 24, 24, 48);
        g.fillStyle(0xe0f2fe, 1);
        g.fillEllipse(26, 24, 6, 30);
        g.generateTexture(WAVE_TEXTURE, 48, 48);
        g.destroy();
    }
}
