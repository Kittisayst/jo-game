import { DurabilityState, deathWearAmount, durabilityStateOf } from './Durability';
import { ItemCatalog } from './ItemCatalog';

export interface BackpackSlot
{
    slotIndex: number;
    itemId: string;
    count: number;
    /** Durability left. Missing means full (or that the item does not wear). Only items that wear are one to a slot. */
    durability?: number;
}

export interface BackpackSlotSnapshot
{
    slotIndex: number;
    itemId: string;
    count: number;
    durability?: number;
}

/** What wearing an item changed. */
export interface DurabilityChange
{
    itemId: string;
    previous: number;
    current: number;
    max: number;
}

export interface DurabilityReading
{
    current: number;
    max: number;
    state: DurabilityState;
}

export interface CraftingIngredient
{
    itemId: string;
    count: number;
}

export const BACKPACK_MAX_SLOTS = 30;

export class Backpack
{
    private _slots: (BackpackSlot | null)[];

    /** `maxSlots` is 30 for the hero's Backpack; the Storage chest uses the same rules with 40. */
    constructor (
        initialSlots: BackpackSlotSnapshot[] = [],
        private readonly _catalog: ItemCatalog = new ItemCatalog(),
        private readonly _maxSlots: number = BACKPACK_MAX_SLOTS
    )
    {
        this._slots = new Array(this._maxSlots).fill(null);
        this.loadFromSnapshot(initialSlots);
    }

    get maxSlots (): number
    {
        return this._maxSlots;
    }

    get usedSlotsCount (): number
    {
        return this._slots.filter(s => s !== null).length;
    }

    get isFull (): boolean
    {
        return this.usedSlotsCount >= this._maxSlots;
    }

    getAllSlots (): (BackpackSlot | null)[]
    {
        return this._slots.map(s => (s ? { ...s } : null));
    }

    getSlot (index: number): BackpackSlot | null
    {
        if (index < 0 || index >= this._maxSlots) return null;
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

    /** How worn the first slot holding `itemId` is, or null when the item is missing or never wears. */
    getDurability (itemId: string): DurabilityReading | null
    {
        const index = this._slots.findIndex(s => s !== null && s.itemId === itemId);
        return index < 0 ? null : this.getSlotDurability(index);
    }

    /** How worn the item in one slot is, or null for an empty slot or an item that never wears. */
    getSlotDurability (index: number): DurabilityReading | null
    {
        const slot = index >= 0 && index < this._maxSlots ? this._slots[index] : null;
        const max = slot ? this._catalog.maxDurabilityOf(slot.itemId) : undefined;
        if (!slot || max === undefined) return null;

        const current = Math.max(0, Math.min(max, slot.durability ?? max));
        return { current, max, state: durabilityStateOf(current, max) };
    }

    /** Wears the first slot holding `itemId` by `amount`. Returns null when the item is missing or never wears. */
    wearItem (itemId: string, amount = 1): DurabilityChange | null
    {
        const index = this._slots.findIndex(s => s !== null && s.itemId === itemId);
        return index < 0 ? null : this.wearSlot(index, amount);
    }

    /** Takes a tenth of the maximum off every item that wears (the hero died). Returns what changed. */
    wearAllDurable (): DurabilityChange[]
    {
        const changes: DurabilityChange[] = [];
        for (let i = 0; i < this._slots.length; i++)
        {
            const max = this._slots[i] ? this._catalog.maxDurabilityOf(this._slots[i]!.itemId) : undefined;
            if (max === undefined) continue;
            const change = this.wearSlot(i, deathWearAmount(max));
            if (change && change.current !== change.previous) changes.push(change);
        }
        return changes;
    }

    /**
     * Takes one `itemId` out of the first slot that holds it, keeping its Durability (for putting it on as Armor).
     * Returns null when there is none.
     */
    takeOne (itemId: string): { itemId: string; durability?: number } | null
    {
        const index = this._slots.findIndex(s => s !== null && s.itemId === itemId);
        if (index < 0) return null;

        const slot = this._slots[index]!;
        const taken = { itemId, ...(slot.durability !== undefined ? { durability: slot.durability } : {}) };
        this.removeFromSlot(index, 1);
        return taken;
    }

    /** Puts one worn item into an empty slot with the Durability it had. Returns false when the Backpack is full. */
    addWithDurability (itemId: string, durability?: number): boolean
    {
        const index = this._slots.findIndex(s => s === null);
        if (index < 0) return false;

        this._slots[index] = {
            slotIndex: index,
            itemId,
            count: 1,
            ...(durability !== undefined ? { durability } : {}),
        };
        return true;
    }

    /** Gives the first slot holding `itemId` its full Durability back. Returns false when it was missing or never wears. */
    restoreItem (itemId: string): boolean
    {
        const index = this._slots.findIndex(s => s !== null && s.itemId === itemId);
        if (index < 0 || this._catalog.maxDurabilityOf(itemId) === undefined) return false;
        delete this._slots[index]!.durability;
        return true;
    }

    private wearSlot (index: number, amount: number): DurabilityChange | null
    {
        const reading = this.getSlotDurability(index);
        const slot = this._slots[index];
        if (!reading || !slot) return null;

        const current = Math.max(0, reading.current - Math.max(0, amount));
        slot.durability = current;
        return { itemId: slot.itemId, previous: reading.current, current, max: reading.max };
    }

    getMaxStack (itemId: string): number
    {
        return this._catalog.maxStackOf(itemId);
    }

    canAddItem (itemId: string, count: number): boolean
    {
        if (count <= 0) return true;
        const maxStack = this.getMaxStack(itemId);

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

    addItem (itemId: string, count: number): { added: number; overflow: number }
    {
        if (count <= 0) return { added: 0, overflow: 0 };
        const maxStack = this.getMaxStack(itemId);

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
        resultCount: number
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
        const sim = new Backpack(this.toSnapshot(), this._catalog, this._maxSlots);

        // Remove ingredients
        for (const ing of ingredients)
        {
            sim.removeItem(ing.itemId, ing.count);
        }

        // Check if result can be added
        return sim.canAddItem(resultItemId, resultCount);
    }

    /**
     * Applies 50% material loss upon death or emergency retreat.
     * Keeps 100% of weapons, tools, consumables, and story items (crystal, boss core).
     */
    applyRetreatPenalty (): { lost: { itemId: string; count: number }[] }
    {
        const lost: { itemId: string; count: number }[] = [];

        for (let i = 0; i < this._slots.length; i++)
        {
            const slot = this._slots[i];
            if (slot && this._catalog.isLostOnRetreat(slot.itemId))
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
        this._slots = new Array(this._maxSlots).fill(null);
    }

    removeSlot (index: number): boolean
    {
        if (index < 0 || index >= this._maxSlots || this._slots[index] === null)
        {
            return false;
        }
        this._slots[index] = null;
        return true;
    }

    /** Removes `count` items from one slot; the slot empties when it reaches zero. */
    removeFromSlot (index: number, count: number): boolean
    {
        const slot = index >= 0 && index < this._maxSlots ? this._slots[index] : null;
        if (!slot || count <= 0 || count > slot.count)
        {
            return false;
        }

        if (count === slot.count)
        {
            this._slots[index] = null;
        }
        else
        {
            slot.count -= count;
        }
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
                ...(occupied[i].durability !== undefined ? { durability: occupied[i].durability } : {}),
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
                    ...(slot.durability !== undefined ? { durability: slot.durability } : {}),
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
            if (s.slotIndex >= 0 && s.slotIndex < this._maxSlots && s.count > 0)
            {
                this._slots[s.slotIndex] = {
                    slotIndex: s.slotIndex,
                    itemId: s.itemId,
                    count: s.count,
                    ...(typeof s.durability === 'number' ? { durability: Math.max(0, Math.floor(s.durability)) } : {}),
                };
            }
        }
    }

    static fromSnapshot (snapshots: BackpackSlotSnapshot[]): Backpack
    {
        return new Backpack(snapshots);
    }
}

