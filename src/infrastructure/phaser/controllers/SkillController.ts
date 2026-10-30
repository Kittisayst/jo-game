import { castSkillUseCase } from '../../../application/SkillUseCases';
import { soundManager } from '../../audio/SoundManager';
import { entities } from '../../composition';
import { getGameContent } from '../../content/ContentCatalog';
import type { SkillDefinition, WaveEffect } from '../../content/SkillCatalog';
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
        const result = castSkillUseCase(entities.skills, entities.skillCooldowns, skills, slot);
        if (!result.success) return;

        const skill = skills.find(s => s.id === result.skillId) as SkillDefinition;
        if (skill.effect.type === 'wave') this.castWave(skill.effect);
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
