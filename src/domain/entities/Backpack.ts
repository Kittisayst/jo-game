export interface BackpackSlot
{
    slotIndex: number;
    itemId: string;
    count: number;
}

export interface BackpackSlotSnapshot
{
    slotIndex: number;
    itemId: string;
    count: number;
}

export interface CraftingIngredient
{
    itemId: string;
    count: number;
}

export const BACKPACK_MAX_SLOTS = 20;

export const DEFAULT_ITEM_MAX_STACKS: Record<string, number> = {
    'wood': 99,
    'stone': 99,
    'iron-ore': 99,
    'herb': 99,
    'fiber': 99,
    'crystal': 99,
    'boss-core': 99,
    'repair-kit': 10,
    'herb-potion': 20,
    'axe-t1': 1,
    'pickaxe-t1': 1,
    'hammer-t1': 1,
    'wooden-sword': 1,
    'iron-sword': 1,
    'crystal-sword': 1,
};

export const MATERIAL_ITEM_IDS = new Set([
    'wood',
    'stone',
    'iron-ore',
    'herb',
    'fiber',
    'crystal',
    'boss-core',
]);

/** Materials that are never lost on death, so beating a Mini-boss or Boss is never wasted. */
export const STORY_ITEM_IDS = new Set([
    'crystal',
    'boss-core',
]);

export class Backpack
{
    private _slots: (BackpackSlot | null)[];

    constructor (initialSlots: BackpackSlotSnapshot[] = [])
    {
        this._slots = new Array(BACKPACK_MAX_SLOTS).fill(null);
        this.loadFromSnapshot(initialSlots);
    }

    get maxSlots (): number
    {
        return BACKPACK_MAX_SLOTS;
    }

    get usedSlotsCount (): number
    {
        return this._slots.filter(s => s !== null).length;
    }

    get isFull (): boolean
    {
        return this.usedSlotsCount >= BACKPACK_MAX_SLOTS;
    }

    getAllSlots (): (BackpackSlot | null)[]
    {
        return this._slots.map(s => (s ? { ...s } : null));
    }

    getSlot (index: number): BackpackSlot | null
    {
        if (index < 0 || index >= BACKPACK_MAX_SLOTS) return null;
        const s = this._slots[index];
        return s ? { ...s } : null;
    }

    getItemCount (itemId: string): number
    {
        let total = 0;
        for (const slot of this._slots)
        {
            if (slot && slot.itemId === itemId)
            {
                total += slot.count;
            }
        }
        return total;
    }

    getMaxStack (itemId: string, customMaxStack?: number): number
    {
        if (customMaxStack && customMaxStack > 0) return customMaxStack;
        return DEFAULT_ITEM_MAX_STACKS[itemId] ?? 99;
    }

    canAddItem (itemId: string, count: number, customMaxStack?: number): boolean
    {
        if (count <= 0) return true;
        const maxStack = this.getMaxStack(itemId, customMaxStack);

        let needed = count;

        // 1. Check existing matching slots with space
        for (const slot of this._slots)
        {
            if (slot && slot.itemId === itemId && slot.count < maxStack)
            {
                const space = maxStack - slot.count;
                needed -= space;
                if (needed <= 0) return true;
            }
        }

        // 2. Check empty slots
        const emptySlots = this._slots.filter(s => s === null).length;
        const slotsNeeded = Math.ceil(needed / maxStack);
        return emptySlots >= slotsNeeded;
    }

    addItem (itemId: string, count: number, customMaxStack?: number): { added: number; overflow: number }
    {
        if (count <= 0) return { added: 0, overflow: 0 };
        const maxStack = this.getMaxStack(itemId, customMaxStack);

        let remaining = count;

        // 1. Fill existing slots
        for (let i = 0; i < this._slots.length; i++)
        {
            const slot = this._slots[i];
            if (slot && slot.itemId === itemId && slot.count < maxStack)
            {
                const toAdd = Math.min(remaining, maxStack - slot.count);
                slot.count += toAdd;
                remaining -= toAdd;
                if (remaining <= 0) break;
            }
        }

        // 2. Fill empty slots
        if (remaining > 0)
        {
            for (let i = 0; i < this._slots.length; i++)
            {
                if (this._slots[i] === null)
                {
                    const toAdd = Math.min(remaining, maxStack);
                    this._slots[i] = {
                        slotIndex: i,
                        itemId,
                        count: toAdd,
                    };
                    remaining -= toAdd;
                    if (remaining <= 0) break;
                }
            }
        }

        const added = count - remaining;
        return { added, overflow: remaining };
    }

    removeItem (itemId: string, count: number): boolean
    {
        if (count <= 0) return true;
        if (this.getItemCount(itemId) < count)
        {
            return false;
        }

        let remaining = count;

        // Remove from slots starting from lowest filled or last
        for (let i = this._slots.length - 1; i >= 0; i--)
        {
            const slot = this._slots[i];
            if (slot && slot.itemId === itemId)
            {
                if (slot.count <= remaining)
                {
                    remaining -= slot.count;
                    this._slots[i] = null;
                }
                else
                {
                    slot.count -= remaining;
                    remaining = 0;
                }

                if (remaining <= 0) break;
            }
        }

        return true;
    }

    /**
     * Checks if backpack can craft an item:
     * 1. Player must possess all ingredient counts.
     * 2. After simulating consumption of ingredients, there must be room to receive the crafted item.
     */
    canCraftAfterRemoving (
        ingredients: CraftingIngredient[],
        resultItemId: string,
        resultCount: number,
        resultMaxStack?: number
    ): boolean
    {
        // Check ingredient sufficiency first
        for (const ing of ingredients)
        {
            if (this.getItemCount(ing.itemId) < ing.count)
            {
                return false;
            }
        }

        // Clone backpack slots
        const sim = new Backpack(this.toSnapshot());

        // Remove ingredients
        for (const ing of ingredients)
        {
            sim.removeItem(ing.itemId, ing.count);
        }

        // Check if result can be added
        return sim.canAddItem(resultItemId, resultCount, resultMaxStack);
    }

    /**
     * Applies 50% material loss upon death or emergency retreat.
     * Keeps 100% of weapons, tools, consumables, and story items (crystal, boss core).
     */
    applyRetreatPenalty (isMaterialFn?: (itemId: string) => boolean): { lost: { itemId: string; count: number }[] }
    {
        const lost: { itemId: string; count: number }[] = [];
        const isMaterial = isMaterialFn || ((id: string) => MATERIAL_ITEM_IDS.has(id) && !STORY_ITEM_IDS.has(id));

        for (let i = 0; i < this._slots.length; i++)
        {
            const slot = this._slots[i];
            if (slot && isMaterial(slot.itemId))
            {
                const lostCount = Math.ceil(slot.count * 0.5);
                const keptCount = slot.count - lostCount;

                lost.push({ itemId: slot.itemId, count: lostCount });

                if (keptCount <= 0)
                {
                    this._slots[i] = null;
                }
                else
                {
                    slot.count = keptCount;
                }
            }
        }

        return { lost };
    }

    clear (): void
    {
        this._slots = new Array(BACKPACK_MAX_SLOTS).fill(null);
    }

    removeSlot (index: number): boolean
    {
        if (index < 0 || index >= BACKPACK_MAX_SLOTS || this._slots[index] === null)
        {
            return false;
        }
        this._slots[index] = null;
        return true;
    }

    sortSlots (): void
    {
        const occupied = this._slots.filter((s): s is BackpackSlot => s !== null);
        occupied.sort((a, b) =>
        {
            if (a.itemId === b.itemId) return b.count - a.count;
            return a.itemId.localeCompare(b.itemId);
        });

        this.clear();
        for (let i = 0; i < occupied.length; i++)
        {
            this._slots[i] = {
                slotIndex: i,
                itemId: occupied[i].itemId,
                count: occupied[i].count,
            };
        }
    }

    toSnapshot (): BackpackSlotSnapshot[]
    {
        const snapshots: BackpackSlotSnapshot[] = [];
        for (const slot of this._slots)
        {
            if (slot && slot.count > 0)
            {
                snapshots.push({
                    slotIndex: slot.slotIndex,
                    itemId: slot.itemId,
                    count: slot.count,
                });
            }
        }
        return snapshots;
    }

    loadFromSnapshot (snapshots: BackpackSlotSnapshot[]): void
    {
        this.clear();
        for (const s of snapshots)
        {
            if (s.slotIndex >= 0 && s.slotIndex < BACKPACK_MAX_SLOTS && s.count > 0)
            {
                this._slots[s.slotIndex] = {
                    slotIndex: s.slotIndex,
                    itemId: s.itemId,
                    count: s.count,
                };
            }
        }
    }

    static fromSnapshot (snapshots: BackpackSlotSnapshot[]): Backpack
    {
        return new Backpack(snapshots);
    }
}

