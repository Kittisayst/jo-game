/**
 * Which Stages already had their night creatures in the current night. A Stage's night creatures walk it once a
 * night: leaving and coming back in the same night does not make new ones, so entering and leaving a Stage is no
 * way to farm XP (see "Night creature" in CONTEXT.md). A night is told from the next by `WorldTime.dayCount`.
 */
export interface NightHuntsSnapshot
{
    /** The `dayCount` of the night the list is about; -1 before the first. */
    nightId: number;
    /** Stage ids that had their night creatures that night. */
    stages: string[];
}

export class NightHunts
{
    private _nightId = -1;
    private readonly _stages = new Set<string>();

    /** True when `stageId` already had its night creatures in night `nightId`. */
    hasHunted (stageId: string, nightId: number): boolean
    {
        return this._nightId === nightId && this._stages.has(stageId);
    }

    /** Notes that `stageId` has its night creatures in night `nightId`. A new night starts a new list. */
    markHunted (stageId: string, nightId: number): void
    {
        if (this._nightId !== nightId)
        {
            this._nightId = nightId;
            this._stages.clear();
        }
        this._stages.add(stageId);
    }

    toSnapshot (): NightHuntsSnapshot
    {
        return { nightId: this._nightId, stages: [...this._stages] };
    }

    loadFrom (snapshot: Partial<NightHuntsSnapshot> | undefined): void
    {
        this._stages.clear();
        const id = snapshot?.nightId;
        this._nightId = typeof id === 'number' && Number.isInteger(id) && id >= -1 ? id : -1;
        for (const stage of snapshot?.stages ?? []) if (typeof stage === 'string') this._stages.add(stage);
    }
}
