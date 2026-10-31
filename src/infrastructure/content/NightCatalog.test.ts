import { describe, expect, it } from 'vitest';
import enemies from '../../../public/data/enemies.json';
import stages from '../../../public/data/stages.json';
import { checkNightCreatures, parseNightTuning } from './ScalingCatalog';

const copy = () => JSON.parse(JSON.stringify(stages)) as { night: Record<string, unknown> };

describe('the night block of stages.json', () =>
{
    it('reads how night creatures appear', () =>
    {
        const parsed = parseNightTuning(stages);
        expect(parsed.creaturesPerScreen).toBe(1);
        expect(parsed.hpMultiplier).toBe(1.6);
        expect(parsed.xpMultiplier).toBe(1.5);
        expect(parsed.byRealm[1]).toEqual(['night-wisp']);
        expect(parsed.byRealm[3]).toEqual(['night-scarab']);
    });

    it('names the file and path of a mistake', () =>
    {
        const bad = (change: (night: Record<string, unknown>) => void) => { const c = copy(); change(c.night); return c; };
        expect(() => parseNightTuning(bad(n => { n.creaturesPerScreen = 0; }))).toThrow(/night\.creaturesPerScreen/);
        expect(() => parseNightTuning(bad(n => { n.hpMultiplier = 0.5; }))).toThrow(/night\.hpMultiplier must be 1 or more/);
        expect(() => parseNightTuning(bad(n => { n.xpMultiplier = 0.5; }))).toThrow(/night\.xpMultiplier/);
        expect(() => parseNightTuning(bad(n => { n.minDistanceFromHero = 100; }))).toThrow(/night\.minDistanceFromHero/);
        expect(() => parseNightTuning(bad(n => { n.byRealm = { 11: ['x'] }; }))).toThrow(/night\.byRealm\.11/);
        expect(() => parseNightTuning(bad(n => { n.byRealm = { 1: [] }; }))).toThrow(/night\.byRealm\.1 must be at least one/);
    });

    it('only lists enemies that exist and are night creatures', () =>
    {
        const night = parseNightTuning(stages);
        const list = enemies as { id: string; night?: boolean }[];
        expect(() => checkNightCreatures(night, list)).not.toThrow();
        expect(() => checkNightCreatures({ ...night, byRealm: { 1: ['nobody'] } }, list)).toThrow(/nobody is not there/);
        expect(() => checkNightCreatures({ ...night, byRealm: { 1: ['forest-slime'] } }, list)).toThrow(/forest-slime is not one/);
    });
});
