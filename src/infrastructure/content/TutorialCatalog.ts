/** The hints of the first Stage as authored in `public/data/tutorial.json`. */

import type { TutorialStep } from '../../domain/entities/TutorialProgress';
import { makeValidators } from './validate';

export interface TutorialStepDefinition extends TutorialStep
{
    /** What the player is told to do, in the player's language. */
    text: string;
}

/** What can finish a step. `harvested:<node id>` is checked against `nodes.json` by ContentIntegrity.test.ts. */
export const FIXED_TUTORIAL_EVENTS = [
    'moved', 'enemy-defeated', 'backpack-opened', 'stage-cleared', 'book-fully-read', 'portal-shard-collected', 'portal-block-placed',
    'seed-collected', 'seed-planted',
] as const;
const HARVESTED = /^harvested:[a-z0-9-]+$/;

export function isTutorialEvent (event: string): boolean
{
    return (FIXED_TUTORIAL_EVENTS as readonly string[]).includes(event) || HARVESTED.test(event);
}

export function parseTutorial (raw: unknown): TutorialStepDefinition[]
{
    const v = makeValidators('tutorial.json');
    const ids = new Set<string>();

    return v.asArray(v.asObject(raw, 'root').steps, 'steps').map((entry, i) =>
    {
        const p = `steps[${i}]`;
        const step = v.asObject(entry, p);
        const id = v.asString(step.id, `${p}.id`);
        if (ids.has(id)) v.fail(`${p}.id`, `a different id (${id} appears twice)`);
        ids.add(id);

        const event = v.asString(step.event, `${p}.event`);
        if (!isTutorialEvent(event))
        {
            v.fail(`${p}.event`, `one of ${FIXED_TUTORIAL_EVENTS.join(', ')} or harvested:<node id>, got ${event}`);
        }

        const showAfter = v.optionalString(step.showAfter, `${p}.showAfter`);
        if (showAfter !== undefined && !isTutorialEvent(showAfter))
        {
            v.fail(`${p}.showAfter`, `one of ${FIXED_TUTORIAL_EVENTS.join(', ')} or harvested:<node id>, got ${showAfter}`);
        }

        return { id, event, text: v.asString(step.text, `${p}.text`), ...(showAfter !== undefined ? { showAfter } : {}) };
    });
}
