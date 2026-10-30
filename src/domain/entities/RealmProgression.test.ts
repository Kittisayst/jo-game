import { describe, expect, it } from 'vitest';
import { RealmProgression } from './RealmProgression';

describe('RealmProgression', () =>
{
    it('starts with only Realm 1 open', () =>
    {
        const realms = new RealmProgression();

        expect(realms.openedRealms).toEqual([1]);
        expect(realms.isRealmOpen(1)).toBe(true);
        expect(realms.isRealmOpen(2)).toBe(false);
    });

    it('opens the next Realm once and says so', () =>
    {
        const realms = new RealmProgression();

        expect(realms.openRealm(2)).toBe(true);
        expect(realms.openRealm(2)).toBe(false);
        expect(realms.openedRealms).toEqual([1, 2]);
    });

    it('cannot skip a Realm, open Realm 1 again or open one that does not exist', () =>
    {
        const realms = new RealmProgression();

        expect(realms.openRealm(3)).toBe(false);
        expect(realms.openRealm(1)).toBe(false);
        expect(realms.openRealm(11)).toBe(false);
        expect(realms.openRealm(2.5)).toBe(false);
        expect(realms.openedRealms).toEqual([1]);
    });

    it('can open all ten, one after another', () =>
    {
        const realms = new RealmProgression();
        for (let realm = 2; realm <= 10; realm++) expect(realms.openRealm(realm)).toBe(true);

        expect(realms.openedRealms).toHaveLength(10);
    });

    it('loads saved Realms, keeping only a chain that starts at Realm 1', () =>
    {
        const realms = new RealmProgression();
        realms.loadFrom([2, 3, 5, 99, -1]);

        expect(realms.openedRealms).toEqual([1, 2, 3]);
    });

    it('goes back to Realm 1 on reset', () =>
    {
        const realms = new RealmProgression();
        realms.openRealm(2);
        realms.reset();

        expect(realms.openedRealms).toEqual([1]);
    });
});
