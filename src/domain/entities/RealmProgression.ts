import { REALM_COUNT } from './StageNumber';

/**
 * Which Realms are open. Realm 1 always is; each next Realm opens for good when the Portal block of the Realm
 * before it is placed in the World Gate. Pure rules, see "Realm", "Portal block" and "World Gate" in CONTEXT.md.
 */
export class RealmProgression
{
    private _opened = new Set<number>([1]);

    get openedRealms (): number[]
    {
        return Array.from(this._opened).sort((a, b) => a - b);
    }

    isRealmOpen (realm: number): boolean
    {
        return this._opened.has(realm);
    }

    /**
     * Opens `realm`. It cannot skip a Realm (the one before must be open) and there are only ten.
     * Returns false when nothing changed.
     */
    openRealm (realm: number): boolean
    {
        if (!Number.isInteger(realm) || realm < 2 || realm > REALM_COUNT) return false;
        if (this._opened.has(realm) || !this._opened.has(realm - 1)) return false;

        this._opened.add(realm);
        return true;
    }

    reset (): void
    {
        this._opened = new Set([1]);
    }

    /** Replaces the opened Realms in place; anything that is not a Realm number is dropped and Realm 1 is always open. */
    loadFrom (realms: readonly number[]): void
    {
        this._opened = new Set([1]);
        for (const realm of [...realms].sort((a, b) => a - b))
        {
            if (Number.isInteger(realm) && realm >= 2 && realm <= REALM_COUNT && this._opened.has(realm - 1)) this._opened.add(realm);
        }
    }
}
