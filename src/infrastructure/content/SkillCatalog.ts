/**
 * The skills of the hero, as authored in `public/data/skills.json`: how the Dash feels, the movement abilities
 * Bosses give, and the active skills with the three ranks of each.
 */

import type { DashTuning, MovementAbilityId } from '../../domain/entities/MovementAbilities';
import { MOVEMENT_ABILITY_IDS } from '../../domain/entities/MovementAbilities';
import { MAX_SKILL_RANK } from '../../domain/entities/SkillProgression';
import type { MovementUnlock } from '../../application/MovementUnlockUseCases';
import type { SkillRule } from '../../application/SkillUseCases';
import { parseDrops } from './NodeCatalog';
import { makeValidators } from './validate';

/** What a skill does when used. Each `type` has its own code in the scene (`SkillController`). */
export interface WaveEffect
{
    type: 'wave';
    /** Damage as a multiple of the hero's sword damage. */
    damageMultiplier: number;
    /** Speed of the wave in px/s. */
    speed: number;
    /** How far it flies before it fades. */
    rangePx: number;
    /** How many enemies it goes through before it stops. */
    pierce: number;
    /** Share of the damage a Boss takes (1 = all). */
    bossShare: number;
}

/** Lightning that jumps from enemy to enemy, hurting and stunning each one (Ping). */
export interface ChainEffect
{
    type: 'chain';
    damageMultiplier: number;
    /** How many enemies it can reach in a row. */
    jumps: number;
    /** How far from the hero the first enemy can be. */
    rangePx: number;
    /** How far the next enemy can be from the one before. */
    jumpRangePx: number;
    /** How long each enemy hit is stunned (not a Boss). */
    stunMs: number;
    /** Share of the damage a Boss takes (1 = all). A Boss is never stunned. */
    bossShare: number;
}

export type SkillEffect = WaveEffect | ChainEffect;

export interface SkillDefinition extends SkillRule
{
    name: string;
    icon: string;
    description: string;
    /** The idea from the Textbook the skill is named after, shown in the Academy. */
    concept: string;
    /** The effect at rank 1. */
    effect: SkillEffect;
    /** The effect at rank 1, 2 and 3 (the upgrades change some numbers of it). */
    effectByRank: readonly SkillEffect[];
}

export interface SkillContent
{
    dash: DashTuning;
    unlocks: MovementUnlock[];
    active: SkillDefinition[];
}

/** The effect a skill has at `rank` (1 to 3). */
export function effectAtRank (skill: SkillDefinition, rank: number): SkillEffect
{
    return skill.effectByRank[Math.min(MAX_SKILL_RANK, Math.max(1, rank)) - 1] ?? skill.effect;
}

export function parseSkills (raw: unknown): SkillContent
{
    const v = makeValidators('skills.json');
    const root = v.asObject(raw, 'root');
    const movement = v.asObject(root.movement, 'movement');
    const dash = v.asObject(movement.dash, 'movement.dash');
    const positive = (obj: Record<string, unknown>, key: string, path: string): number =>
    {
        const value = v.asNumber(obj[key], `${path}.${key}`);
        if (!(value > 0)) v.fail(`${path}.${key}`, 'a number above 0');
        return value;
    };

    function parseEffect (value: unknown, e: string): SkillEffect
    {
        const effect = v.asObject(value, e);
        const type = v.asOneOf(effect.type, ['wave', 'chain'] as const, `${e}.type`);
        const bossShare = v.asNumber(effect.bossShare, `${e}.bossShare`);
        if (!(bossShare > 0 && bossShare <= 1)) v.fail(`${e}.bossShare`, 'a number above 0 and at most 1');
        return type === 'wave'
            ? {
                type,
                damageMultiplier: positive(effect, 'damageMultiplier', e),
                speed: positive(effect, 'speed', e),
                rangePx: positive(effect, 'rangePx', e),
                pierce: positive(effect, 'pierce', e),
                bossShare,
            }
            : {
                type,
                damageMultiplier: positive(effect, 'damageMultiplier', e),
                jumps: positive(effect, 'jumps', e),
                rangePx: positive(effect, 'rangePx', e),
                jumpRangePx: positive(effect, 'jumpRangePx', e),
                stunMs: positive(effect, 'stunMs', e),
                bossShare,
            };
    }

    const unlocks = v.asArray(movement.unlocks ?? [], 'movement.unlocks').map((entry, i): MovementUnlock =>
    {
        const p = `movement.unlocks[${i}]`;
        const unlock = v.asObject(entry, p);
        const afterBossStage = v.asNumber(unlock.afterBossStage, `${p}.afterBossStage`);
        if (!Number.isInteger(afterBossStage) || afterBossStage < 10 || afterBossStage > 100 || afterBossStage % 10 !== 0)
        {
            v.fail(`${p}.afterBossStage`, 'the number of a Boss Stage (10, 20 ... 100)');
        }
        return { ability: v.asOneOf(unlock.ability, MOVEMENT_ABILITY_IDS as readonly MovementAbilityId[], `${p}.ability`), afterBossStage };
    });

    const seen = new Set<string>();
    const active = v.asArray(root.active, 'active').map((entry, i): SkillDefinition =>
    {
        const p = `active[${i}]`;
        const skill = v.asObject(entry, p);
        const id = v.asString(skill.id, `${p}.id`);
        if (seen.has(id)) v.fail(`${p}.id`, `unique (got ${id} twice)`);
        seen.add(id);

        const effect = parseEffect(skill.effect, `${p}.effect`);
        const cooldownMs = positive(skill, 'cooldownMs', p);

        // Each upgrade changes the cooldown and some numbers of the effect; the rest stays as it was
        const upgradesRaw = v.asArray(skill.upgrades, `${p}.upgrades`);
        if (upgradesRaw.length !== MAX_SKILL_RANK - 1) v.fail(`${p}.upgrades`, `exactly ${MAX_SKILL_RANK - 1} entries (rank 2 and rank 3)`);

        const rankCooldowns = [cooldownMs];
        const effectByRank: SkillEffect[] = [effect];
        const upgrades = upgradesRaw.map((u, j) =>
        {
            const up = `${p}.upgrades[${j}]`;
            const obj = v.asObject(u, up);
            const credit = v.asNumber(obj.credit, `${up}.credit`);
            if (credit < 0) v.fail(`${up}.credit`, 'a number from 0');
            const ingredients = parseDrops(v, obj.ingredients, `${up}.ingredients`).map(d => ({ itemId: d.itemId, count: d.count }));
            if (credit === 0 && ingredients.length === 0) v.fail(up, 'a cost (Credit or Materials)');

            rankCooldowns.push(obj.cooldownMs === undefined ? rankCooldowns[rankCooldowns.length - 1] : positive(obj, 'cooldownMs', up));
            const last = effectByRank[effectByRank.length - 1];
            const overrides = obj.effect === undefined ? {} : v.asObject(obj.effect, `${up}.effect`);
            const next: Record<string, unknown> = { ...last };
            for (const key of Object.keys(overrides))
            {
                if (key === 'type' || !(key in last)) v.fail(`${up}.effect.${key}`, `a number the ${last.type} effect has`);
                next[key] = positive(overrides, key, `${up}.effect`);
            }
            effectByRank.push(next as unknown as SkillEffect);
            return { credit, ingredients };
        });

        return {
            id,
            realm: v.asNumber(skill.realm, `${p}.realm`),
            name: v.asString(skill.name, `${p}.name`),
            icon: v.asString(skill.icon, `${p}.icon`),
            description: v.asString(skill.description, `${p}.description`),
            concept: v.asString(skill.concept, `${p}.concept`),
            cooldownMs,
            rankCooldowns,
            upgrades,
            effect,
            effectByRank,
        };
    });

    return {
        dash: {
            speed: positive(dash, 'speed', 'movement.dash'),
            durationMs: positive(dash, 'durationMs', 'movement.dash'),
            dodgeMs: positive(dash, 'dodgeMs', 'movement.dash'),
            cooldownMs: positive(dash, 'cooldownMs', 'movement.dash'),
        },
        unlocks,
        active,
    };
}
