import { describe, expect, it } from 'vitest';
import worldTime from '../../../public/data/world-time.json';
import { parseWorldTime } from './WorldTimeCatalog';

const copy = () => JSON.parse(JSON.stringify(worldTime)) as Record<string, unknown>;

describe('world-time.json', () =>
{
    it('reads the length of the day', () =>
    {
        const parsed = parseWorldTime(worldTime);
        expect(parsed.dayLengthMinutes).toBe(20);
        expect(parsed.nightStartsAt).toBe(0.7);
        expect(parsed.maxDarkness).toBe(0.55);
    });

    it('names the file and path of a mistake', () =>
    {
        expect(() => parseWorldTime({ ...copy(), dayLengthMinutes: 1 })).toThrow(/world-time\.json: dayLengthMinutes must be 2 minutes or more/);
        expect(() => parseWorldTime({ ...copy(), nightStartsAt: 1 })).toThrow(/nightStartsAt/);
        expect(() => parseWorldTime({ ...copy(), maxDarkness: 0.95 })).toThrow(/maxDarkness/);
        expect(() => parseWorldTime({ ...copy(), startAt: 0.9 })).toThrow(/startAt must be in the daytime/);
        expect(() => parseWorldTime({ ...copy(), nightStartsAt: 0.06 })).toThrow(/nightStartsAt/);
    });
});
