/** The skills of the hero, as authored in `public/data/skills.json`. For now only how the Dash feels. */

import type { DashTuning } from '../../domain/entities/MovementAbilities';
import { makeValidators } from './validate';

export interface SkillContent
{
    dash: DashTuning;
}

export function parseSkills (raw: unknown): SkillContent
{
    const v = makeValidators('skills.json');
    const movement = v.asObject(v.asObject(raw, 'root').movement, 'movement');
    const dash = v.asObject(movement.dash, 'movement.dash');
    const positive = (key: keyof DashTuning): number =>
    {
        const value = v.asNumber(dash[key], `movement.dash.${key}`);
        if (!(value > 0)) v.fail(`movement.dash.${key}`, 'a number above 0');
        return value;
    };
    return {
        dash: {
            speed: positive('speed'),
            durationMs: positive('durationMs'),
            dodgeMs: positive('dodgeMs'),
            cooldownMs: positive('cooldownMs'),
        },
    };
}
