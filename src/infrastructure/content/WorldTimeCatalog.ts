/** `public/data/world-time.json`: the length of a day and when night falls (see `WorldTime`). */

import type { WorldTimeTuning } from '../../domain/entities/WorldTime';
import { makeValidators } from './validate';

export function parseWorldTime (raw: unknown): WorldTimeTuning
{
    const v = makeValidators('world-time.json');
    const root = v.asObject(raw, 'root');

    const dayLengthMinutes = v.asNumber(root.dayLengthMinutes, 'dayLengthMinutes');
    if (dayLengthMinutes < 2) v.fail('dayLengthMinutes', '2 minutes or more');

    const fraction = (key: string): number =>
    {
        const value = v.asNumber(root[key], key);
        if (value < 0 || value >= 1) v.fail(key, 'a number from 0 up to (not including) 1');
        return value;
    };
    const minutes = (key: string): number =>
    {
        const value = v.asNumber(root[key], key);
        if (value <= 0) v.fail(key, 'more than 0 minutes');
        return value;
    };

    const nightStartsAt = fraction('nightStartsAt');
    const duskMinutes = minutes('duskMinutes');
    const dawnMinutes = minutes('dawnMinutes');
    const startAt = fraction('startAt');
    const maxDarkness = v.asNumber(root.maxDarkness, 'maxDarkness');
    if (maxDarkness <= 0 || maxDarkness > 0.8) v.fail('maxDarkness', 'more than 0 and at most 0.8 (darker than that hides the platforms)');

    const dusk = duskMinutes / dayLengthMinutes;
    const dawn = dawnMinutes / dayLengthMinutes;
    if (nightStartsAt - dusk <= dawn) v.fail('nightStartsAt', 'late enough that dawn, a day and dusk fit before it');
    if (startAt < dawn || startAt >= nightStartsAt - dusk) v.fail('startAt', 'in the daytime (after dawn, before dusk)');

    return { dayLengthMinutes, nightStartsAt, duskMinutes, dawnMinutes, startAt, maxDarkness };
}
