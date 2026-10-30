/**
 * How far each tool (axe, pickaxe) has been upgraded at the Workshop: +0 to +3, by the tool's item id
 * (so every Axe T1 the hero carries is the same level). An upgraded tool counts for more of a Strike
 * (see `toolStrikeWeight`), so a tree falls in fewer Strikes. Pure rules; see "Tool upgrade" in CONTEXT.md.
 */

export const MAX_TOOL_LEVEL = 3;

export class ToolUpgrades
{
    private readonly _levels = new Map<string, number>();

    getLevel (toolId: string): number
    {
        return this._levels.get(toolId) ?? 0;
    }

    canUpgrade (toolId: string): boolean
    {
        return this.getLevel(toolId) < MAX_TOOL_LEVEL;
    }

    /** Raises a tool by one level. Returns false at the top level. */
    upgrade (toolId: string): boolean
    {
        if (!this.canUpgrade(toolId)) return false;
        this._levels.set(toolId, this.getLevel(toolId) + 1);
        return true;
    }

    toSnapshot (): Record<string, number>
    {
        return Object.fromEntries(this._levels);
    }

    /** Loads a save; a level outside 1..3 or not a whole number is dropped. */
    loadFrom (levels: Record<string, number> | undefined): void
    {
        this._levels.clear();
        for (const [id, level] of Object.entries(levels ?? {}))
        {
            if (Number.isInteger(level) && level >= 1 && level <= MAX_TOOL_LEVEL) this._levels.set(id, level);
        }
    }
}
