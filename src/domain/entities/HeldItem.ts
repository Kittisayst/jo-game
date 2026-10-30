import type { Backpack } from './Backpack';

/**
 * The carried tool of a kind (`axe`, `pickaxe`, `hammer`), highest tier first, or null.
 * Tool ids follow `<kind>-t<tier>`, e.g. `axe-t1`.
 */
export function findTool (backpack: Backpack, kind: string): string | null
{
    const pattern = new RegExp(`^${kind}-t(\\d+)$`);
    let best: { id: string; tier: number } | null = null;

    for (const slot of backpack.getAllSlots())
    {
        const match = slot ? pattern.exec(slot.itemId) : null;
        if (slot && match && (!best || Number(match[1]) > best.tier))
        {
            best = { id: slot.itemId, tier: Number(match[1]) };
        }
    }
    return best?.id ?? null;
}

/** The tier of a tool from its id (`pickaxe-t2` is 2); 0 for anything that is not a tool id. */
export function toolTierOf (toolId: string): number
{
    const match = /-t(\d+)$/.exec(toolId);
    return match ? Number(match[1]) : 0;
}

export interface HeldItemContext
{
    inVillage: boolean;
    equippedWeaponId: string;
    /** The tool the hero is using right now (striking a node, repairing a gate), if any. */
    toolInUse: string | null;
}

/** What the hero holds, see "Held item" in CONTEXT.md: a tool in use, else the weapon in a Stage, else nothing. */
export function heldItemFor ({ inVillage, equippedWeaponId, toolInUse }: HeldItemContext): string | null
{
    if (toolInUse) return toolInUse;
    return inVillage ? null : equippedWeaponId;
}
