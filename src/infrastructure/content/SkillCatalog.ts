/** The skills of the hero, as authored in `public/data/skills.json`: how the Dash feels and the active skills. */

import type { DashTuning } from '../../domain/entities/MovementAbilities';
import type { SkillRule } from '../../application/SkillUseCases';
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
    effect: SkillEffect;
}

export interface SkillContent
{
    dash: DashTuning;
    active: SkillDefinition[];
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

    const seen = new Set<string>();
    const active = v.asArray(root.active, 'active').map((entry, i): SkillDefinition =>
    {
        const p = `active[${i}]`;
        const skill = v.asObject(entry, p);
        const id = v.asString(skill.id, `${p}.id`);
        if (seen.has(id)) v.fail(`${p}.id`, `unique (got ${id} twice)`);
        seen.add(id);

        const effect = v.asObject(skill.effect, `${p}.effect`);
        const type = v.asOneOf(effect.type, ['wave', 'chain'] as const, `${p}.effect.type`);
        const bossShare = v.asNumber(effect.bossShare, `${p}.effect.bossShare`);
        if (!(bossShare > 0 && bossShare <= 1)) v.fail(`${p}.effect.bossShare`, 'a number above 0 and at most 1');
        const e = `${p}.effect`;
        const parsedEffect: SkillEffect = type === 'wave'
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

        return {
            id,
            realm: v.asNumber(skill.realm, `${p}.realm`),
            name: v.asString(skill.name, `${p}.name`),
            icon: v.asString(skill.icon, `${p}.icon`),
            description: v.asString(skill.description, `${p}.description`),
            concept: v.asString(skill.concept, `${p}.concept`),
            cooldownMs: positive(skill, 'cooldownMs', p),
            effect: parsedEffect,
        };
    });

    return {
        dash: {
            speed: positive(dash, 'speed', 'movement.dash'),
            durationMs: positive(dash, 'durationMs', 'movement.dash'),
            dodgeMs: positive(dash, 'dodgeMs', 'movement.dash'),
            cooldownMs: positive(dash, 'cooldownMs', 'movement.dash'),
        },
        active,
    };
}
