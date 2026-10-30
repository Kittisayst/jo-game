/** How long until each skill can be used again, in Game time. Not saved: a reload starts ready. */
export class SkillCooldowns
{
    private readonly _left = new Map<string, { remainingMs: number; totalMs: number }>();

    start (skillId: string, ms: number): void
    {
        if (ms > 0) this._left.set(skillId, { remainingMs: ms, totalMs: ms });
    }

    remainingMs (skillId: string): number
    {
        return this._left.get(skillId)?.remainingMs ?? 0;
    }

    /** 0 = ready, 1 = just used. */
    fraction (skillId: string): number
    {
        const entry = this._left.get(skillId);
        return entry ? entry.remainingMs / entry.totalMs : 0;
    }

    get anyActive (): boolean
    {
        return this._left.size > 0;
    }

    tick (deltaMs: number): void
    {
        if (!(deltaMs > 0)) return;
        for (const [id, entry] of this._left)
        {
            entry.remainingMs -= deltaMs;
            if (entry.remainingMs <= 0) this._left.delete(id);
        }
    }

    clear (): void
    {
        this._left.clear();
    }
}
