/**
 * How far a Resource node has been worked: it gives its Materials only when the last Strike lands.
 * Pure non-spatial state and business rules, see "Resource node" and "Strike" in CONTEXT.md.
 */
export class ResourceNode
{
    private _strikesTaken = 0;

    constructor (readonly strikesNeeded: number)
    {
        if (!Number.isInteger(strikesNeeded) || strikesNeeded < 1)
        {
            throw new Error(`A Resource node needs a whole number of Strikes, at least 1 (got ${strikesNeeded})`);
        }
    }

    get strikesTaken (): number
    {
        return this._strikesTaken;
    }

    get isDepleted (): boolean
    {
        return this._strikesTaken >= this.strikesNeeded;
    }

    /** Counts one Strike; a depleted node ignores further Strikes. */
    registerStrike (): void
    {
        if (!this.isDepleted) this._strikesTaken++;
    }
}
